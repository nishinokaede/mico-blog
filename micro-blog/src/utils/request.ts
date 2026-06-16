import axios from 'axios';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

// 请求拦截器：携带 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('microblog_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default request;
