// src/api/request.js
const API_URL = import.meta.env.VITE_API_URL;

export const apiRequest = async (url, method = 'GET', body = null) => {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${url}`, options);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        if (response.headers.get('content-type').includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};