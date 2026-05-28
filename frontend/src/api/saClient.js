import axios from 'axios';

const saClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

saClient.interceptors.request.use(config => {
  const token = localStorage.getItem('zoniics_sa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

saClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('zoniics_sa_token');
      window.location.href = '/superadmin/login';
    }
    return Promise.reject(err);
  }
);

export default saClient;
