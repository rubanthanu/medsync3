import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost/medsync3/uwu-medsync-api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
