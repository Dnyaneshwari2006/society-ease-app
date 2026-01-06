import axios from 'axios';

const API = axios.create({
    baseURL: 'http://192.168.31.29:5000' // Do NOT add /api/auth here
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