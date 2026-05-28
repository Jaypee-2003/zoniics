'use strict';

/**
 * twilio.service.js — Outbound AI Voice Calling via Twilio Media Streams (WebSocket).
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 *  Architecture overview
 *
 *  1. POST /api/twilio/outbound-call  (requireTenantAdmin)
 *       ↓  Validates customer + call limit, creates Twilio call
 *       ↓  Stores {customerId, tenantId, agentProfileId} in pendingCalls Map
 *       ↓  Twilio calls the customer; on answer, fetches TwiML from (2)
 *
 *  2. POST /api/twilio/stream-twiml/:token  (no auth — Twilio callback)
 *       ↓  Looks up the pending call by token
 *       ↓  Returns TwiML <Connect><Stream> pointing at our WS server
 *          with customerId + tenantId as custom params
 *
 *  3. WebSocket wss://<host>/streams  (Twilio Media Streams)
 *       ↓  'start'  → open Deepgram STT connection, hydrate session
 *       ↓  'media'  → forward mulaw audio to Deepgram
 *       ↓  Deepgram transcript → OpenAI (AgentProfile systemPrompt + history)
 *       ↓  OpenAI response → Google Cloud TTS → mulaw → back to Twilio WS
 *       ↓  'stop'   → classify lead outcome via GPT → persist to MongoDB
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID   — Twilio account SID
 *   TWILIO_AUTH_TOKEN    — Twilio auth token
 *   TWILIO_FROM_NUMBER   — The outbound caller-ID number (E.164)
 *   SERVER_URL           — Public HTTPS base URL (e.g. https://api.zoniics.ai)
 *   DEEPGRAM_API_KEY     — Deepgram API key
 *   OPENAI_API_KEY       — OpenAI API key
 *   GOOGLE_APPLICATION_CREDENTIALS — Path to GCP service-account JSON for TTS
 *
 * NPM dependencies (add to package.json):
 *   twilio, ws, openai, @deepgram/sdk, @google-cloud/text-to-speech, crypto
 * ┌─────────────────────────────────────────────────────────────────────────┘
 */

const express        = require('express');
const WebSocket      = require('ws');
const twilio         = require('twilio');
const OpenAI         = require('openai');
const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');
const textToSpeech   = require('@google-cloud/text-to-speech');

const { Customer, Interaction, DailyUsage, AgentProfile } = require('../models/models');
const { requireTenantAdmin }  = require('../middleware/auth.middleware');
const pendingCalls            = require('../lib/pendingCalls');

const router = express.Router();

// ─── Client Instances ─────────────────────────────────────────────────────────

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const ttsClient = new textToSpeech.TextToSpeechClient();

// ─── Active Call Sessions ─────────────────────────────────────────────────────
//
// One session object per live Twilio Media Stream, keyed by streamSid.

/**
 * @typedef {Object} CallSession
 * @property {string}   streamSid        — Twilio stream SID
 * @property {string}   callSid          — Twilio call SID
 * @property {string}   customerId       — Mongoose ObjectId string
 * @property {string}   tenantId         — Mongoose ObjectId string
 * @property {string}   agentProfileId   — Mongoose ObjectId string
 * @property {string}   systemPrompt     — Hydrated from AgentProfile
 * @property {Array}    history          — OpenAI-format message history
 * @property {string}   pendingTranscript — Accumulates partial STT output
 * @property {boolean}  isProcessing      — Debounce flag while GPT/TTS runs
 * @property {object}   deepgramConn     — Live Deepgram connection handle
 * @property {WebSocket} twilioWs        — The open WS connection to Twilio
 */

/** @type {Map<string, CallSession>} */
const activeSessions = new Map();

// ─── Utility: today() ────────────────────────────────────────────────────────

/**
 * Returns the current date as "YYYY-MM-DD" in UTC — matches the DailyUsage
 * index key format.
 * @returns {string}
 */
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Utility: mulaw encoding ──────────────────────────────────────────────────
//
// Twilio Media Streams use 8 kHz mono μ-law (G.711).
// These pure-JS utilities convert 16-bit PCM ↔ μ-law without any native deps.

const MULAW_BIAS = 0x84;
const MULAW_CLIP = 32635;

/**
 * linearSampleToMulaw(sample)
 * Encodes a single signed 16-bit PCM sample to a μ-law byte.
 *
 * @param   {number} sample — int16 PCM sample value (-32768..32767)
 * @returns {number} — uint8 μ-law byte
 */
function linearSampleToMulaw(sample) {
  let sign = 0;

  if (sample < 0) {
    sign   = 0x80;
    sample = -sample;
  }

  if (sample > MULAW_CLIP) sample = MULAW_CLIP;

  sample += MULAW_BIAS;

  let exponent = 7;
  for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1) {
    // walk down until we find the highest set bit
  }

  const mantissa  = (sample >> (exponent + 3)) & 0x0f;
  const mulawByte = ~(sign | (exponent << 4) | mantissa);

  return mulawByte & 0xff;
}

/**
 * pcm16LeToMulaw(pcmBuffer)
 * Converts a Buffer of little-endian 16-bit PCM samples to μ-law.
 * Input:  Buffer  — 8 kHz, mono, 16-bit signed PCM (little-endian)
 * Output: Buffer  — 8 kHz, mono, 8-bit μ-law
 *
 * @param   {Buffer} pcmBuffer
 * @returns {Buffer}
 */
function pcm16LeToMulaw(pcmBuffer) {
  const sampleCount = Math.floor(pcmBuffer.length / 2);
  const output      = Buffer.alloc(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const sample = pcmBuffer.readInt16LE(i * 2);
    output[i]    = linearSampleToMulaw(sample);
  }

  return output;
}

// ─── TTS: synthesizeSpeech ────────────────────────────────────────────────────

/**
 * synthesizeSpeech(text)
 *
 * Converts text to μ-law 8 kHz mono audio using Google Cloud TTS.
 * Google's MULAW encoding option outputs the exact format Twilio expects,
 * which means no post-processing or format conversion is required.
 *
 * To swap providers:
 *  - Replace the body of this function with any TTS client call that returns
 *    a Buffer of 8 kHz mono μ-law audio.
 *  - If your provider outputs PCM, pipe the result through pcm16LeToMulaw().
 *
 * @param   {string} text   — UTF-8 response text from OpenAI
 * @returns {Promise<Buffer>} — μ-law encoded audio ready for Twilio
 */
async function synthesizeSpeech(text) {
  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'en-US',
      name:         'en-US-Neural2-J', // Natural-sounding male voice; change as needed
      ssmlGender:   'MALE',
    },
    audioConfig: {
      audioEncoding:    'MULAW',
      sampleRateHertz:  8000,
    },
  });

  // response.audioContent is already a Buffer of raw μ-law bytes.
  return Buffer.from(response.audioContent);
}

// ─── STT: openDeepgramConnection ─────────────────────────────────────────────

/**
 * openDeepgramConnection(session)
 *
 * Opens a Deepgram Live Transcription WebSocket for the given call session and
 * wires all event handlers.  The connection is stored on session.deepgramConn
 * so the caller can pipe audio chunks to it and close it on call end.
 *
 * @param {CallSession} session
 */
function openDeepgramConnection(session) {
  const connection = deepgram.listen.live({
    model:            'nova-2-phonecall',  // Optimised for telephone audio
    language:         'en-US',
    encoding:         'mulaw',
    sample_rate:      8000,
    channels:         1,
    punctuate:        true,
    smart_format:     true,
    endpointing:      300,         // ms of silence before Deepgram ends the utterance
    utterance_end_ms: 1000,        // emit UtteranceEnd after 1 s of post-utterance silence
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log(`[Deepgram] Connection open — stream: ${session.streamSid}`);
  });

  // Accumulate interim transcript text.
  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const alt        = data?.channel?.alternatives?.[0];
    const transcript = alt?.transcript ?? '';

    if (!transcript) return;

    if (data.is_final) {
      session.pendingTranscript += ` ${transcript}`.trimStart();
    }
  });

  // UtteranceEnd fires when the speaker has paused long enough.
  // This is our trigger to dispatch the accumulated transcript to OpenAI.
  connection.on(LiveTranscriptionEvents.UtteranceEnd, async () => {
    const utterance = session.pendingTranscript.trim();
    session.pendingTranscript = '';

    if (!utterance || session.isProcessing) return;

    await handleUtterance(session, utterance);
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error(`[Deepgram] Error — stream: ${session.streamSid}`, err);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log(`[Deepgram] Connection closed — stream: ${session.streamSid}`);
  });

  session.deepgramConn = connection;
}

// ─── LLM: handleUtterance ────────────────────────────────────────────────────

/**
 * handleUtterance(session, utterance)
 *
 * Core AI turn:
 *  1. Appends the customer's utterance to the conversation history.
 *  2. Sends the full history + agent system prompt to OpenAI.
 *  3. Synthesizes the response to μ-law audio.
 *  4. Streams the audio back to Twilio over the live WebSocket.
 *  5. Saves both turns to the Interaction collection for audit / analytics.
 *
 * @param {CallSession} session
 * @param {string}      utterance — finalized STT transcript
 */
async function handleUtterance(session, utterance) {
  session.isProcessing = true;

  try {
    // Append the customer turn to the rolling conversation history.
    session.history.push({ role: 'user', content: utterance });

    // Build the OpenAI request.  System prompt from AgentProfile; history gives
    // the model context for multi-turn conversations.
    const completion = await openai.chat.completions.create({
      model:      'gpt-4o-mini',
      max_tokens: 200,  // Keep phone responses concise — long monologues lose callers.
      messages:   [
        { role: 'system', content: session.systemPrompt },
        ...session.history,
      ],
    });

    const aiResponse = completion.choices[0].message.content.trim();

    // Append the AI turn to history so subsequent utterances have full context.
    session.history.push({ role: 'assistant', content: aiResponse });

    // Synthesize audio and stream it back to Twilio.
    const mulawBuffer      = await synthesizeSpeech(aiResponse);
    const base64AudioChunk = mulawBuffer.toString('base64');

    if (session.twilioWs.readyState === WebSocket.OPEN) {
      session.twilioWs.send(
        JSON.stringify({
          event:     'media',
          streamSid: session.streamSid,
          media:     { payload: base64AudioChunk },
        })
      );

      // Send a 'mark' event so Twilio tells us when it finishes playing this audio.
      session.twilioWs.send(
        JSON.stringify({
          event:     'mark',
          streamSid: session.streamSid,
          mark:      { name: `response_${Date.now()}` },
        })
      );
    }

    // Persist both turns as Interaction records for the chat log.
    const interactionBase = {
      tenantId:   session.tenantId,
      customerId: session.customerId,
      channel:    'voice',
    };

    await Interaction.insertMany([
      { ...interactionBase, role: 'user', message: utterance  },
      { ...interactionBase, role: 'ai',   message: aiResponse },
    ]);

  } catch (err) {
    console.error(`[handleUtterance] Error — stream: ${session.streamSid}`, err.message);
  } finally {
    session.isProcessing = false;
  }
}

// ─── Lead Outcome Classification ─────────────────────────────────────────────

/**
 * classifyLeadOutcome(history)
 *
 * Sends the entire conversation history to OpenAI at the end of a call and
 * asks it to classify the customer's intent into one of three categories that
 * map directly to the Customer.leadOutcome enum.
 *
 * Returns 'no_answer' as a safe fallback if classification fails.
 *
 * @param   {Array}  history — OpenAI-format conversation messages
 * @returns {Promise<'interested'|'not_interested'|'no_answer'>}
 */
async function classifyLeadOutcome(history) {
  if (!history || history.length === 0) return 'no_answer';

  const classificationPrompt = [
    {
      role:    'system',
      content: `You are a sales call analyst.
Based on the conversation transcript below, classify the customer's outcome as EXACTLY one of:
  - interested        (customer expressed genuine interest or asked to be followed up)
  - not_interested    (customer clearly and explicitly declined)
  - no_answer         (call ended without a clear resolution, or the customer was unreachable)

Respond with ONLY one of those three exact words — no punctuation, no explanation.`,
    },
    ...history,
    {
      role:    'user',
      content: 'Based on the above conversation, what is the lead outcome?',
    },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model:      'gpt-4o-mini',
      max_tokens: 10,
      temperature: 0,  // Deterministic classification
      messages:   classificationPrompt,
    });

    const raw = completion.choices[0].message.content.trim().toLowerCase();

    if (raw === 'interested')     return 'interested';
    if (raw === 'not_interested') return 'not_interested';
    return 'no_answer';

  } catch (err) {
    console.error('[classifyLeadOutcome] OpenAI error — defaulting to no_answer', err.message);
    return 'no_answer';
  }
}

// ─── WebSocket Handler ────────────────────────────────────────────────────────

/**
 * handleTwilioStream(ws)
 *
 * Called each time Twilio establishes a new Media Stream WebSocket connection.
 * Manages the full call lifecycle: start → media chunks → stop.
 *
 * Message schema from Twilio:
 *  { event: 'start',  start:  { streamSid, callSid, customParameters: {...} } }
 *  { event: 'media',  media:  { track, chunk, timestamp, payload: '<base64>' } }
 *  { event: 'mark',   mark:   { name } }  — Twilio ack after we send a mark
 *  { event: 'stop',   stop:   { streamSid, callSid, accountSid } }
 *
 * @param {WebSocket} ws
 */
async function handleTwilioStream(ws) {
  /** @type {CallSession|null} */
  let session = null;

  ws.on('message', async (rawMessage) => {
    let message;

    try {
      message = JSON.parse(rawMessage);
    } catch {
      console.warn('[WS] Received non-JSON frame — ignoring');
      return;
    }

    switch (message.event) {

      // ── start ──────────────────────────────────────────────────────────────
      // Twilio fires this once when the stream is established.
      case 'start': {
        const { streamSid, callSid, customParameters } = message.start;
        const { customerId, tenantId, agentProfileId } = customParameters || {};

        if (!customerId || !tenantId || !agentProfileId) {
          console.error('[WS] start event is missing required custom parameters — closing');
          ws.close(1008, 'Missing call metadata');
          return;
        }

        // Hydrate the AgentProfile so we have the system prompt ready.
        const agentProfile = await AgentProfile.findById(agentProfileId).lean();
        if (!agentProfile) {
          console.error(`[WS] AgentProfile ${agentProfileId} not found — closing`);
          ws.close(1008, 'Agent profile not found');
          return;
        }

        // Mark the customer as 'calling' so the dialer worker skips duplicates.
        await Customer.findOneAndUpdate(
          { _id: customerId, tenantId },
          { $set: { callStatus: 'calling' } }
        );

        session = {
          streamSid,
          callSid,
          customerId,
          tenantId,
          agentProfileId,
          systemPrompt:      agentProfile.systemPrompt,
          history:           [],
          pendingTranscript: '',
          isProcessing:      false,
          deepgramConn:      null,
          twilioWs:          ws,
        };

        activeSessions.set(streamSid, session);

        openDeepgramConnection(session);

        console.log(`[WS] Call session started — stream: ${streamSid} | customer: ${customerId}`);
        break;
      }

      // ── media ──────────────────────────────────────────────────────────────
      // Each frame contains a base64-encoded chunk of μ-law inbound audio.
      case 'media': {
        if (!session || !session.deepgramConn) return;

        // Only process the inbound track (customer's voice).
        if (message.media.track !== 'inbound') return;

        const audioBuffer = Buffer.from(message.media.payload, 'base64');

        // Forward raw μ-law audio to Deepgram.
        session.deepgramConn.send(audioBuffer);
        break;
      }

      // ── mark ───────────────────────────────────────────────────────────────
      // Twilio echoes back a mark event after it finishes playing audio we sent.
      // Use this to implement barge-in (interrupt AI when customer starts speaking).
      case 'mark': {
        // For now we just acknowledge — barge-in logic can be added here.
        break;
      }

      // ── stop ───────────────────────────────────────────────────────────────
      // Twilio fires this when the call ends (either party hung up).
      case 'stop': {
        if (!session) return;

        console.log(`[WS] Call ended — stream: ${session.streamSid}`);

        // Close the Deepgram connection cleanly.
        if (session.deepgramConn) {
          session.deepgramConn.finish();
        }

        // Classify the lead outcome from the full conversation history.
        const outcome = await classifyLeadOutcome(session.history);

        // Persist outcome and mark call as completed.
        await Customer.findOneAndUpdate(
          { _id: session.customerId, tenantId: session.tenantId },
          {
            $set: {
              callStatus:  'completed',
              leadOutcome: outcome,
            },
          }
        );

        // Increment today's callsMade counter (upsert so the document is created
        // automatically on the first call of each day).
        await DailyUsage.findOneAndUpdate(
          { tenantId: session.tenantId, date: todayUTC() },
          { $inc: { callsMade: 1 } },
          { upsert: true, new: true }
        );

        console.log(
          `[WS] Session closed — stream: ${session.streamSid} | outcome: ${outcome}`
        );

        activeSessions.delete(session.streamSid);
        session = null;
        break;
      }

      default:
        // Unknown events from Twilio (e.g. 'dtmf', future event types) — safe to ignore.
        break;
    }
  });

  ws.on('error', (err) => {
    console.error('[WS] WebSocket error:', err.message);
    if (session) activeSessions.delete(session.streamSid);
  });

  ws.on('close', () => {
    // If the socket closes without a 'stop' event (network drop, etc.) we still
    // clean up any orphaned session state.
    if (session) {
      console.warn(`[WS] Socket closed without stop event — stream: ${session.streamSid}`);
      if (session.deepgramConn) session.deepgramConn.finish();
      activeSessions.delete(session.streamSid);
    }
  });
}

// ─── Route: POST /api/twilio/outbound-call ────────────────────────────────────

/**
 * Initiates an outbound AI call to a specific Customer record.
 *
 * Body (JSON):
 *   customerId     {string}  — Customer _id to call
 *   agentProfileId {string}  — AgentProfile _id to use
 *
 * The endpoint:
 *  1. Validates the customer belongs to the authenticated tenant (3-tier isolation).
 *  2. Skips customers flagged as 'do_not_call'.
 *  3. Registers a pending-call token and instructs Twilio to initiate the call.
 *
 * Note: the daily call-limit check is a separate `checkDailyCallLimit` middleware
 * (defined in routes.js) that should be composed BEFORE this handler on the route.
 */
router.post(
  '/outbound-call',
  requireTenantAdmin,
  async (req, res) => {
    const { customerId, agentProfileId } = req.body;

    if (!customerId || !agentProfileId) {
      return res.status(400).json({ error: 'customerId and agentProfileId are required.' });
    }

    // ── Validate customer exists and belongs to this tenant ──────────────────
    const customer = await Customer.findOne({
      _id:      customerId,
      tenantId: req.tenantId,
    }).lean();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found in this tenant.' });
    }

    if (customer.status === 'do_not_call') {
      return res.status(422).json({ error: 'This customer is marked do_not_call.' });
    }

    if (customer.callStatus === 'calling') {
      return res.status(409).json({ error: 'A call to this customer is already in progress.' });
    }

    // ── Validate the AgentProfile exists ────────────────────────────────────
    // (Super Admin creates these; tenant_admin only needs to reference the _id)
    const agentExists = await AgentProfile.exists({ _id: agentProfileId });
    if (!agentExists) {
      return res.status(404).json({ error: 'AgentProfile not found.' });
    }

    // ── Register the pending call and generate the TwiML callback URL ────────
    const streamToken = pendingCalls.register({
      customerId:     customerId,
      tenantId:       req.tenantId,
      agentProfileId: agentProfileId,
    });

    const twimlCallbackUrl =
      `${process.env.SERVER_URL}/api/twilio/stream-twiml/${streamToken}`;

    // ── Instruct Twilio to place the call ────────────────────────────────────
    const call = await twilioClient.calls.create({
      to:     customer.phone,
      from:   process.env.TWILIO_FROM_NUMBER,
      url:    twimlCallbackUrl,
      method: 'POST',
    });

    console.log(
      `[Twilio] Call initiated — SID: ${call.sid} | customer: ${customerId} | token: ${streamToken}`
    );

    return res.status(202).json({
      message:   'Call initiated successfully.',
      callSid:   call.sid,
      customerId,
    });
  }
);

// ─── Route: POST /api/twilio/stream-twiml/:token ──────────────────────────────

/**
 * TwiML callback — called by Twilio when the outbound call is answered.
 * Returns a TwiML <Response> that instructs Twilio to open a Media Stream
 * WebSocket back to our server, passing the call metadata as custom parameters.
 *
 * This endpoint has NO authentication because the caller is Twilio's infrastructure,
 * not a browser.  The opaque token in the URL acts as a one-time secret.
 */
router.post('/stream-twiml/:token', (req, res) => {
  const { token } = req.params;
  const entry     = pendingCalls.consume(token);

  if (!entry) {
    // Expired or invalid token — tell Twilio to hang up gracefully.
    const hangupTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We are unable to connect your call at this time. Goodbye.</Say>
  <Hangup/>
</Response>`;
    return res.type('text/xml').send(hangupTwiml);
  }

  // Build the WebSocket URL for the Media Stream.
  // SERVER_URL is typically "https://api.zoniics.ai"; the WS server listens on
  // the same host via the upgraded HTTP server (wss://).
  const wsUrl = process.env.SERVER_URL
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://');

  const streamUrl = `${wsUrl}/streams`;

  // TwiML <Stream> custom parameters are sent in the 'start' WebSocket event,
  // letting the WS handler identify which customer and agent profile to use
  // without maintaining server-side state beyond the short-lived pendingCalls Map.
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}" track="inbound_track">
      <Parameter name="customerId"     value="${entry.customerId}"     />
      <Parameter name="tenantId"       value="${entry.tenantId}"       />
      <Parameter name="agentProfileId" value="${entry.agentProfileId}" />
    </Stream>
  </Connect>
</Response>`;

  return res.type('text/xml').send(twiml);
});

// ─── WebSocket Server Factory ─────────────────────────────────────────────────

/**
 * attachWebSocketServer(httpServer)
 *
 * Attaches the Twilio Media Streams WebSocket server to the application's HTTP
 * server.  Must be called AFTER app.listen() returns so that `httpServer` is
 * fully initialised.
 *
 * Usage in server.js:
 *
 *   const http   = require('http');
 *   const { twilioRouter, attachWebSocketServer } = require('./services/twilio.service');
 *
 *   app.use('/api/twilio', twilioRouter);
 *
 *   const httpServer = http.createServer(app);
 *   attachWebSocketServer(httpServer);
 *   httpServer.listen(PORT);
 *
 * @param {import('http').Server} httpServer
 */
function attachWebSocketServer(httpServer) {
  const wss = new WebSocket.Server({
    server: httpServer,
    path:   '/streams',
  });

  wss.on('connection', (ws) => {
    handleTwilioStream(ws).catch((err) => {
      console.error('[WS] Unhandled error in stream handler:', err);
    });
  });

  wss.on('error', (err) => {
    console.error('[WSS] WebSocket server error:', err);
  });

  console.log('[Twilio] Media Streams WebSocket server attached at /streams');
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  twilioRouter:          router,
  attachWebSocketServer,
};
