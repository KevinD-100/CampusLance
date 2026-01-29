import React, { useState } from 'react';

const ClientRatingModal = ({ order, user, onClose, onSubmit }) => {
    const [ratingData, setRatingData] = useState({ stars: 5, comment: '' });
    const [hoverStars, setHoverStars] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch('http://localhost:5000/api/ratings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...ratingData, order_id: order.id, client_id: user.id, freelancer_id: order.freelancer_id })
        });

        // Callback to parent to refresh/close
        if (onSubmit) onSubmit();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ textAlign: 'center', maxWidth: '450px', borderRadius: '16px', padding: '30px' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#2D3748' }}>Rate Your Experience</h3>
                <p style={{ color: '#718096', marginBottom: '20px' }}>How was your experience working with <strong>{order.freelancer_name}</strong>?</p>

                <form onSubmit={handleSubmit}>
                    {/* Stars */}
                    <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <span
                                key={s}
                                onMouseEnter={() => setHoverStars(s)}
                                onMouseLeave={() => setHoverStars(0)}
                                onClick={() => setRatingData({ ...ratingData, stars: s })}
                                style={{
                                    fontSize: '2.5rem',
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s',
                                    color: s <= (hoverStars || ratingData.stars) ? '#F6E05E' : '#E2E8F0',
                                    transform: s === hoverStars ? 'scale(1.2)' : 'scale(1)'
                                }}
                            >
                                ★
                            </span>
                        ))}
                    </div>

                    <textarea
                        className="form-textarea"
                        placeholder="Share a few words about their work..."
                        style={{ minHeight: '100px', borderRadius: '10px', border: '1px solid #CBD5E0', padding: '15px' }}
                        onChange={e => setRatingData({ ...ratingData, comment: e.target.value })}
                        required
                    ></textarea>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="button" className="btn-small outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                        <button className="submit-btn" style={{ flex: 1, margin: 0, background: 'linear-gradient(to right, #ECC94B, #D69E2E)', color: 'white' }}>Submit Review</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientRatingModal;
