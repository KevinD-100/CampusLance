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
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case 'title':
        if (!value) error = "Requried";
        else if (value.length < 10) error = "Min 10 characters";
        break;
      case 'budget':
        if (!value) error = "Required";
        else if (Number(value) < 500) error = "Min budget ₹500";
        break;
      case 'deadline':
        if (!value) error = "Required";
        else if (new Date(value) < new Date()) error = "Must be a future date";
        break;
      case 'details':
        if (!value) error = "Required";
        else if (value.length < 20) error = "Please provide more details";
        break;
      default: break;
    }
    return error;
  };

  const handleChange = (name, value) => {
    setReq(prev => ({ ...prev, [name]: value }));
    const errorMsg = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const isFormValid = () => {
    return (
      req.title.length >= 10 &&
      Number(req.budget) >= 500 &&
      req.deadline && new Date(req.deadline) >= new Date() &&
      req.details.length >= 20 &&
      !Object.values(errors).some(e => e)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Check Login
    if (!user || !user.id) {
      alert("❌ Error: You are not logged in. Please login first.");
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: user.id,
          title: req.title,
          // Combine Budget into description (since DB schema lacks budget col)
          description: `[Budget: ₹${req.budget}] ${req.details}`,
          deadline: req.deadline ? req.deadline : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Requirement Posted Successfully!");
        navigate('/dashboard'); // Go back to dashboard to see it
      } else {
        alert("❌ Failed: " + (data.error || "Unknown Error"));
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Cannot connect to backend.");
    }
  };

  return (
    <div className="form-page-container" style={{ background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', padding: '40px', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="form-card" style={{ maxWidth: '700px', width: '100%', background: 'white', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ padding: '40px 40px 20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, color: '#333', fontSize: '1.8rem', fontWeight: '800' }}>Post a New Job</h2>
            <p style={{ margin: '8px 0 0', color: '#718096', fontSize: '0.95rem' }}>Find the perfect talent for your project.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '50px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#718096' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 40px 40px 40px' }}>

          <div className="form-section" style={{ marginBottom: '25px' }}>
            <label className="form-label" style={{ color: '#4A5568', fontSize: '0.9rem', marginBottom: '8px', display: 'block', fontWeight: '600' }}>Project Title</label>
            <input
              type="text"
              className={`form-input ${errors.title ? 'invalid' : ''}`}
              style={{ borderColor: errors.title ? '#E53E3E' : '#E2E8F0', padding: '15px', borderRadius: '10px', fontSize: '1rem', background: '#F7FAFC' }}
              placeholder="e.g. Need a Python Script for Data Analysis"
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
            {errors.title && <small style={{ color: '#E53E3E', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>{errors.title}</small>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            <div className="form-section">
              <label className="form-label" style={{ color: '#4A5568', fontSize: '0.9rem', marginBottom: '8px', display: 'block', fontWeight: '600' }}>Max Budget (₹)</label>
              <input
                type="number"
                className={`form-input ${errors.budget ? 'invalid' : ''}`}
                style={{ borderColor: errors.budget ? '#E53E3E' : '#E2E8F0', padding: '15px', borderRadius: '10px', fontSize: '1rem', background: '#F7FAFC' }}
                placeholder="2000"
                onChange={(e) => handleChange('budget', e.target.value)}
                required
              />
              {errors.budget && <small style={{ color: '#E53E3E', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>{errors.budget}</small>}
            </div>
            <div className="form-section">
              <label className="form-label" style={{ color: '#4A5568', fontSize: '0.9rem', marginBottom: '8px', display: 'block', fontWeight: '600' }}>Deadline</label>
              <input
                type="date"
                className={`form-input ${errors.deadline ? 'invalid' : ''}`}
                style={{ borderColor: errors.deadline ? '#E53E3E' : '#E2E8F0', padding: '15px', borderRadius: '10px', fontSize: '1rem', background: '#F7FAFC' }}
                onChange={(e) => handleChange('deadline', e.target.value)}
                required
              />
              {errors.deadline && <small style={{ color: '#E53E3E', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>{errors.deadline}</small>}
            </div>
          </div>

          <div className="form-section" style={{ marginBottom: '30px' }}>
            <label className="form-label" style={{ color: '#4A5568', fontSize: '0.9rem', marginBottom: '8px', display: 'block', fontWeight: '600' }}>Project Details</label>
            <textarea
              className={`form-textarea ${errors.details ? 'invalid' : ''}`}
              style={{ height: '150px', borderColor: errors.details ? '#E53E3E' : '#E2E8F0', padding: '15px', fontSize: '1rem', lineHeight: '1.6', borderRadius: '10px', background: '#F7FAFC' }}
              placeholder="Describe the task in detail. What skills are needed? What is the expected output?"
              onChange={(e) => handleChange('details', e.target.value)}
              required
            ></textarea>
            {errors.details && <small style={{ color: '#E53E3E', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>{errors.details}</small>}
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={!isFormValid()}
            style={{
              width: '100%',
              padding: '18px',
              fontSize: '1.1rem',
              background: !isFormValid() ? '#CBD5E0' : '#333',
              color: 'white',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: !isFormValid() ? 'not-allowed' : 'pointer',
              boxShadow: !isFormValid() ? 'none' : '0 10px 20px rgba(0,0,0,0.1)'
            }}
          >
            Post Job
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostRequirement;