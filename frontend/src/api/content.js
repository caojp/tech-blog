// src/api/content.js
import { apiRequest } from './request';

export const fetchCategories = async () => {
    return await apiRequest('/api/content', 'GET');
};

export const fetchMarkdownContent = async (filePath) => {
    return await apiRequest('/api/markdown', 'POST', { filePath });
};
