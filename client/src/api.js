const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const getApiUrl = (path) => {
  if (!path) return API_BASE_URL || '/';
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
};

export default getApiUrl;
