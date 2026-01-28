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
        const response = await fetch('http://localhost:5000/api/gigs', {
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
    <div className="form-page-container">
      <div className="form-card" style={{maxWidth:'900px'}}>
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>
        
        <div className="form-header">
          <h2>Create a New Gig</h2>
          <p>Fill out the details to help clients find you.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* SECTION 1: OVERVIEW */}
          <h4 style={{color:'#2D3748', borderBottom:'1px solid #eee', paddingBottom:'10px', marginBottom:'20px'}}>1. Overview</h4>
          
          <div className="form-section">
            <label className="form-label">Gig Title</label>
            <input type="text" className="form-input" placeholder="I will do something I'm really good at..." onChange={(e) => setGig({...gig, title: e.target.value})} required />
          </div>

          <div className="row-split">
            <div className="form-section">
              <label className="form-label">Category</label>
              <select className="form-select" onChange={(e) => setGig({...gig, category: e.target.value})} required>
                <option value="">Select Category</option>
                <option value="Web Development">Web Development</option>
                <option value="App Development">App Development</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Video Editing">Video Editing</option>
                <option value="Writing">Writing & Translation</option>
                <option value="AI & Data">AI & Data Science</option>
                <option value="Photography">Photography</option>
              </select>
            </div>
            <div className="form-section">
              <label className="form-label">Search Tags (Skills)</label>
              <input type="text" className="form-input" placeholder="e.g. React, Logo, SEO" onChange={(e) => setGig({...gig, skills: e.target.value})} required />
            </div>
          </div>

          {/* SECTION 2: PRICING */}
          <h4 style={{color:'#2D3748', borderBottom:'1px solid #eee', paddingBottom:'10px', marginBottom:'20px', marginTop:'30px'}}>2. Pricing & Scope</h4>

          <div className="row-split" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
            <div className="form-section">
              <label className="form-label">Price (₹)</label>
              <input type="number" className="form-input" placeholder="500" onChange={(e) => setGig({...gig, price: e.target.value})} required />
            </div>
            <div className="form-section">
              <label className="form-label">Delivery (Days)</label>
              <input type="number" className="form-input" placeholder="3" onChange={(e) => setGig({...gig, deliveryDays: e.target.value})} required />
            </div>
            <div className="form-section">
              <label className="form-label">Revisions</label>
              <select className="form-select" onChange={(e) => setGig({...gig, revisions: e.target.value})}>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="999">Unlimited</option>
              </select>
            </div>
          </div>

          {/* SECTION 3: DESCRIPTION */}
          <h4 style={{color:'#2D3748', borderBottom:'1px solid #eee', paddingBottom:'10px', marginBottom:'20px', marginTop:'30px'}}>3. Description & FAQ</h4>

          <div className="form-section">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" style={{height:'150px'}} placeholder="Describe your service in detail..." onChange={(e) => setGig({...gig, description: e.target.value})} required></textarea>
          </div>

          <div className="form-section">
            <label className="form-label">Requirements from Client</label>
            <textarea className="form-textarea" style={{height:'80px'}} placeholder="What do you need to start the work?" onChange={(e) => setGig({...gig, requirements: e.target.value})}></textarea>
          </div>

          {/* SECTION 4: GALLERY */}
          <h4 style={{color:'#2D3748', borderBottom:'1px solid #eee', paddingBottom:'10px', marginBottom:'20px', marginTop:'30px'}}>4. Gallery</h4>

          <div className="form-section">
            <label className="form-label">Gig Image</label>
            <div style={{border:'2px dashed #CBD5E0', padding:'20px', borderRadius:'10px', textAlign:'center', cursor:'pointer', background: preview ? `url(${preview}) center/cover` : '#FAFCFE', height:'200px'}}>
                <input type="file" style={{opacity:0, width:'100%', height:'100%', cursor:'pointer'}} accept="image/*" onChange={handleImageChange} required />
                {!preview && <p style={{color:'#A0AEC0', marginTop:'-120px'}}>Click to Upload</p>}
            </div>
          </div>

          <button type="submit" className="submit-btn" style={{marginTop:'30px'}}>Publish Gig</button>
        </form>
      </div>
    </div>
  );
};

export default CreateGig;