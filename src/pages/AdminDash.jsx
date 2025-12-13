import React, { useState } from 'react';
import './Dashboard.css';

const AdminDash = ({ user }) => {
  const [activeTab, setActiveTab] = useState('analytics');

  // --- MOCK DATA ---
  const users = [
    { id: 1, name: "John Doe", role: "Freelancer", status: "Pending", joined: "2 hours ago", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" },
    { id: 2, name: "Sarah Smith", role: "Freelancer", status: "Active", joined: "1 month ago", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
    { id: 3, name: "Mike Ross", role: "Client", status: "Disabled", joined: "2 months ago", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100" },
  ];

  const disputes = [
    { id: 902, order: "#ORD-902", raisedBy: "Client (Alice)", against: "Freelancer (Bob)", issue: "Incomplete Delivery", status: "Open", amount: "₹2000" },
  ];

  const pendingGigs = [
    { id: 55, title: "Write Python Scripts", freelancer: "David K.", category: "Tech", status: "Pending Review" },
  ];

  // --- SUB-SECTIONS ---

  // 1. ANALYTICS (Sprint Summaries, Workload)
  const AnalyticsSection = () => (
    <div className="animate-fade-in">
      {/* Top Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>👥 Total Users</h3>
          <div className="value">1,240</div>
          <small className="trend">+12 this week</small>
        </div>
        <div className="stat-card">
          <h3>📦 Total Orders</h3>
          <div className="value">450</div>
          <small className="trend">85 Completed</small>
        </div>
        <div className="stat-card">
          <h3>⚠️ Active Disputes</h3>
          <div className="value" style={{ color: '#E53E3E' }}>3</div>
        </div>
      </div>

      <div className="dashboard-split">
        {/* Sprint Summary Report */}
        <div className="section-container">
          <h3 className="section-title">Sprint-Wise Activity Summary</h3>
          <div className="sprint-card">
            <div className="sprint-header">
              <h4>Current Sprint: Week 12</h4>
              <span className="badge active">In Progress</span>
            </div>
            <p>Focus: UI Design Gigs & Backend Orders</p>
            <ul className="sprint-stats">
              <li>🚀 <b>15</b> New Gigs Published</li>
              <li>🤝 <b>8</b> New Hiring Contracts</li>
              <li>✅ <b>95%</b> Order Completion Rate</li>
            </ul>
            <button className="btn-small outline">Download Report PDF</button>
          </div>
        </div>

        {/* Workload Timeline Visualization */}
        <div className="section-container">
          <h3 className="section-title">Workload Timeline</h3>
          <div className="timeline-visual">
            <div className="timeline-item">
              <span className="time">Mon</span>
              <div className="bar" style={{width: '40%', background: '#CBD5E0'}}></div>
            </div>
            <div className="timeline-item">
              <span className="time">Tue</span>
              <div className="bar" style={{width: '70%', background: '#48BB78'}}></div>
            </div>
            <div className="timeline-item">
              <span className="time">Wed</span>
              <div className="bar" style={{width: '90%', background: '#2D3748'}}></div>
            </div>
            <div className="timeline-item">
              <span className="time">Thu</span>
              <div className="bar" style={{width: '60%', background: '#A0AEC0'}}></div>
            </div>
            <div className="timeline-item">
              <span className="time">Fri</span>
              <div className="bar" style={{width: '50%', background: '#CBD5E0'}}></div>
            </div>
          </div>
          <p style={{fontSize:'0.8rem', color:'#718096', marginTop:'10px'}}>*Based on active order volume</p>
        </div>
      </div>
    </div>
  );

  // 2. USER MANAGEMENT (Approve, Disable)
  const UserMgmtSection = () => (
    <div className="animate-fade-in">
      <h3 className="section-title">Manage Freelancers & Clients</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>
                <div className="user-mini">
                  <img src={u.img} alt={u.name} />
                  {u.name}
                </div>
              </td>
              <td>{u.role}</td>
              <td>{u.joined}</td>
              <td>
                <span className={`badge ${u.status === 'Active' ? 'active' : u.status === 'Pending' ? 'pending' : 'dispute'}`}>
                  {u.status}
                </span>
              </td>
              <td>
                {u.status === 'Pending' && (
                  <button className="action-btn success">Approve</button>
                )}
                {u.status === 'Active' && (
                  <button className="action-btn outline" style={{color:'red', borderColor:'red'}}>Disable</button>
                )}
                {u.status === 'Disabled' && (
                  <button className="action-btn outline">Re-activate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // 3. MODERATION & RULES (Gigs, Categories)
  const ModerationSection = () => (
    <div className="animate-fade-in">
      <div className="dashboard-split">
        {/* Gig Moderation */}
        <div className="section-container" style={{flex: 2}}>
          <h3 className="section-title">Pending Gig Approvals</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Gig Title</th>
                <th>Freelancer</th>
                <th>Category</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingGigs.map(g => (
                <tr key={g.id}>
                  <td>{g.title}</td>
                  <td>{g.freelancer}</td>
                  <td>{g.category}</td>
                  <td>
                    <button className="action-btn success">Accept</button>
                    <button className="action-btn outline">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rules Configuration */}
        <div className="section-container" style={{flex: 1}}>
          <h3 className="section-title">Platform Rules</h3>
          
          <div className="rule-group">
            <label style={{display:'block', marginBottom:'5px', fontSize:'0.9rem', fontWeight:'600'}}>Revision Cap (Global)</label>
            <select className="form-select" style={{padding:'5px'}}>
              <option>3 Revisions</option>
              <option>5 Revisions</option>
              <option>Unlimited</option>
            </select>
          </div>

          <div className="rule-group" style={{marginTop:'20px'}}>
            <label style={{display:'block', marginBottom:'5px', fontSize:'0.9rem', fontWeight:'600'}}>Add New Category</label>
            <div style={{display:'flex', gap:'5px'}}>
              <input type="text" placeholder="Category Name" style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #ccc'}} />
              <button className="btn-small">+ Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 4. DISPUTE RESOLUTION
  const DisputeSection = () => (
    <div className="animate-fade-in">
      <h3 className="section-title">Dispute Resolution Center</h3>
      <div className="requests-grid">
        {disputes.map(d => (
          <div key={d.id} className="request-card" style={{borderColor: '#FEB2B2'}}>
            <div className="req-header">
              <h4 style={{color:'#C53030'}}>Dispute {d.order}</h4>
              <span className="badge dispute">Open</span>
            </div>
            <p className="req-client">Amount Held: <b>{d.amount}</b></p>
            <div style={{background:'#FFF5F5', padding:'10px', borderRadius:'8px', margin:'10px 0', fontSize:'0.9rem'}}>
              <p><b>Raised By:</b> {d.raisedBy}</p>
              <p><b>Against:</b> {d.against}</p>
              <p><b>Reason:</b> "{d.issue}"</p>
            </div>
            <div className="req-footer" style={{display:'flex', gap:'10px'}}>
              <button className="action-btn success" style={{flex:1}}>Refund Client</button>
              <button className="action-btn outline" style={{flex:1}}>Pay Freelancer</button>
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
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📊 Analytics</button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 Users</button>
        <button className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveTab('moderation')}>🛡️ Moderation</button>
        <button className={`tab-btn ${activeTab === 'disputes' ? 'active' : ''}`} onClick={() => setActiveTab('disputes')}>⚖️ Disputes</button>
      </div>

      <div className="tab-content">
        {activeTab === 'analytics' && <AnalyticsSection />}
        {activeTab === 'users' && <UserMgmtSection />}
        {activeTab === 'moderation' && <ModerationSection />}
        {activeTab === 'disputes' && <DisputeSection />}
      </div>
    </div>
  );
};

export default AdminDash;