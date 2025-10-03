import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://3.121.188.223/api', // <-- Ваш реальний домен
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

export default axiosInstance;
