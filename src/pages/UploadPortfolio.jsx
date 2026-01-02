import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forms.css';

const UploadPortfolio = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('campusUser'));
  const [formData, setFormData] = useState({ title: '', category: 'Web Design', description: '' });
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('freelancer_id', user.id);
    data.append('title', formData.title);
    data.append('category', formData.category);
    data.append('description', formData.description);
    if (image) data.append('image', image);

    await fetch('http://localhost:5000/api/portfolio', { method: 'POST', body: data });
    alert("Added to Portfolio!");
    navigate('/dashboard');
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
        <div className="form-header"><h2>Add to Portfolio</h2><p>Showcase your best work.</p></div>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label className="form-label">Project Title</label>
            <input type="text" className="form-input" onChange={(e) => setFormData({...formData, title: e.target.value})} required />
          </div>
          <div className="form-section">
            <label className="form-label">Category</label>
            <select className="form-select" onChange={(e) => setFormData({...formData, category: e.target.value})}>
              <option>Web Design</option><option>Mobile App</option><option>Logo/Branding</option><option>Writing</option>
            </select>
          </div>
          <div className="form-section">
            <label className="form-label">Project Image</label>
            <input type="file" className="form-input" onChange={(e) => setImage(e.target.files[0])} required />
          </div>
          <div className="form-section">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
          <button className="submit-btn">Upload</button>
        </form>
      </div>
    </div>
  );
};

export default UploadPortfolio;