import axios from 'axios';

const API = axios.create({
    baseURL: 'https://society-ease-backend.onrender.com' // Do NOT add /api/auth here
});

// Check your api.js/axios config
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;