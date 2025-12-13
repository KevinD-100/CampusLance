import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forms.css';

const PostRequirement = () => {
  const navigate = useNavigate();
  const [req, setReq] = useState({
    title: '',
    budget: '',
    deadline: '',
    details: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Requirement Posted:", req);
    alert("Requirement Posted! Freelancers will bid soon.");
    navigate('/dashboard');
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>
        
        <div className="form-header">
          <h2>Post a Requirement</h2>
          <p>Tell us what you need done, and receive bids.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label className="form-label">Project Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Need a Python Script for Data Analysis" 
              onChange={(e) => setReq({...req, title: e.target.value})}
              required
            />
          </div>

          <div className="row-split">
            <div className="form-section">
              <label className="form-label">Max Budget (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="2000"
                onChange={(e) => setReq({...req, budget: e.target.value})}
              />
            </div>
            <div className="form-section">
              <label className="form-label">Deadline</label>
              <input 
                type="date" 
                className="form-input"
                onChange={(e) => setReq({...req, deadline: e.target.value})}
              />
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Project Details</label>
            <textarea 
              className="form-textarea" 
              placeholder="Describe the task requirements, deliverables, and specific tools needed..."
              onChange={(e) => setReq({...req, details: e.target.value})}
            ></textarea>
          </div>

          <button type="submit" className="submit-btn">Post Job</button>
        </form>
      </div>
    </div>
  );
};

export default PostRequirement;