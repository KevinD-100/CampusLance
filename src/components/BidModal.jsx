import React, { useState } from 'react';

const BidModal = ({ requirement, user, onClose, onSubmit }) => {
    const [bidData, setBidData] = useState({ price: '', days: '', msg: '' });
    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        let error = "";
        if (name === 'price') {
            if (!value) error = "Required";
            else if (parseFloat(value) <= 0) error = "Price must be greater than 0";
        }
        if (name === 'days') {
            if (!value) error = "Required";
            else if (parseInt(value) <= 0) error = "Days must be at least 1";
        }
        if (name === 'msg') {
            if (value.length < 20) error = `Message too short (${value.length}/20)`;
        }
        return error;
    };

    const handleChange = (name, value) => {
        setBidData(prev => ({ ...prev, [name]: value }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const isFormValid = () => {
        return bidData.price && bidData.days && bidData.msg.length >= 20 &&
            !errors.price && !errors.days && !errors.msg;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid()) onSubmit(bidData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h3>Bid on: {requirement.title}</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Price (₹)</label>
                        <input
                            type="number"
                            className="form-input"
                            style={errors.price ? { borderColor: 'red' } : {}}
                            onChange={e => handleChange('price', e.target.value)}
                            value={bidData.price}
                            required
                        />
                        {errors.price && <small style={{ color: 'red' }}>{errors.price}</small>}
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Delivery (Days)</label>
                        <input
                            type="number"
                            className="form-input"
                            style={errors.days ? { borderColor: 'red' } : {}}
                            onChange={e => handleChange('days', e.target.value)}
                            value={bidData.days}
                            required
                        />
                        {errors.days && <small style={{ color: 'red' }}>{errors.days}</small>}
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Proposal Message</label>
                        <textarea
                            className="form-textarea"
                            style={errors.msg ? { borderColor: 'red' } : {}}
                            onChange={e => handleChange('msg', e.target.value)}
                            value={bidData.msg}
                            required
                            placeholder="Describe why you are the best fit..."
                        ></textarea>
                        {errors.msg && <small style={{ color: 'red' }}>{errors.msg}</small>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button
                            type="button"
                            className="btn-small outline"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            className="submit-btn"
                            style={{ margin: 0, opacity: isFormValid() ? 1 : 0.5, cursor: isFormValid() ? 'pointer' : 'not-allowed' }}
                            disabled={!isFormValid()}
                        >
                            Submit Proposal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BidModal;
