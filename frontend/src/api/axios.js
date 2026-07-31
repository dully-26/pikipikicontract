import axios from 'axios';

const api = axios.create({
  baseURL: 'https://pikipikicontract.onrender.com/api',
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Allow Axios/browser to set the correct multipart boundary for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const isAuthRoute =
      error.config?.url?.includes('/login') ||
      error.config?.url?.includes('/register') ||
      error.config?.url?.includes('/forgot-password') ||
      error.config?.url?.includes('/reset-password');

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;

