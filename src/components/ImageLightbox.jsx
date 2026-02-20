import React, { useState, useEffect } from 'react';

const ImageLightbox = ({ images, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
    const [zoom, setZoom] = useState(1);

    // Reset zoom on slide change
    useEffect(() => { setZoom(1); }, [currentIndex]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    const nextSlide = (e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = (e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const toggleZoom = (e) => {
        e.stopPropagation();
        setZoom(prev => prev > 1 ? 1 : 2.5);
    };

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(0, 0, 0, 0.95)', zIndex: 10000,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                opacity: 1, transition: 'opacity 0.3s'
            }}
            onClick={onClose}
        >
            {/* CLOSE BUTTON */}
            <button
                onClick={onClose}
                style={{
                    position: 'absolute', top: '20px', right: '30px',
                    background: 'none', border: 'none', color: 'white',
                    fontSize: '3rem', cursor: 'pointer', zIndex: 10001
                }}
            >
                &times;
            </button>

            {/* NAVIGATION - ONLY IF MULTIPLE */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        style={{
                            position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                            width: '50px', height: '50px', borderRadius: '50%',
                            fontSize: '1.5rem', cursor: 'pointer', zIndex: 10001,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                        className="lightbox-nav"
                    >
                        &#10094;
                    </button>

                    <button
                        onClick={nextSlide}
                        style={{
                            position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                            width: '50px', height: '50px', borderRadius: '50%',
                            fontSize: '1.5rem', cursor: 'pointer', zIndex: 10001,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                        className="lightbox-nav"
                    >
                        &#10094;
                    </button>
                </>
            )}

            {/* IMAGE CONTAINER */}
            <div
                style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
            >
                <img
                    src={images[currentIndex]}
                    alt={`Slide ${currentIndex}`}
                    style={{
                        maxWidth: '90%', maxHeight: '90%',
                        objectFit: 'contain',
                        transform: `scale(${zoom})`,
                        transition: 'transform 0.3s ease',
                        cursor: zoom > 1 ? 'zoom-out' : 'zoom-in'
                    }}
                    onClick={toggleZoom}
                    onError={(e) => e.target.src = "https://via.placeholder.com/800?text=Image+Load+Error"}
                />
            </div>

            {/* FOOTER COUNTER */}
            {images.length > 1 && (
                <div style={{
                    position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                    color: 'white', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px',
                    fontSize: '0.9rem'
                }}>
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
};

export default ImageLightbox;
