// src/api/content.js
import { apiRequest } from './request';

export const fetchCategories = async () => {
    return await apiRequest('/v1/api/content', 'GET');
};

export const fetchMarkdownContent = async (filePath) => {
    return await apiRequest('/v1/api/markdown', 'POST', { filePath });
};
