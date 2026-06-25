import axios from 'axios';

// Determine the base URL for the API.
// In development, it will point to your local server, proxied by React.
// In production, it will be the URL of your deployed Railway backend.
const API_URL = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL
  : 'http://localhost:5000'; // Assuming local server runs on 5000

if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
  console.error("FATAL: REACT_APP_API_URL is not defined in the production environment. API calls will fail.");
}

// Create a reusable helper function to get the full API URL
export const getApiUrl = (path) => `${API_URL}${path}`;

// Create a pre-configured axios instance
export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // Important for sending cookies with requests if you use them
});

export default apiClient;