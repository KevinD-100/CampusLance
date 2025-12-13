import React from 'react';
import './Dashboard.css'; // Use common styles
import { useNavigate } from 'react-router-dom';

const FreelancerDash = ({ user }) => {
  const navigate = useNavigate();
  return (
    <div className="dashboard-content">
      {/* 1. Statistics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>💰 Earnings</h3>
          <div className="value">₹5,200</div>
          <small className="trend">+ ₹1,200 this week</small>
        </div>
        <div className="stat-card">
          <h3>📦 Active Orders</h3>
          <div className="value">3</div>
          <small className="trend">1 Due today</small>
        </div>
        <div className="stat-card">
          <h3>⭐ Skill Score</h3>
          <div className="value">92/100</div>
          <small className="trend">Top Rated</small>
        </div>
      </div>

      <div className="dashboard-split">
        {/* 2. My Active Orders */}
        <div className="section-container">
          <h3 className="section-title">Active Orders (To Do)</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Project</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Alex J.</td>
                <td>Web Development</td>
                <td>Dec 15</td>
                <td><span className="badge active">In Progress</span></td>
                <td><button className="action-btn">Submit Draft</button></td>
              </tr>
              <tr>
                <td>Maya S.</td>
                <td>Logo Design</td>
                <td>Dec 18</td>
                <td><span className="badge pending">Revision</span></td>
                <td><button className="action-btn">Upload Fix</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. My Gigs (Services) */}
        <div className="section-container">
          <div className="header-row">
            <h3 className="section-title">My Gigs</h3>
            <button className="create-btn-primary" onClick={() => navigate('/create-gig')}>
              <span>+</span> Create Gig
            </button>
          </div>
          <div className="gig-list">
            <div className="gig-item">
              <img src="https://via.placeholder.com/50" alt="Gig" />
              <div>
                <h4>React Website Dev</h4>
                <p>Starting at ₹500</p>
              </div>
              <span className="status-dot online"></span>
            </div>
            <div className="gig-item">
              <img src="https://via.placeholder.com/50" alt="Gig" />
              <div>
                <h4>Poster Design</h4>
                <p>Starting at ₹200</p>
              </div>
              <span className="status-dot offline"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerDash;