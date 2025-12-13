import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forms.css';

const CreateGig = () => {
  const navigate = useNavigate();
  const [gig, setGig] = useState({
    title: '',
    category: '',
    price: '',
    deliveryDays: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Gig Created:", gig);
    // TODO: Send to backend
    alert("Gig Created Successfully! (Demo)");
    navigate('/dashboard');
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>
        
        <div className="form-header">
          <h2>Create a New Gig</h2>
          <p>Showcase your skills and start earning.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label className="form-label">Gig Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="I will do..." 
              value={gig.title}
              onChange={(e) => setGig({...gig, title: e.target.value})}
              required
            />
          </div>

          <div className="row-split">
            <div className="form-section">
              <label className="form-label">Category</label>
              <select className="form-select" onChange={(e) => setGig({...gig, category: e.target.value})}>
                <option>Select Category</option>
                <option>Web Development</option>
                <option>Graphic Design</option>
                <option>Content Writing</option>
                <option>Photography</option>
              </select>
            </div>
            <div className="form-section">
              <label className="form-label">Starting Price (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="500"
                onChange={(e) => setGig({...gig, price: e.target.value})}
              />
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Delivery Time (Days)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="3"
              onChange={(e) => setGig({...gig, deliveryDays: e.target.value})}
            />
          </div>

          <div className="form-section">
            <label className="form-label">Description</label>
            <textarea 
              className="form-textarea" 
              placeholder="Describe your service in detail..."
              onChange={(e) => setGig({...gig, description: e.target.value})}
            ></textarea>
          </div>

          <button type="submit" className="submit-btn">Publish Gig</button>
        </form>
      </div>
    </div>
  );
};

export default CreateGig;