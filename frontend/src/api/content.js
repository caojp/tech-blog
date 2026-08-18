// src/api/content.js
import { apiRequest } from './request';

export const fetchCategories = async () => {
    return await apiRequest('/api/content', 'GET');
};

export const fetchMarkdownContent = async (filePath) => {
    console.log('请求路径:', filePath);
    // 对filePath进行Base64编码
    const encodedFilePath = btoa(filePath);
    return await apiRequest('/api/markdown', 'POST', { filePath: encodedFilePath });
};
