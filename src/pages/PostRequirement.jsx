import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forms.css';

const PostRequirement = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('campusUser'));

  const [req, setReq] = useState({
    title: '',
    budget: '',
    deadline: '',
    details: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Check Login
    if (!user || !user.id) {
        alert("❌ Error: You are not logged in. Please login first.");
        navigate('/login');
        return;
    }

    console.log("📤 Sending Requirement:", req);

    try {
        const response = await fetch('http://localhost:5000/api/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: user.id,
                title: req.title,
                // Combine Budget into description (since DB schema lacks budget col)
                description: `[Budget: ₹${req.budget}] ${req.details}`,
                // Send NULL if no deadline is picked, else send the date
                deadline: req.deadline ? req.deadline : null 
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ Requirement Posted Successfully!");
            navigate('/dashboard'); // Go back to dashboard to see it
        } else {
            alert("❌ Failed: " + (data.error || "Unknown Error"));
            console.error("Server Error:", data);
        }
    } catch (error) {
        console.error("Network Error:", error);
        alert("Cannot connect to backend.");
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>
        
        <div className="form-header">
          <h2>Post a Requirement</h2>
          <p>Hire students for your project.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label className="form-label">Project Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Need a Python Script" 
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
                required
              />
            </div>
            <div className="form-section">
              <label className="form-label">Deadline</label>
              <input 
                type="date" 
                className="form-input"
                onChange={(e) => setReq({...req, deadline: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Project Details</label>
            <textarea 
              className="form-textarea" 
              placeholder="Describe what you need done..."
              onChange={(e) => setReq({...req, details: e.target.value})}
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-btn">Post Job</button>
        </form>
      </div>
    </div>
  );
};

export default PostRequirement;