import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const IMAGE_BASE_URL = API_URL.replace('/api', '');


const api = axios.create({
  baseURL: API_URL,
});

console.log('API Base URL:', API_URL);


export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

export default api;
