import API_URL from '../config';
import React, { useState, useEffect } from 'react';

const ClientReviewModal = ({ order, user, onClose, onUpdate }) => {
    const [revisionNote, setRevisionNote] = useState("");
    const [disputeReason, setDisputeReason] = useState("");
    const [latestDelivery, setLatestDelivery] = useState(null);
    const [isDisputing, setIsDisputing] = useState(false);


    // Fetch Latest Delivery File
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API_URL}/api/messages/${order.id}`);
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

        if (status === 'completed') {
            if (!window.Razorpay) {
                return alert("Razorpay SDK not loaded. Please refresh the page.");
            }
            if (!window.confirm(`Accept work and Pay ₹${order.total_price}?`)) return;

            try {
                // 1. Create Razorpay Order
                const resOrder = await fetch(`${API_URL}/api/payment/create-order`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: order.total_price })
                });
                const orderData = await resOrder.json();

                if (!orderData || !orderData.id) {
                    return alert("Failed to initialize payment. Try again.");
                }

                // 2. Open Razorpay Modal
                const options = {
                    key: 'rzp_test_SKKavRDsA7hwvi',
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "CampusLance",
                    description: `Payment for Order #${order.id}`,
                    order_id: orderData.id,
                    handler: async (response) => {
                        // 3. Verify Payment
                        const resVerify = await fetch(`${API_URL}/api/payment/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(response)
                        });
                        const verifyData = await resVerify.json();

                        if (verifyData.status === 'success') {
                            // 4. Finalize Review on Backend
                            await fetch(`${API_URL}/api/orders/review`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ order_id: order.id, client_id: user.id, status, feedback: revisionNote })
                            });
                            alert("🎉 Payment Successful! Order Completed.");
                            onUpdate();
                        } else {
                            alert("❌ Payment verification failed.");
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email
                    },
                    theme: { color: "#3182CE" }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();

            } catch (err) {
                console.error("Payment Error:", err);
                alert("Payment process failed.");
            }
        } else {
            // Logic for Revision Requested (No Payment)
            await fetch(`${API_URL}/api/orders/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: order.id, client_id: user.id, status, feedback: revisionNote })
            });
            alert("⚠️ Revision Requested.");
            onUpdate();
        }
    }; // Close handleSubmit

    const handleDispute = async () => {
        if (!disputeReason.trim()) return alert("Please specify a reason for the dispute.");
        if (!window.confirm("Are you sure you want to raise a dispute? This will involve admin mediation.")) return;

        try {
            await fetch(`${API_URL}/api/disputes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: order.id, raised_by: user.id, reason: disputeReason })
            });
            alert("⚠️ Dispute has been raised and sent to the Admin team.");
            onUpdate();
        } catch (err) {
            console.error(err);
            alert("Error raising dispute.");
        }
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

                    {/* DISPUTE OPTION */}
                    <div style={{ marginTop: '30px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                        {!isDisputing ? (
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: '#718096' }}>Not satisfied and cannot reach an agreement? </span>
                                <button onClick={() => setIsDisputing(true)} style={{ background: 'none', border: 'none', color: '#E53E3E', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem' }}>Raise a Dispute</button>
                            </div>
                        ) : (
                            <div style={{ background: '#FFF5F5', padding: '15px', borderRadius: '8px', border: '1px solid #FEB2B2' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#C53030', fontSize: '0.95rem' }}>⚠️ Raise a Dispute</h4>
                                <p style={{ fontSize: '0.8rem', color: '#742A2A', marginBottom: '10px' }}>Admins will review the project brief, communications, and deliveries to make a final decision on the payment.</p>
                                <textarea
                                    placeholder="Explain why you are raising a dispute..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #FEB2B2', fontSize: '0.9rem', minHeight: '60px', marginBottom: '10px' }}
                                    value={disputeReason}
                                    onChange={(e) => setDisputeReason(e.target.value)}
                                ></textarea>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={handleDispute} className="btn-small" style={{ background: '#E53E3E', color: 'white', border: 'none', flex: 1 }}>Submit Dispute</button>
                                    <button onClick={() => setIsDisputing(false)} className="btn-small outline" style={{ flex: 1 }}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ClientReviewModal;
