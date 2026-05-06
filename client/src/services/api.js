import axios from 'axios';

const API_URL = '/api';

export const IMAGE_BASE_URL = API_URL.replace('/api', '');


const api = axios.create({
  baseURL: API_URL,
  withCredentials: false
});

console.log('API Base URL:', API_URL);


export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

export default api;
