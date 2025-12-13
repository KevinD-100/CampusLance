import React from 'react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const ClientDash = ({ user }) => {
  const navigate = useNavigate();
  return (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>💳 Total Spent</h3>
          <div className="value">₹2,100</div>
        </div>
        <div className="stat-card">
          <h3>🤝 Hired Talent</h3>
          <div className="value">2</div>
        </div>
        <div className="stat-card">
          <h3>📢 Jobs Posted</h3>
          <div className="value">1</div>
          <button className="create-btn-primary" style={{marginTop: '15px', fontSize: '0.9rem'}} onClick={() => navigate('/post-job')}>
            Post Requirement
          </button>
        </div>
      </div>

      <h3 className="section-title">My Orders (Tracking)</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Freelancer</th>
            <th>Service</th>
            <th>Milestone</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kevin D.</td>
            <td>App Development</td>
            <td>Final Delivery</td>
            <td><span className="badge active">Delivered</span></td>
            <td>
              <button className="action-btn success">Accept</button>
              <button className="action-btn outline">Revision</button>
            </td>
          </tr>
          <tr>
            <td>Sarah L.</td>
            <td>Content Writing</td>
            <td>Draft 1</td>
            <td><span className="badge pending">Waiting</span></td>
            <td><button className="action-btn outline">Chat</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ClientDash;