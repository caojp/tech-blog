// src/api/content.js
import { apiRequest } from './request';

export const fetchCategories = async () => {
    return await apiRequest('/api/content', 'GET');
};

export const fetchMarkdownContent = async (filePath) => {
    console.log('请求路径:', filePath);
    // Base64 encode filePath to support non-Latin1 characters (e.g. Chinese)
    let encodedFilePath;
    if (typeof btoa === 'function') {
        const bytes = new TextEncoder().encode(filePath);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        encodedFilePath = btoa(binary);
    } else {
        encodedFilePath = Buffer.from(filePath, 'utf-8').toString('base64');
    }
    return await apiRequest('/api/markdown', 'POST', { filePath: encodedFilePath });
};
