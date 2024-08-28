// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client'; // 导入 createRoot
import App from './App';
import './styles/App.css'; // 引入全局样式

// 使用 createRoot 替代 ReactDOM.render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
);
