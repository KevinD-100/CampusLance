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
  const [timeline, setTimeline] = useState(null);

  const refreshData = () => {
    // Stats
    fetch('http://localhost:5000/api/admin/stats').then(res => res.json()).then(data => setStats(data));
    fetch('http://localhost:5000/api/admin/sprint-summary').then(res => res.json()).then(data => setSprintData(data));

    // Users
    fetch('http://localhost:5000/api/admin/users').then(res => res.json()).then(data => setUsersList(data));

    // Disputes
    fetch('http://localhost:5000/api/admin/disputes').then(res => res.json()).then(data => setDisputes(data));

    // Categories
    fetch('http://localhost:5000/api/admin/categories').then(res => res.json()).then(data => setCategories(data));

    // Timeline
    fetch('http://localhost:5000/api/admin/timeline').then(res => res.json()).then(data => setTimeline(data));
  };

  useEffect(() => { refreshData(); }, []);

  // --- ACTIONS ---
  const toggleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    if (!window.confirm(`Mark user as ${newStatus}?`)) return;
    await fetch(`http://localhost:5000/api/admin/user/status/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    refreshData();
  };

  const resolveDispute = async (disputeId, orderId, decision) => {
    if (!window.confirm(`Resolve as: ${decision}?`)) return;
    await fetch('http://localhost:5000/api/admin/dispute/resolve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispute_id: disputeId, order_id: orderId, resolution: decision })
    });
    alert("Dispute Resolved.");
    refreshData();
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat) return;
    await fetch('http://localhost:5000/api/admin/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
          <h3 className="section-title">Workload Timeline (7 Days)</h3>
          <div className="timeline-visual" style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '150px', padding: '20px', background: '#F7FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '15px' }}>
            {timeline ? Object.keys(timeline).map((day, idx) => {
              // Find max count to scale the bars (prevent over-sizing)
              const maxCount = Math.max(...Object.values(timeline), 1); // min 1 to avoid div by zero
              const count = timeline[day];
              const heightPct = (count / maxCount) * 100;

              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#3182CE', marginBottom: '5px' }}>{count}</span>
                  <div style={{ width: '100%', maxWidth: '40px', background: count > 0 ? '#3182CE' : '#E2E8F0', height: `${Math.max(heightPct, 5)}%`, borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease' }}></div>
                  <span style={{ fontSize: '0.85rem', color: '#4A5568', marginTop: '10px', fontWeight: '500' }}>{day}</span>
                </div>
              );
            }) : (
              <div style={{ width: '100%', textAlign: 'center', color: '#A0AEC0', alignSelf: 'center' }}>Loading Timeline...</div>
            )}
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
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px' }}>
            {categories.map(c => (
              <li key={c.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>📂 {c.name}</li>
            ))}
          </ul>
          <form onSubmit={addCategory} style={{ display: 'flex', gap: '10px' }}>
            <input className="form-input" placeholder="New Category" value={newCat} onChange={e => setNewCat(e.target.value)} />
            <button className="btn-small">Add</button>
          </form>
        </div>

        {/* Revision Rules */}
        <div className="section-container">
          <h3 className="section-title">Revision Rules</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Set global limits for revisions allowed per order tier.</p>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontWeight: '600' }}>Standard Gigs</label>
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
            <div key={d.id} className="request-card" style={{ borderColor: '#FEB2B2', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="req-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ color: '#C53030', margin: 0 }}>Order #{d.order_id}</h4>
                <span style={{ fontWeight: 'bold', color: '#3182CE', fontSize: '1.1rem' }}>₹{d.price || 0}</span>
              </div>

              <div style={{ fontSize: '0.85rem', padding: '12px', background: '#F7FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#718096' }}>Project:</span> <strong>{d.job_title || 'Direct Order'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ color: '#718096', display: 'block', marginBottom: '2px' }}>Client</span>
                    <strong>{d.client_name || 'Unknown'}</strong><br />
                    {d.client_email && <a href={`mailto:${d.client_email}`} style={{ fontSize: '0.75rem', color: '#3182CE', textDecoration: 'none' }}>{d.client_email}</a>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#718096', display: 'block', marginBottom: '2px' }}>Freelancer</span>
                    <strong>{d.freelancer_name || 'Unknown'}</strong><br />
                    {d.freelancer_email && <a href={`mailto:${d.freelancer_email}`} style={{ fontSize: '0.75rem', color: '#3182CE', textDecoration: 'none' }}>{d.freelancer_email}</a>}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dispute Raised By {d.raised_by_name}:</span>
                <div className="req-desc" style={{ background: '#FFF5F5', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #F56565', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '5px' }}>
                  "{d.reason}"
                </div>
              </div>

              <div className="req-footer" style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button className="action-btn success" style={{ flex: 1, padding: '10px' }} onClick={() => resolveDispute(d.id, d.order_id, 'resolved_paid')}>
                  Release Pay to Freelancer
                </button>
                <button className="action-btn outline" style={{ borderColor: '#E53E3E', color: '#E53E3E', flex: 1, padding: '10px' }} onClick={() => resolveDispute(d.id, d.order_id, 'resolved_refund')}>
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
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📊 Analytics</button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 Users</button>
        <button className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>⚖️ Rules</button>
        <button className={`tab-btn ${activeTab === 'disputes' ? 'active' : ''}`} onClick={() => setActiveTab('disputes')}>⚠️ Disputes</button>
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