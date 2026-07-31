
import api from '../api/axios';

// Get Laravel backend origin
// Example:
// http://127.0.0.1:8000/api -> http://127.0.0.1:8000
const API_ORIGIN = (api.defaults.baseURL || '')
  .replace(/\/api\/?$/, '');

export const storageUrl = (path) => {
  if (!path) return null;

  // Cloudinary or any complete URL
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('//')
  ) {
    return path;
  }

  // Old Laravel storage paths
  return `${API_ORIGIN}/storage/${path.replace(/^\/+/, '')}`;
};

