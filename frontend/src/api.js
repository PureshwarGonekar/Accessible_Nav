import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
    //   localStorage.removeItem('token');
    //   localStorage.removeItem('currentUser');
    //   window.location.href = '/'; // Simple redirect to login
    // Commented out to prevent loops if logic isn't perfect, 
    // but useful for production.
    }
    return Promise.reject(error);
  }
);

export default api;
