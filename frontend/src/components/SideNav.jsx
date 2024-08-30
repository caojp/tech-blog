import React, { useState } from 'react';
import '../styles/SideNav.css';

const SideNav = ({ subcategories, onFileSelect, isDarkMode }) => {
    const [expandedPaths, setExpandedPaths] = useState({});
    const [activePath, setActivePath] = useState(null);

    const toggleExpand = (path) => {
        setExpandedPaths((prev) => ({
            ...prev,
            [path]: !prev[path],
        }));
    };

    const handleFileSelect = (subcategory) => {
        setActivePath(subcategory.path);
        onFileSelect(subcategory);
    };

    const renderSubcategories = (categories) => {
        return (
            <ul className="nav-list">
                {categories.map((subcategory) => (
                    <li key={subcategory.path} className="nav-item">
                        {subcategory.is_dir ? (
                            <>
                                <div
                                    onClick={() => toggleExpand(subcategory.path)}
                                    className={`folder-name ${expandedPaths[subcategory.path] ? 'expanded' : ''}`}
                                >
                                    {subcategory.name}
                                </div>
                                {expandedPaths[subcategory.path] && subcategory.children && (
                                    <ul className="sub-list">
                                        {renderSubcategories(subcategory.children)}
                                    </ul>
                                )}
                            </>
                        ) : (
                            <div
                                className={`file-name ${activePath === subcategory.path ? 'active' : ''}`}
                                onClick={() => handleFileSelect(subcategory)}
                            >
                                {subcategory.name}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <nav className={`side-nav ${isDarkMode ? 'dark-mode' : ''}`}>
            {renderSubcategories(subcategories)}
        </nav>
    );
};

export default SideNav;
