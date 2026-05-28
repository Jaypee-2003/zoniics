import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('zoniics_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear auth and redirect to login
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('zoniics_token');
      localStorage.removeItem('zoniics_tenant_id');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
