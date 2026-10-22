// src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';

// 低频页面路由级懒加载：进入对应页面才下载其代码
const TagPage = lazy(() => import('./pages/TagPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                    path="/tags"
                    element={(
                        <Suspense fallback={<div className="status-message">加载中...</div>}>
                            <TagPage />
                        </Suspense>
                    )}
                />
                <Route
                    path="/search"
                    element={(
                        <Suspense fallback={<div className="status-message">加载中...</div>}>
                            <SearchPage />
                        </Suspense>
                    )}
                />
            </Routes>
        </Router>
    );
};

export default App;
