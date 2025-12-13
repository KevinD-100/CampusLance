import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const ClientDash = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('explore'); // 'explore', 'jobs', 'orders'

  // --- MOCK DATA FOR DEMO ---
  const gigs = [
    { id: 1, title: "React Website Development", freelancer: "Kevin Daniel", price: 1500, rating: 4.8, category: "Tech", img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400" },
    { id: 2, title: "Event Poster Design", freelancer: "Sarah L.", price: 300, rating: 4.9, category: "Creative", img: "https://images.unsplash.com/photo-1626785774573-4b7993143a2d?w=400" },
    { id: 3, title: "Python Data Analysis Script", freelancer: "Arun K.", price: 800, rating: 4.5, category: "Tech", img: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400" },
  ];

  const bids = [
    { freelancer: "Abel John", price: 1800, days: 2, msg: "I have done similar projects." },
    { freelancer: "Nikhil Mammen", price: 1500, days: 3, msg: "Expert in Python." },
  ];

  // --- SUB-COMPONENTS ---
  
  // 1. Explore Gigs Section
  const ExploreSection = () => (
    <div className="animate-fade-in">
      <div className="filter-bar">
        <input type="text" placeholder="Search services..." className="search-input" />
        <select className="filter-select"><option>All Categories</option><option>Tech</option><option>Creative</option></select>
        <select className="filter-select"><option>Price Range</option><option>Low to High</option></select>
      </div>

      <div className="gigs-grid">
        {gigs.map(gig => (
          <div key={gig.id} className="gig-card">
            <img src={gig.img} alt={gig.title} className="gig-img" />
            <div className="gig-info">
              <div className="gig-cat">{gig.category}</div>
              <h4>{gig.title}</h4>
              <div className="gig-meta">
                <span>👤 {gig.freelancer}</span>
                <span>⭐ {gig.rating}</span>
              </div>
              <div className="gig-footer">
                <span className="gig-price">₹{gig.price}</span>
                <button className="btn-small outline">View</button>
              </div>
            </div>
            <button className="fav-btn">♥</button>
          </div>
        ))}
      </div>
    </div>
  );

  // 2. My Job Posts (With Bids)
  const JobPostsSection = () => (
    <div className="animate-fade-in">
      <div className="header-row">
        <h3 className="section-title">My Posted Requirements</h3>
        <button className="create-btn-primary" onClick={() => navigate('/post-job')}>+ Post New Job</button>
      </div>

      <div className="job-card-expanded">
        <div className="job-header">
          <div>
            <h4>Need a Python Script for Data Scraping</h4>
            <span className="badge pending">Open for Bids</span>
            <span className="post-date">Posted 2 days ago</span>
          </div>
          <div className="budget-tag">Budget: ₹2000</div>
        </div>
        
        <div className="bids-section">
          <h5>Received Bids (2)</h5>
          {bids.map((bid, index) => (
            <div key={index} className="bid-row">
              <div className="bid-info">
                <strong>{bid.freelancer}</strong>
                <p>"{bid.msg}"</p>
              </div>
              <div className="bid-action">
                <span className="bid-price">₹{bid.price}</span>
                <small>{bid.days} Days</small>
                <button className="action-btn success">Hire</button>
                <button className="action-btn outline">Chat</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 3. Active Orders (Chat, Review, Revisions)
  const OrdersSection = () => (
    <div className="animate-fade-in">
      <h3 className="section-title">Active Orders</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Freelancer</th>
            <th>Status</th>
            <th>Deliverable</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#ORD-882 (App UI)</td>
            <td>Kevin D.</td>
            <td><span className="badge active">Draft Delivered</span></td>
            <td><a href="#" style={{color: '#2563EB'}}>view_draft.png</a></td>
            <td>
              <button className="action-btn outline">Request Revision</button>
              <button className="action-btn success">Approve & Rate</button>
              <button className="action-btn" style={{marginLeft:'5px'}}>💬 Chat</button>
            </td>
          </tr>
          <tr>
            <td>#ORD-901 (Content)</td>
            <td>Sarah L.</td>
            <td><span className="badge pending">In Progress</span></td>
            <td>-</td>
            <td>
               <button className="action-btn outline">💬 Chat</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="dashboard-content">
      {/* Top Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>💳 Total Spent</h3>
          <div className="value">₹2,100</div>
        </div>
        <div className="stat-card">
          <h3>🤝 Active Hires</h3>
          <div className="value">2</div>
        </div>
        <div className="stat-card">
          <h3>⭐ Avg Rating Given</h3>
          <div className="value">4.8</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}>🔍 Explore Gigs</button>
        <button className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>📢 My Jobs (Bids)</button>
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📦 Active Orders</button>
      </div>

      {/* Render Content Based on Tab */}
      <div className="tab-content">
        {activeTab === 'explore' && <ExploreSection />}
        {activeTab === 'jobs' && <JobPostsSection />}
        {activeTab === 'orders' && <OrdersSection />}
      </div>
    </div>
  );
};

export default ClientDash;