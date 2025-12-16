// src/api/axios.js

import axios from 'axios';

// Використовує змінну середовища або продакшн URL за замовчуванням
const baseURL = import.meta.env.VITE_API_URL || 'http://157.230.114.19/api';

const axiosInstance = axios.create({
    baseURL: baseURL,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor для обробки помилок відповіді
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Токен протух - перенаправити на логін
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;