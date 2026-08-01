// src/components/ContentNav.jsx

const ContentNav = ({ headings }) => {
    return (
        <nav className="content-nav">
            {headings.map((heading, index) => (
                <a key={index} href={`#${heading.id}`}>
                    {heading.text}
                </a>
            ))}
        </nav>
    );
};

export default ContentNav;
