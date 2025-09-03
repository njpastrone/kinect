const getApiUrl = () => {
  // In production on Render, use environment variable or fallback
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://kinect-api.onrender.com/api';
  }
  return '/api'; // Development proxy
};

export default getApiUrl;