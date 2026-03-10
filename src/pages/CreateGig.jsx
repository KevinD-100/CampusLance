import API_URL from '../config';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forms.css';

const CreateGig = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('campusUser'));

  const [gig, setGig] = useState({
    title: '',
    category: '',
    price: '',
    deliveryDays: '',
    revisions: '1',
    description: '',
    requirements: '',
    skills: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) return alert("Please login first.");

    const formData = new FormData();
    formData.append('freelancer_id', user.id);
    formData.append('title', gig.title);
    formData.append('category', gig.category);
    formData.append('description', gig.description);
    formData.append('price', gig.price);
    formData.append('delivery_days', gig.deliveryDays);
    formData.append('revisions', gig.revisions);
    formData.append('requirements', gig.requirements);
    formData.append('skills', gig.skills);

    if (image) formData.append('image', image);

    try {
      const response = await fetch(`${API_URL}/api/gigs`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert("✅ Professional Gig Published!");
        navigate('/dashboard');
      } else {
        const data = await response.json();
        alert("❌ Failed: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Server Error");
    }
  };

  return (
    <div className="form-page-container" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px', minHeight: '100vh' }}>
      <div className="form-card" style={{ maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ background: '#F7FAFC', padding: '30px', borderBottom: '1px solid #EDF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#2D3748', fontSize: '1.8rem' }}>✨ Create a New Gig</h2>
            <p style={{ margin: '5px 0 0', color: '#718096' }}>Showcase your skills and start earning.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-small outline">Cancel</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '40px' }}>

          {/* 1. OVERVIEW */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#5A67D8', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', marginBottom: '15px' }}>1. Overview & Category</h4>
            <div className="form-section">
              <label className="form-label">Gig Title</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '15px', top: '12px', color: '#A0AEC0', fontWeight: 'bold' }}>I will</span>
                <input type="text" className="form-input" style={{ paddingLeft: '60px' }} placeholder="design a stunning logo for your brand..." onChange={(e) => setGig({ ...gig, title: e.target.value })} required />
              </div>
            </div>

            <div className="row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-section">
                <label className="form-label">Category</label>
                <select className="form-select" onChange={(e) => setGig({ ...gig, category: e.target.value })} required>
                  <option value="">Select Category</option>
                  <option value="Web Development">💻 Web Development</option>
                  <option value="App Development">📱 App Development</option>
                  <option value="Graphic Design">🎨 Graphic Design</option>
                  <option value="Video Editing">🎬 Video Editing</option>
                  <option value="Writing">✍️ Writing & Translation</option>
                  <option value="AI & Data">🤖 AI & Data Science</option>
                  <option value="Photography">📷 Photography</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="form-section">
                <label className="form-label">Search Tags</label>
                <input type="text" className="form-input" placeholder="e.g. React, Logo, SEO (Keep it short)" onChange={(e) => setGig({ ...gig, skills: e.target.value })} required />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #E2E8F0', margin: '20px 0' }} />

          {/* 2. PRICING */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#5A67D8', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', marginBottom: '15px' }}>2. Pricing & Delivery</h4>
            <div className="row-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div className="form-section">
                <label className="form-label">Price (₹)</label>
                <input type="number" className="form-input" placeholder="Min ₹500" onChange={(e) => setGig({ ...gig, price: e.target.value })} required />
              </div>
              <div className="form-section">
                <label className="form-label">Delivery Days</label>
                <input type="number" className="form-input" placeholder="e.g. 3" onChange={(e) => setGig({ ...gig, deliveryDays: e.target.value })} required />
              </div>
              <div className="form-section">
                <label className="form-label">Revisions</label>
                <select className="form-select" onChange={(e) => setGig({ ...gig, revisions: e.target.value })}>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="5">5</option>
                  <option value="999">Unlimited</option>
                </select>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #E2E8F0', margin: '20px 0' }} />

          {/* 3. DETAILS */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#5A67D8', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', marginBottom: '15px' }}>3. Description & FAQ</h4>
            <div className="form-section">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" style={{ height: '120px' }} placeholder="Describe your service in detail..." onChange={(e) => setGig({ ...gig, description: e.target.value })} required></textarea>
            </div>
            <div className="form-section">
              <label className="form-label">Requirements (Optional)</label>
              <textarea className="form-textarea" style={{ height: '80px' }} placeholder="What do you need from the client to start?" onChange={(e) => setGig({ ...gig, requirements: e.target.value })}></textarea>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #E2E8F0', margin: '20px 0' }} />

          {/* 4. GALLERY */}
          <div>
            <h4 style={{ color: '#5A67D8', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', marginBottom: '15px' }}>4. Showcase</h4>
            <div className="form-section">
              <label className="form-label">Gig Cover Image</label>
              <div style={{ border: '2px dashed #CBD5E0', padding: '30px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: preview ? `url(${preview}) center/cover` : '#F7FAFC', height: '220px', transition: 'all 0.2s', position: 'relative' }}>
                <input type="file" style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer', position: 'absolute', top: 0, left: 0 }} accept="image/*" onChange={handleImageChange} required />
                {!preview && (
                  <div style={{ pointerEvents: 'none' }}>
                    <div style={{ fontSize: '3rem' }}>🖼️</div>
                    <p style={{ color: '#4A5568', fontWeight: 'bold', marginTop: '10px' }}>Drag & Drop or Click to Upload</p>
                    <p style={{ color: '#A0AEC0', fontSize: '0.8rem' }}>Recommended size: 1280x769</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="submit-btn" style={{ width: '100%', padding: '15px', fontSize: '1.1rem', marginTop: '30px', background: 'linear-gradient(to right, #667eea, #764ba2)', boxShadow: '0 4px 15px rgba(118, 75, 162, 0.4)' }}>
            🚀 Publish Gig
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreateGig;