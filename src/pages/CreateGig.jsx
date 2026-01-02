import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forms.css';

const CreateGig = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('campusUser'));

  const [gig, setGig] = useState({ title: '', category: 'Web Development', price: '', deliveryDays: '', description: '' });
  const [image, setImage] = useState(null); // State for image file

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) return alert("Please login first.");

    // Use FormData for File Uploads
    const formData = new FormData();
    formData.append('freelancer_id', user.id);
    formData.append('title', gig.title);
    // Add category to description or title since DB doesn't have category column
    formData.append('description', `[${gig.category}] ${gig.description}`);
    formData.append('price', gig.price);
    formData.append('delivery_days', gig.deliveryDays);
    if (image) {
      formData.append('image', image);
    }

    try {
        const response = await fetch('http://localhost:5000/api/gigs', {
            method: 'POST',
            body: formData, // No JSON headers needed for FormData
        });

        if (response.ok) {
            alert("✅ Gig Published with Image!");
            navigate('/dashboard');
        } else {
            alert("❌ Failed to create gig");
        }
    } catch (error) {
        console.error(error);
        alert("Server Error");
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>
        <div className="form-header"><h2>Create New Gig</h2><p>Include an image to attract clients.</p></div>

        <form onSubmit={handleSubmit}>
          {/* ... Title Input ... */}
          <div className="form-section">
            <label className="form-label">Gig Title</label>
            <input type="text" className="form-input" placeholder="I will..." onChange={(e) => setGig({...gig, title: e.target.value})} required />
          </div>

          {/* ... Category & Price ... */}
          <div className="row-split">
            <div className="form-section">
              <label className="form-label">Category</label>
              <select className="form-select" onChange={(e) => setGig({...gig, category: e.target.value})}>
                <option>Web Development</option><option>Graphic Design</option><option>Writing</option>
              </select>
            </div>
            <div className="form-section">
              <label className="form-label">Price (₹)</label>
              <input type="number" className="form-input" placeholder="500" onChange={(e) => setGig({...gig, price: e.target.value})} required />
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Delivery Days</label>
            <input type="number" className="form-input" placeholder="3" onChange={(e) => setGig({...gig, deliveryDays: e.target.value})} required />
          </div>

          {/* NEW: IMAGE UPLOAD */}
          <div className="form-section">
            <label className="form-label">Gig Cover Image</label>
            <input type="file" className="form-input" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
          </div>

          <div className="form-section">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Details..." onChange={(e) => setGig({...gig, description: e.target.value})} required></textarea>
          </div>

          <button type="submit" className="submit-btn">Publish Gig</button>
        </form>
      </div>
    </div>
  );
};

export default CreateGig;