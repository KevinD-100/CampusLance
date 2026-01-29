import React, { useState, useEffect } from 'react';

const ClientReviewModal = ({ order, user, onClose, onUpdate }) => {
    const [revisionNote, setRevisionNote] = useState("");
    const [latestDelivery, setLatestDelivery] = useState(null);

    // Fetch Latest Delivery File
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/messages/${order.id}`);
                const msgs = await res.json();
                // Find last message with FILE
                const deliveryMsg = [...msgs].reverse().find(m => m.text && m.text.includes("[FILE:"));
                if (deliveryMsg) {
                    const match = deliveryMsg.text.match(/\[FILE: (.*?)\]/);
                    if (match && match[1]) setLatestDelivery(match[1]);
                }
            } catch (err) { console.error(err); }
        };
        fetchMessages();
    }, [order]);

    const handleSubmit = async (status) => {
        if (status === 'revision_requested' && !revisionNote.trim()) return alert("Please enter feedback for the revision.");
        if (status === 'completed' && !window.confirm("Are you sure you want to accept this work and complete the order?")) return;

        await fetch('http://localhost:5000/api/orders/review', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: order.id, client_id: user.id, status, feedback: revisionNote })
        });

        alert(status === 'completed' ? "🎉 Order Completed!" : "⚠️ Revision Requested.");
        onUpdate();
    };

    return (
        <div className="modal-overlay">
            <div className="order-modal" style={{ maxWidth: '600px', width: '100%', borderRadius: '16px', overflow: 'hidden', padding: 0 }}>

                {/* Header */}
                <div style={{ background: '#2D3748', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'white' }}>🔍 Review Delivery</h3>
                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Submitted by {order.freelancer_name}</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'white', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ padding: '30px' }}>

                    {/* File Preview */}
                    <div style={{ background: '#E6FFFA', border: '2px dashed #38B2AC', borderRadius: '12px', padding: '25px', textAlign: 'center', marginBottom: '30px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📦</div>
                        {latestDelivery ? (
                            <>
                                <h4 style={{ margin: '0 0 10px 0', color: '#2C7A7B' }}>New Work Submitted</h4>
                                <a href={latestDelivery} target="_blank" rel="noreferrer" className="action-btn success" style={{ display: 'inline-block', padding: '10px 20px', fontSize: '1rem' }}>
                                    Download File ⬇️
                                </a>
                            </>
                        ) : (
                            <p style={{ color: '#E53E3E', fontWeight: 'bold' }}>No file attachment found.</p>
                        )}
                    </div>

                    <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#4A5568' }}>What would you like to do?</h4>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                        {/* REVISION OPTION */}
                        <div style={{ flex: 1 }}>
                            <button
                                onClick={() => handleSubmit('revision_requested')}
                                className="choice-btn"
                                style={{
                                    width: '100%', padding: '20px', borderRadius: '12px', border: '2px solid #FEB2B2', background: 'white', cursor: 'pointer', transition: 'all 0.2s',
                                    color: '#C53030', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#FFF5F5'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                            >
                                <span style={{ fontSize: '1.5rem' }}>🔄</span>
                                <strong>Request Revision</strong>
                            </button>
                            <textarea
                                placeholder="What needs changes? (Required for revision)"
                                style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E0', fontSize: '0.9rem', minHeight: '60px' }}
                                value={revisionNote}
                                onChange={(e) => setRevisionNote(e.target.value)}
                            ></textarea>
                        </div>

                        {/* ACCEPT OPTION */}
                        <div style={{ flex: 1 }}>
                            <button
                                onClick={() => handleSubmit('completed')}
                                className="choice-btn"
                                style={{
                                    width: '100%', height: '100%', padding: '20px', borderRadius: '12px', border: '2px solid #68D391', background: '#F0FFF4', cursor: 'pointer', transition: 'all 0.2s',
                                    color: '#2F855A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#C6F6D5'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#F0FFF4'}
                            >
                                <span style={{ fontSize: '2rem' }}>✅</span>
                                <strong>Accept & Complete</strong>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ClientReviewModal;
