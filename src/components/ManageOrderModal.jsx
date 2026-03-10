import API_URL from '../config';
import React, { useState, useEffect } from 'react';
import ProjectRoadmap from './ProjectRoadmap';


const ManageOrderModal = ({ order, user, onClose, onUpdate }) => {
    const [deliveryType, setDeliveryType] = useState('draft');
    const [deliveryNote, setDeliveryNote] = useState('');
    const [deliveryFile, setDeliveryFile] = useState(null);
    const [revisionFeedback, setRevisionFeedback] = useState("");

    // Fetch Revision Feedback if needed
    useEffect(() => {
        if (order.status === 'revision_requested') {
            fetch(`${API_URL}/api/messages/${order.id}`)
                .then(res => res.json())
                .then(msgs => {
                    const revMsg = [...msgs].reverse().find(m => m.text.includes("⚠️ REVISION REQUESTED:"));
                    if (revMsg) setRevisionFeedback(revMsg.text.replace("⚠️ REVISION REQUESTED:", "").trim());
                });
        }
    }, [order]);

    const handleDeliverySubmit = async (e) => {
        e.preventDefault();
        if (!deliveryFile) return alert("Please select a file.");

        const formData = new FormData();
        formData.append('workFile', deliveryFile);
        formData.append('order_id', order.id);
        formData.append('sender_id', user.id);
        formData.append('type', deliveryType);

        const typeLabel = deliveryType === 'draft' ? '📝 DRAFT' : '✅ FINAL DELIVERY';
        formData.append('text', `${typeLabel}: ${deliveryNote || "Here is the work file."}`);

        await fetch(`${API_URL}/api/orders/deliver`, { method: 'POST', body: formData });

        alert(`${typeLabel} Sent Successfully!`);
        onUpdate();
    };

    // Helper for Progress Steps
    const steps = [
        { label: "Hired", done: true },
        { label: "Work", done: ['in_progress', 'final_delivered', 'completed', 'revision_requested'].includes(order.status) },
        { label: "Deliver", done: ['final_delivered', 'completed'].includes(order.status) },
        { label: "Finish", done: order.status === 'completed' }
    ];

    return (
        <div className="modal-overlay">
            <div className="order-modal" style={{ maxWidth: '700px', width: '100%', padding: '0', overflow: 'hidden', borderRadius: '16px' }}>

                {/* Header */}
                <div style={{ background: '#2D3748', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'white' }}>🚀 Manage Order</h3>
                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>#{order.id} • {order.job_title}</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'white', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ padding: '20px' }}>
                    {/* Status & Price */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                        <div style={{ flex: 1, background: '#F7FAFC', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                            <small style={{ color: '#718096', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 'bold' }}>Total Price</small>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2D3748' }}>₹{order.total_price}</div>
                        </div>
                        <div style={{ flex: 1, background: '#F7FAFC', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #EDF2F7' }}>
                            <small style={{ color: '#718096', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 'bold' }}>Current Status</small>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3182CE', textTransform: 'capitalize' }}>
                                {order.status === 'revision_requested' ? <span style={{ color: '#E53E3E' }}>⚠️ Revision</span> : order.status.replace('_', ' ')}
                            </div>
                        </div>
                    </div>

                    {/* Progress Tracker (NEW IMPROVED) */}
                    <ProjectRoadmap currentStatus={order.status} milestones={order.milestones} />


                    {/* Revision Alert */}
                    {order.status === 'revision_requested' && (
                        <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', padding: '15px', borderRadius: '10px', color: '#C53030', marginBottom: '25px' }}>
                            <h4 style={{ margin: '0 0 5px 0' }}>⚠️ Correction Required</h4>
                            <p style={{ margin: 0 }}><b>Client Feedback:</b> "{revisionFeedback || 'Check chat for details'}"</p>
                        </div>
                    )}

                    <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '25px' }} />

                    {/* Delivery Form */}
                    <form onSubmit={handleDeliverySubmit}>
                        <h4 style={{ color: '#2D3748', marginBottom: '15px' }}>📤 Deliver Work</h4>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <div
                                onClick={() => setDeliveryType('draft')}
                                style={{
                                    flex: 1, padding: '15px', border: `2px solid ${deliveryType === 'draft' ? '#3182CE' : '#E2E8F0'}`,
                                    borderRadius: '10px', cursor: 'pointer', background: deliveryType === 'draft' ? '#EBF8FF' : 'white',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ fontSize: '1.5rem' }}>📝</div>
                                <strong>Send Draft</strong>
                                <div style={{ fontSize: '0.75rem', color: '#718096' }}>For feedback</div>
                            </div>
                            <div
                                onClick={() => setDeliveryType('final')}
                                style={{
                                    flex: 1, padding: '15px', border: `2px solid ${deliveryType === 'final' ? '#3182CE' : '#E2E8F0'}`,
                                    borderRadius: '10px', cursor: 'pointer', background: deliveryType === 'final' ? '#EBF8FF' : 'white',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ fontSize: '1.5rem' }}>📦</div>
                                <strong>Final Delivery</strong>
                                <div style={{ fontSize: '0.75rem', color: '#718096' }}>Complete Order</div>
                            </div>
                        </div>

                        <div style={{ border: '2px dashed #CBD5E0', padding: '25px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', background: '#FAFCFE', marginBottom: '20px' }}>
                            <label style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '5px' }}>☁️</div>
                                <span style={{ fontWeight: 'bold', color: '#4A5568' }}>{deliveryFile ? deliveryFile.name : "Click to Upload File"}</span>
                                <input type="file" style={{ display: 'none' }} onChange={(e) => setDeliveryFile(e.target.files[0])} />
                            </label>
                        </div>

                        <textarea
                            className="form-textarea"
                            placeholder="Add a delivery note..."
                            style={{ minHeight: '80px' }}
                            onChange={(e) => setDeliveryNote(e.target.value)}
                        ></textarea>

                        <button className="submit-btn" style={{ width: '100%', marginTop: '15px', padding: '12px', fontSize: '1rem' }}>
                            {deliveryType === 'draft' ? 'Send Draft' : 'Submit Final Work'}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default ManageOrderModal;
