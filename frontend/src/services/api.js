import axios from 'axios';

// Update the baseURL to point to your backend on port 3000.
const baseURL = 'https://saharamexico-memphisski-3001.codio-box.uk/';
console.log("Using API URL:", baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable sending credentials if needed (for cookies)
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
