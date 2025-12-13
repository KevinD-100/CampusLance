import React from 'react';
import './Dashboard.css';

const AdminDash = ({ user }) => {
  return (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>👥 Total Users</h3>
          <div className="value">1,250</div>
        </div>
        <div className="stat-card">
          <h3>⚠️ Active Disputes</h3>
          <div className="value" style={{color: '#E53E3E'}}>5</div>
        </div>
        <div className="stat-card">
          <h3>✅ Pending Verification</h3>
          <div className="value">12</div>
        </div>
      </div>

      <div className="section-container">
        <h3 className="section-title">Moderation Queue</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Details</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge dispute">Dispute</span></td>
              <td>Order #992: Client claims incomplete work</td>
              <td>Today</td>
              <td>Open</td>
              <td><button className="action-btn">Resolve</button></td>
            </tr>
            <tr>
              <td><span className="badge pending">Verify</span></td>
              <td>New User: John Doe (ID Check)</td>
              <td>Yesterday</td>
              <td>Pending</td>
              <td>
                <button className="action-btn success">Approve</button>
                <button className="action-btn outline">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDash;