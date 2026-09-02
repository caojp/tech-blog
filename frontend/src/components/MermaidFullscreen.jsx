import { memo, useEffect, useRef, useState, useCallback } from 'react';

/**
 * Mermaid 全屏查看组件：自动适配 + 拖拽平移 + 滚轮缩放 + 工具栏按钮
 * 关键：用 requestAnimationFrame 等 DOM 渲染后再计算 fit-zoom
 */
const MermaidFullscreen = ({ svgData, onClose, isDarkMode }) => {
    const canvasRef = useRef(null);
    const svgWrapRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
    const fitZoomRef = useRef(1);

    // 打开时：等 DOM 渲染后计算 fit-zoom
    useEffect(() => {
        let rafId;
        let attempts = 0;
        const MAX_ATTEMPTS = 30;

        const computeFit = () => {
            attempts++;
            const canvas = canvasRef.current;
            if (!canvas) {
                if (attempts < MAX_ATTEMPTS) rafId = requestAnimationFrame(computeFit);
                return;
            }
            const cw = canvas.clientWidth, ch = canvas.clientHeight;

            if ((cw === 0 || ch === 0) && attempts < MAX_ATTEMPTS) {
                rafId = requestAnimationFrame(computeFit);
                return;
            }

            const padding = 48;
            const fitW = (cw - padding) / svgData.naturalWidth;
            const fitH = (ch - padding) / svgData.naturalHeight;
            const fitZoom = Math.min(fitW, fitH, 2);

            fitZoomRef.current = Number.isFinite(fitZoom) && fitZoom > 0 ? fitZoom : 1;
            setZoom(fitZoomRef.current);
            setPan({ x: 0, y: 0 });
            setIsReady(true);
        };
        rafId = requestAnimationFrame(computeFit);
        return () => cancelAnimationFrame(rafId);
    }, [svgData]);

    // ESC 关闭 + 键盘快捷键
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z * 1.2, 10));
            else if (e.key === '-') setZoom(z => Math.max(z / 1.2, 0.1));
            else if (e.key === '0') { setZoom(fitZoomRef.current); setPan({ x: 0, y: 0 }); }
        };
        document.addEventListener('keydown', handleKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    // 窗口 resize 时重新计算 fit-zoom
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const canvasW = canvas.clientWidth;
            const canvasH = canvas.clientHeight;
            const padding = 48;
            const fitW = (canvasW - padding) / svgData.naturalWidth;
            const fitH = (canvasH - padding) / svgData.naturalHeight;
            fitZoomRef.current = Math.min(fitW, fitH, 2);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [svgData]);

    // 滚轮缩放（以鼠标位置为中心）
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom((prevZoom) => {
            const newZoom = Math.min(Math.max(prevZoom * delta, 0.1), 10);
            setPan((prevPan) => ({
                x: mx - (mx - prevPan.x) * (newZoom / prevZoom),
                y: my - (my - prevPan.y) * (newZoom / prevZoom),
            }));
            return newZoom;
        });
    }, []);

    // 拖拽平移
    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }, [pan]);

    useEffect(() => {
        if (!isPanning) return;
        const handleMove = (e) => {
            setPan({
                x: panStart.current.panX + (e.clientX - panStart.current.x),
                y: panStart.current.panY + (e.clientY - panStart.current.y),
            });
        };
        const handleUp = () => setIsPanning(false);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isPanning]);

    // 触摸支持
    const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 1) {
            setIsPanning(true);
            const t = e.touches[0];
            panStart.current = { x: t.clientX, y: t.clientY, panX: pan.x, panY: pan.y };
        }
    }, [pan]);

    useEffect(() => {
        if (!isPanning) return;
        const handleTouchMove = (e) => {
            if (e.touches.length === 1) {
                const t = e.touches[0];
                setPan({
                    x: panStart.current.panX + (t.clientX - panStart.current.x),
                    y: panStart.current.panY + (t.clientY - panStart.current.y),
                });
            }
        };
        const handleTouchEnd = () => setIsPanning(false);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPanning]);

    const zoomIn = () => setZoom(z => Math.min(z * 1.25, 10));
    const zoomOut = () => setZoom(z => Math.max(z / 1.25, 0.1));
    const reset = () => { setZoom(fitZoomRef.current); setPan({ x: 0, y: 0 }); };

    return (
        <div className={`mermaid-fullscreen-overlay${isDarkMode ? ' dark' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="mermaid-fullscreen-toolbar">
                <span className="zoom-info">缩放: {Math.round(zoom * 100)}%  ·  ESC 关闭  ·  +/- 缩放  ·  0 重置  ·  拖动平移</span>
                <div className="mermaid-fullscreen-actions">
                    <button onClick={zoomOut} title="缩小 (-)">−</button>
                    <button onClick={reset} title="重置 (0)">重置</button>
                    <button onClick={zoomIn} title="放大 (+)">+</button>
                    <button className="close-btn" onClick={onClose} title="关闭 (ESC)">关闭</button>
                </div>
            </div>
            <div
                ref={canvasRef}
                className={`mermaid-fullscreen-canvas ${isPanning ? 'panning' : ''}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div
                    ref={svgWrapRef}
                    className="mermaid-fullscreen-svg"
                    style={{
                        transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
                        opacity: isReady ? 1 : 0,
                        '--svg-w': `${Math.round(svgData.naturalWidth)}px`,
                        '--svg-h': `${Math.round(svgData.naturalHeight)}px`,
                    }}
                    dangerouslySetInnerHTML={{ __html: svgData.html }}
                />
                {!isReady && <div className="mermaid-fullscreen-loading">加载中...</div>}
            </div>
        </div>
    );
};

export default memo(MermaidFullscreen);
