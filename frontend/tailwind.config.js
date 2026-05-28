/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        z: {
          bg:      '#f4f7ff',
          surface: '#eaeffd',
          card:    '#ffffff',
          border:  '#dce6f8',
          blue:    '#4f7ef7',
          purple:  '#8b5cf6',
          muted:   '#64748b',
          text:    '#111827',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4f7ef7 0%, #8b5cf6 100%)',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(79,126,247,0.08), 0 1px 2px -1px rgba(79,126,247,0.06)',
        'card-hover': '0 8px 30px -4px rgba(79,126,247,0.18)',
      },
    },
  },
  plugins: [],
};
