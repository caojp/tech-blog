// src/components/SideNav.jsx
import React from 'react';
import '../styles/SideNav.css'

const SideNav = ({ subcategories, onFileSelect ,isDarkMode }) => {
    const sideNavClassName = `side-nav ${isDarkMode ? 'dark-mode' : ''}`;

    return (
        <nav className={sideNavClassName}>
            {subcategories.map((subcategory) => (
                <ul
                    key={subcategory.path}
                    onClick={() => onFileSelect(subcategory)}
                    className="nav-item"
                >
                    {subcategory.name}
                </ul>
            ))}
        </nav>
    );
};

export default SideNav;