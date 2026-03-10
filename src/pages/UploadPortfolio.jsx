import API_URL from '../config';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forms.css';

const UploadPortfolio = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('campusUser'));
  const [formData, setFormData] = useState({ title: '', category: 'Web Design', description: '', tools: '', link: '' });
  const [images, setImages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('freelancer_id', user.id);
    data.append('title', formData.title);
    data.append('category', formData.category);
    data.append('description', formData.description);
    data.append('tools', formData.tools);
    data.append('link', formData.link);

    // Append multiple files
    for (let i = 0; i < images.length; i++) {
      data.append('images', images[i]);
    }

    try {
      const res = await fetch(`${API_URL}/api/portfolio`, { method: 'POST', body: data });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.message || "Upload Failed");
      }

      alert("Added to Portfolio!");
      navigate('/dashboard');
    } catch (err) {
      console.error("Upload Error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
        <div className="form-header"><h2>Add to Portfolio</h2><p>Showcase your best work with details.</p></div>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label className="form-label">Project Title</label>
            <input type="text" className="form-input" onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g. E-Commerce App" />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-section" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <select className="form-select" onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                <option>Web Design</option><option>Mobile App</option><option>Logo/Branding</option><option>Writing</option><option>Video Editing</option><option>Other</option>
              </select>
            </div>
            <div className="form-section" style={{ flex: 1 }}>
              <label className="form-label">Tools Used</label>
              <input type="text" className="form-input" onChange={(e) => setFormData({ ...formData, tools: e.target.value })} placeholder="e.g. React, Figma, Python" required />
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Project Link (Optional)</label>
            <input type="url" className="form-input" onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="https://..." />
          </div>

          <div className="form-section">
            <label className="form-label">Project Images (Select Multiple)</label>
            <input type="file" className="form-input" multiple onChange={(e) => setImages(e.target.files)} required />
            {images.length > 0 && <small style={{ color: '#48BB78' }}>{images.length} files selected</small>}
          </div>
          <div className="form-section">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" style={{ height: '120px' }} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe what you built, your role, and the outcome..."></textarea>
          </div>
          <button className="submit-btn">Upload Project</button>
        </form>
      </div>
    </div>
  );
};

export default UploadPortfolio;