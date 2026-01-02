import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const AdminDash = ({ user }) => {
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Real Data
  const [stats, setStats] = useState({ users: 0, gigs: 0, orders: 0 });
  const [sprintData, setSprintData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState("");

  const refreshData = () => {
    // Stats
    fetch('http://localhost:5000/api/admin/stats').then(res=>res.json()).then(data=>setStats(data));
    fetch('http://localhost:5000/api/admin/sprint-summary').then(res=>res.json()).then(data=>setSprintData(data));
    
    // Users
    fetch('http://localhost:5000/api/admin/users').then(res=>res.json()).then(data=>setUsersList(data));
    
    // Disputes
    fetch('http://localhost:5000/api/admin/disputes').then(res=>res.json()).then(data=>setDisputes(data));
    
    // Categories
    fetch('http://localhost:5000/api/admin/categories').then(res=>res.json()).then(data=>setCategories(data));
  };

  useEffect(() => { refreshData(); }, []);

  // --- ACTIONS ---
  const toggleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if(!window.confirm(`Mark user as ${newStatus}?`)) return;
    await fetch(`http://localhost:5000/api/admin/user/status/${id}`, {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ status: newStatus })
    });
    refreshData();
  };

  const resolveDispute = async (disputeId, orderId, decision) => {
    if(!window.confirm(`Resolve as: ${decision}?`)) return;
    await fetch('http://localhost:5000/api/admin/dispute/resolve', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ dispute_id: disputeId, order_id: orderId, resolution: decision })
    });
    alert("Dispute Resolved.");
    refreshData();
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if(!newCat) return;
    await fetch('http://localhost:5000/api/admin/categories', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name: newCat })
    });
    setNewCat("");
    refreshData();
  };

  // --- SECTIONS ---
  const AnalyticsSection = () => (
    <div className="animate-fade-in">
      <div className="stats-grid">
        <div className="stat-card"><h3>👥 Total Users</h3><div className="value">{stats.users}</div></div>
        <div className="stat-card"><h3>📦 Total Gigs</h3><div className="value">{stats.gigs}</div></div>
        <div className="stat-card"><h3>🛒 Total Orders</h3><div className="value">{stats.orders}</div></div>
      </div>

      <div className="dashboard-split">
        {/* Sprint Summary (Req: Generate sprint-wise activity summaries) */}
        <div className="section-container">
            <h3 className="section-title">Sprint Activity Summary</h3>
            {sprintData && (
                <div className="sprint-card">
                    <div className="sprint-header">
                        <h4>{sprintData.sprint_week}</h4>
                        <span className="badge active">Live</span>
                    </div>
                    <ul className="sprint-stats">
                        <li>✅ <b>{sprintData.orders_completed}</b> Orders Completed</li>
                        <li>💰 <b>₹{sprintData.revenue_flow}</b> Volume Traded</li>
                        <li>🚀 <b>{sprintData.active_freelancers}</b> Active Freelancers</li>
                    </ul>
                    <button className="btn-small outline">Download Report</button>
                </div>
            )}
        </div>
        
        {/* Workload Timeline (Visual) */}
        <div className="section-container">
            <h3 className="section-title">Workload Timeline</h3>
            <div className="timeline-visual">
                <div className="timeline-item"><span className="time">Mon</span><div className="bar" style={{width:'40%', background:'#CBD5E0'}}></div></div>
                <div className="timeline-item"><span className="time">Tue</span><div className="bar" style={{width:'60%', background:'#48BB78'}}></div></div>
                <div className="timeline-item"><span className="time">Wed</span><div className="bar" style={{width:'80%', background:'#2D3748'}}></div></div>
            </div>
        </div>
      </div>
    </div>
  );

  const UserMgmtSection = () => (
    <div className="animate-fade-in">
      <h3 className="section-title">Manage Access</h3>
      <table className="data-table">
        <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {usersList.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td>
                <span className={`badge ${u.status === 'active' ? 'active' : 'dispute'}`}>
                    {u.status || 'active'}
                </span>
              </td>
              <td>
                {u.role !== 'admin' && (
                    <button 
                        className={`btn-small ${u.status === 'active' ? 'outline' : 'success'}`} 
                        onClick={() => toggleUserStatus(u.id, u.status || 'active')}
                    >
                        {u.status === 'active' ? '🚫 Disable' : '✅ Approve'}
                    </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const RulesSection = () => (
    <div className="animate-fade-in">
        <div className="dashboard-split">
            {/* Category Rules */}
            <div className="section-container">
                <h3 className="section-title">Define Categories</h3>
                <ul style={{listStyle:'none', padding:0, marginBottom:'15px'}}>
                    {categories.map(c => (
                        <li key={c.id} style={{padding:'8px', borderBottom:'1px solid #eee'}}>📂 {c.name}</li>
                    ))}
                </ul>
                <form onSubmit={addCategory} style={{display:'flex', gap:'10px'}}>
                    <input className="form-input" placeholder="New Category" value={newCat} onChange={e=>setNewCat(e.target.value)} />
                    <button className="btn-small">Add</button>
                </form>
            </div>

            {/* Revision Rules */}
            <div className="section-container">
                <h3 className="section-title">Revision Rules</h3>
                <p style={{fontSize:'0.9rem', color:'#666', marginBottom:'15px'}}>Set global limits for revisions allowed per order tier.</p>
                <div style={{marginBottom:'10px'}}>
                    <label style={{display:'block', fontWeight:'600'}}>Standard Gigs</label>
                    <select className="form-input"><option>3 Revisions</option><option>5 Revisions</option></select>
                </div>
                <button className="btn-small outline">Save Rules</button>
            </div>
        </div>
    </div>
  );

  const DisputesSection = () => (
    <div className="animate-fade-in">
        <h3 className="section-title">Resolve Disputes</h3>
        {disputes.length === 0 ? <p>No open disputes.</p> : (
            <div className="requests-grid">
                {disputes.map(d => (
                    <div key={d.id} className="request-card" style={{borderColor:'#FEB2B2'}}>
                        <div className="req-header"><h4 style={{color:'#C53030'}}>Order #{d.order_id}</h4></div>
                        <p>Raised By: <b>{d.raised_by_name}</b></p>
                        <p className="req-desc">"{d.reason}"</p>
                        <div className="req-footer" style={{display:'flex', gap:'10px'}}>
                            <button className="action-btn success" style={{flex:1}} onClick={() => resolveDispute(d.id, d.order_id, 'resolved_paid')}>
                                Release Pay
                            </button>
                            <button className="action-btn outline" style={{borderColor:'#C53030', color:'#C53030', flex:1}} onClick={() => resolveDispute(d.id, d.order_id, 'resolved_refund')}>
                                Refund Client
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  return (
    <div className="dashboard-content">
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab==='analytics'?'active':''}`} onClick={()=>setActiveTab('analytics')}>📊 Analytics</button>
        <button className={`tab-btn ${activeTab==='users'?'active':''}`} onClick={()=>setActiveTab('users')}>👥 Users</button>
        <button className={`tab-btn ${activeTab==='rules'?'active':''}`} onClick={()=>setActiveTab('rules')}>⚖️ Rules</button>
        <button className={`tab-btn ${activeTab==='disputes'?'active':''}`} onClick={()=>setActiveTab('disputes')}>⚠️ Disputes</button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'analytics' && <AnalyticsSection />}
        {activeTab === 'users' && <UserMgmtSection />}
        {activeTab === 'rules' && <RulesSection />}
        {activeTab === 'disputes' && <DisputesSection />}
      </div>
    </div>
  );
};

export default AdminDash;