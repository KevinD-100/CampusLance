import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Forms.css';

const EditGig = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get Gig ID from URL
  const [gig, setGig] = useState({ title: '', price: '', deliveryDays: '', description: '' });
  const [image, setImage] = useState(null);

  // Fetch Existing Data
  useEffect(() => {
    fetch(`http://localhost:5000/api/gigs/single/${id}`)
      .then(res => res.json())
      .then(data => {
        // Map DB fields to state
        setGig({
            title: data.title,
            price: data.price,
            deliveryDays: data.delivery_days,
            description: data.description
        });
      });
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', gig.title);
    formData.append('description', gig.description);
    formData.append('price', gig.price);
    formData.append('delivery_days', gig.deliveryDays);
    if (image) formData.append('image', image);

    const res = await fetch(`http://localhost:5000/api/gigs/${id}`, {
        method: 'PUT',
        body: formData
    });

    if (res.ok) {
        alert("Gig Updated!");
        navigate('/dashboard');
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
        <div className="form-header"><h2>Edit Gig</h2></div>

        <form onSubmit={handleUpdate}>
          <div className="form-section">
            <label className="form-label">Title</label>
            <input type="text" className="form-input" value={gig.title} onChange={(e) => setGig({...gig, title: e.target.value})} />
          </div>
          <div className="row-split">
            <div className="form-section">
              <label className="form-label">Price</label>
              <input type="number" className="form-input" value={gig.price} onChange={(e) => setGig({...gig, price: e.target.value})} />
            </div>
            <div className="form-section">
              <label className="form-label">Days</label>
              <input type="number" className="form-input" value={gig.deliveryDays} onChange={(e) => setGig({...gig, deliveryDays: e.target.value})} />
            </div>
          </div>
          <div className="form-section">
            <label className="form-label">Update Image (Optional)</label>
            <input type="file" className="form-input" onChange={(e) => setImage(e.target.files[0])} />
          </div>
          <div className="form-section">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={gig.description} onChange={(e) => setGig({...gig, description: e.target.value})}></textarea>
          </div>
          <button type="submit" className="submit-btn">Update Gig</button>
        </form>
      </div>
    </div>
  );
};

export default EditGig;