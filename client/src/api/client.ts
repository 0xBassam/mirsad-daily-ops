import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('mirsad_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mirsad_token');
      localStorage.removeItem('mirsad_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default apiClient;
