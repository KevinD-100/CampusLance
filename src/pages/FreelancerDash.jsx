import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const FreelancerDash = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // --- MOCK DATA ---
  const myGigs = [
    { id: 101, title: "Modern Logo Design", price: 500, orders: 12, rating: 4.9, img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop" },
    { id: 102, title: "React Web App", price: 2000, orders: 4, rating: 5.0, img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200" },
  ];

  const clientRequests = [
    { id: 1, client: "Alex J.", title: "Need a 3-page Portfolio Website", budget: "₹1500 - ₹2000", deadline: "5 Days", tags: ["HTML", "CSS"] },
    { id: 2, client: "College Fest Team", title: "Poster for Tech Fest 2025", budget: "₹500", deadline: "2 Days", tags: ["Canva", "Photoshop"] },
  ];

  const portfolioItems = [
    { id: 1, title: "E-Commerce UI", category: "Web Design", img: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300" },
    { id: 2, title: "Tech Fest Logo", category: "Branding", img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300" },
  ];

  // --- SUB-SECTIONS ---

  // 1. OVERVIEW (Stats, Skill Score, Active Orders)
  const OverviewSection = () => (
    <div className="animate-fade-in">
      {/* Skill Score & Quizzes */}
      <div className="skill-score-card">
        <div className="score-circle">
          <span>92</span>
          <small>Score</small>
        </div>
        <div className="score-info">
          <h4>Verified Skill Badge: <span style={{color:'#48BB78'}}>Gold</span></h4>
          <p>You passed the <b>React.js Assessment</b>.</p>
          <button className="btn-small outline">Take New Quiz (+5 pts)</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>💰 Total Earnings</h3>
          <div className="value">₹5,200</div>
        </div>
        <div className="stat-card">
          <h3>📦 Active Orders</h3>
          <div className="value">2</div>
        </div>
      </div>

      <h3 className="section-title">Active Orders & Milestones</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Project</th>
            <th>Current Milestone</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Maya S.</td>
            <td>Logo Design</td>
            <td>Draft 1</td>
            <td><span className="badge pending">Revision Requested</span></td>
            <td>
              <button className="action-btn success">Upload Fix</button>
              <button className="action-btn outline">Chat</button>
            </td>
          </tr>
          <tr>
            <td>John D.</td>
            <td>React App</td>
            <td>Final Delivery</td>
            <td><span className="badge active">In Progress</span></td>
            <td>
              <button className="action-btn">Submit Draft</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // 2. MY GIGS (Templates, Scaling)
  const GigsSection = () => (
    <div className="animate-fade-in">
      <div className="header-row">
        <h3 className="section-title">Manage Services</h3>
        <button className="create-btn-primary" onClick={() => navigate('/create-gig')}>+ Create New Gig</button>
      </div>

      <div className="gigs-list-vertical">
        {myGigs.map(gig => (
          <div key={gig.id} className="gig-row-card">
            <img src={gig.img} alt={gig.title} />
            <div className="gig-details">
              <h4>{gig.title}</h4>
              <p>Starting at <b>₹{gig.price}</b> • ⭐ {gig.rating} ({gig.orders} orders)</p>
            </div>
            <div className="gig-actions">
              <button className="btn-small">🖊 Edit</button>
              <button className="btn-small outline" title="Use as Template">📄 Duplicate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 3. FIND WORK (Bidding, Requests)
  const FindWorkSection = () => (
    <div className="animate-fade-in">
      <h3 className="section-title">Latest Client Requests</h3>
      <div className="requests-grid">
        {clientRequests.map(req => (
          <div key={req.id} className="request-card">
            <div className="req-header">
              <h4>{req.title}</h4>
              <span className="budget-badge">{req.budget}</span>
            </div>
            <p className="req-client">Posted by: {req.client} • Deadline: {req.deadline}</p>
            <div className="tags-row">
              {req.tags.map(tag => <span key={tag} className="skill-tag">{tag}</span>)}
            </div>
            <div className="req-footer">
              <button className="create-btn-primary" style={{width:'100%', justifyContent:'center'}}>Send Proposal / Bid</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 4. PORTFOLIO VAULT
  const PortfolioSection = () => (
    <div className="animate-fade-in">
      <div className="header-row">
        <h3 className="section-title">My Portfolio Vault</h3>
        <button className="btn-small outline">Upload New Work</button>
      </div>
      
      <div className="gigs-grid">
        {portfolioItems.map(item => (
          <div key={item.id} className="gig-card">
            <img src={item.img} alt={item.title} className="gig-img" style={{height:'180px'}}/>
            <div className="gig-info">
              <div className="gig-cat">{item.category}</div>
              <h4>{item.title}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard-content">
      {/* TABS NAVIGATION */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
        <button className={`tab-btn ${activeTab === 'gigs' ? 'active' : ''}`} onClick={() => setActiveTab('gigs')}>💼 My Gigs</button>
        <button className={`tab-btn ${activeTab === 'work' ? 'active' : ''}`} onClick={() => setActiveTab('work')}>🔍 Find Work</button>
        <button className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>🎨 Portfolio</button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'gigs' && <GigsSection />}
        {activeTab === 'work' && <FindWorkSection />}
        {activeTab === 'portfolio' && <PortfolioSection />}
      </div>
    </div>
  );
};

export default FreelancerDash;