import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const getApiUrl = (path) => {
  if (!path) return API_BASE_URL || '/';
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
};

// Create axios instance with token in headers
export const apiClient = axios.create({
  baseURL: API_BASE_URL || '/'
});

// Add token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default getApiUrl;
