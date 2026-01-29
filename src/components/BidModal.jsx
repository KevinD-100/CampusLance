import React, { useState } from 'react';

const BidModal = ({ requirement, user, onClose, onSubmit }) => {
    const [bidData, setBidData] = useState({ price: '', days: '', msg: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(bidData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h3>Bid on: {requirement.title}</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Price (₹)</label>
                        <input
                            type="number"
                            className="form-input"
                            onChange={e => setBidData({ ...bidData, price: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Delivery (Days)</label>
                        <input
                            type="number"
                            className="form-input"
                            onChange={e => setBidData({ ...bidData, days: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Proposal Message</label>
                        <textarea
                            className="form-textarea"
                            onChange={e => setBidData({ ...bidData, msg: e.target.value })}
                            required
                            placeholder="Describe why you are the best fit..."
                        ></textarea>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button
                            type="button"
                            className="btn-small outline"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button className="submit-btn" style={{ margin: 0 }}>
                            Submit Proposal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BidModal;
