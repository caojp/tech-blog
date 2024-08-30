import React, {useEffect, useState} from 'react';
import TopNav from '../components/TopNav';
import MarkdownRenderer from '../components/MarkdownRenderer';
import {fetchCategories, fetchMarkdownContent} from '../api/content';
import SideNav from '../components/SideNav';
import TableOfContents from '../components/TableOfContents.jsx';

const HomePage = () => {
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [content, setContent] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeFile, setActiveFile] = useState(null);
    const [anchors, setAnchors] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchCategories();
                if (response.status === 'success') {
                    setCategories(response.data);
                    const indexOjb = response.data.filter(category => !category.is_dir);
                    if (indexOjb && indexOjb[0] && indexOjb[0].path) {
                        const markdownContent = await fetchMarkdownContent(indexOjb[0].path);
                        setContent(markdownContent.data);
                    }
                }else {
                    console.log("init start failed");
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };

        fetchData();
    }, []);
    const handleCategorySelect = (category) => {
        setActiveCategory(category);
        setSubcategories(category.children || []);
        setActiveFile(null);
    };

    const handleFileSelect = async (file) => {
        setActiveFile(file);
        // 检查文件扩展名是否为 .md
        if (file.path.endsWith('.md')) {
            try {
                const markdownContent = await fetchMarkdownContent(file.path);
                setContent(markdownContent.data);
            } catch (error) {
                console.error('Failed to fetch markdown content:', error);
            }
        }else {
            console.log('选择的是一个子类');
        }
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-mode', !isDarkMode);
    };

    return (
        <div className={`home-page ${isDarkMode ? 'dark-mode' : ''}`}>
            <TopNav
                categories={categories}
                onCategorySelect={handleCategorySelect}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
            />

            <div className="main-content">
                <SideNav
                    subcategories={subcategories}
                    onFileSelect={handleFileSelect}
                    isDarkMode={isDarkMode}
                />

                {content && (
                    <>
                        <MarkdownRenderer content={content} setAnchors={setAnchors} isDarkMode={isDarkMode}/>
                        <TableOfContents anchors={anchors} isDarkMode={isDarkMode}/>
                    </>
                )}
            </div>
        </div>
    );
};

export default HomePage;
