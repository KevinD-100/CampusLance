import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FreelancerDash from './FreelancerDash';
import ClientDash from './ClientDash';
import AdminDash from './AdminDash';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState(null);

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // New State for Sidebar Navigation (Default: 'dashboard')
  const [currentSection, setCurrentSection] = useState('dashboard');

  useEffect(() => {
    const storedData = localStorage.getItem('campusUser');
    if (!storedData) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(storedData);
      setUser(parsedUser);
      if (!viewMode) setViewMode(parsedUser.role || 'client');

      // Fetch Notifications
      fetch(`http://localhost:5000/api/notifications/${parsedUser.id}`)
        .then(res => res.json())
        .then(data => setNotifications(data));
    }
  }, [navigate, viewMode]);

  const handleLogout = () => {
    localStorage.removeItem('campusUser');
    navigate('/login');
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'freelancer' ? 'client' : 'freelancer');
    setCurrentSection('dashboard'); // Reset view on switch
  };

  // Notification Filter
  const filteredNotifs = notifications.filter(n => {
    if (viewMode === 'freelancer') return ['order', 'review', 'message'].includes(n.type);
    if (viewMode === 'client') return ['bid', 'delivery', 'message'].includes(n.type);
    return true;
  });
  const unreadCount = filteredNotifs.filter(n => !n.is_read).length;

  const handleOpenNotifications = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown && unreadCount > 0) {
      fetch(`http://localhost:5000/api/notifications/read/all/${user.id}`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    }
  };

  if (!user || !viewMode) return null;

  return (
    <div className="dashboard-layout">

      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <div className="sidebar-logo">CAMPUSLANCE</div>

        {/* Role Switcher */}
        {user.role !== 'admin' && (
          <div className="switch-container">
            <button className="switch-btn" onClick={toggleViewMode}>
              {viewMode === 'freelancer' ? '⇄ Switch to Buying' : '⇄ Switch to Selling'}
            </button>
          </div>
        )}

        <div className="menu-group">
          <p className="menu-label">MENU ({viewMode.toUpperCase()})</p>

          <div className={`menu-item ${currentSection === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentSection('dashboard')}>
            Dashboard
          </div>

          <div className={`menu-item ${currentSection === 'messages' ? 'active' : ''}`} onClick={() => setCurrentSection('messages')}>
            Messages {unreadCount > 0 && <span className="badge pending" style={{ marginLeft: 'auto' }}>!</span>}
          </div>

          {/* DYNAMIC MENU LINKS */}
          {viewMode === 'freelancer' && (
            <>
              <div className={`menu-item ${currentSection === 'create' ? 'active' : ''}`} onClick={() => navigate('/create-gig')}>
                + Create Gig
              </div>
              <div className={`menu-item ${currentSection === 'gigs' ? 'active' : ''}`} onClick={() => setCurrentSection('gigs')}>
                My Gigs
              </div>
              <div className={`menu-item ${currentSection === 'work' ? 'active' : ''}`} onClick={() => setCurrentSection('work')}>
                Find Work  {/* 👈 THIS WAS MISSING/BROKEN */}
              </div>
              <div className={`menu-item ${currentSection === 'portfolio' ? 'active' : ''}`} onClick={() => setCurrentSection('portfolio')}>
                Portfolio
              </div>
              <div className={`menu-item ${currentSection === 'skills' ? 'active' : ''}`} onClick={() => setCurrentSection('skills')}>
                Skill Tests 🏆
              </div>
            </>
          )}

          {viewMode === 'client' && (
            <>
              <div className="menu-item" onClick={() => navigate('/post-job')}>+ Post Requirement</div>
              <div className={`menu-item ${currentSection === 'explore' ? 'active' : ''}`} onClick={() => setCurrentSection('explore')}>Explore Gigs</div>
              <div className={`menu-item ${currentSection === 'jobs' ? 'active' : ''}`} onClick={() => setCurrentSection('jobs')}>My Jobs</div>
              <div className={`menu-item ${currentSection === 'orders' ? 'active' : ''}`} onClick={() => setCurrentSection('orders')}>My Orders</div>
            </>
          )}

          {/* ADMIN */}
          {viewMode === 'admin' && (
            <>
              <div className="menu-item" onClick={() => setCurrentSection('users')}>User Management</div>
              <div className="menu-item" onClick={() => setCurrentSection('disputes')}>Disputes</div>
            </>
          )}

          <div className={`menu-item ${currentSection === 'settings' ? 'active' : ''}`} onClick={() => setCurrentSection('settings')}>
            Settings
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-mini" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <img src={user.profile_pic || user.picture || "https://via.placeholder.com/30"} alt="User" onError={(e) => e.target.src = "https://via.placeholder.com/30"} />
            <div style={{ display: 'flex', flexDirection: 'column' }}><span>{user.name}</span><small style={{ fontSize: '0.7rem', color: '#718096' }}>Edit Profile</small></div>
          </div>
          <button onClick={handleLogout} className="logout-link">Logout</button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="main-area">
        {/* Header */}
        <header className="top-bar">
          <div>
            <h2 style={{ textTransform: 'capitalize' }}>{currentSection === 'dashboard' ? `Welcome, ${user.name.split(' ')[0]}` : currentSection.toUpperCase()}</h2>
            <p style={{ color: '#718096', fontSize: '0.9rem', margin: '5px 0 0' }}>
              {currentSection === 'dashboard' ? 'Here is what is happening today.' : `Manage your ${currentSection}.`}
            </p>
          </div>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button className="notif-btn" onClick={handleOpenNotifications}>
              🔔 {unreadCount > 0 && <span className="badge dispute" style={{ position: 'absolute', top: -5, right: -5, padding: 0, width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{unreadCount}</span>}
            </button>
            {showNotifDropdown && (
              <div className="notif-dropdown" style={{ position: 'absolute', right: 0, top: 50, width: 300, background: 'white', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', padding: 10, borderRadius: 10, zIndex: 200, maxHeight: '300px', overflowY: 'auto', border: '1px solid #E2E8F0' }}>
                <h5 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Notifications</h5>
                {filteredNotifs.length === 0 ? <p style={{ fontSize: '0.8rem', color: '#888', padding: '20px', textAlign: 'center' }}>No new alerts.</p> :
                  filteredNotifs.map(n => (
                    <div key={n.id} style={{ padding: '12px', borderBottom: '1px solid #eee', fontSize: '0.85rem', opacity: n.is_read ? 0.5 : 1, background: n.is_read ? 'white' : '#F0FFF4' }}>
                      {JSON.parse(n.payload).message}
                      <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '2px' }}>{new Date(n.created_at).toLocaleTimeString()}</div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </header>

        {/* 🔴 DYNAMIC CONTENT RENDERER */}
        {currentSection === 'dashboard' && viewMode === 'freelancer' && <FreelancerDash user={user} section="overview" />}
        {currentSection === 'dashboard' && viewMode === 'client' && <ClientDash user={user} section="explore" />}

        {/* Messages & Settings Placeholders (Future Features) */}
        {currentSection === 'messages' && (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px' }}>
            <h3>💌 Messages Center</h3>
            <p>Select an active order to start chatting.</p>
          </div>
        )}

        {currentSection === 'settings' && (
          <div style={{ padding: '30px', background: 'white', borderRadius: '12px' }}>
            <h3>⚙️ Settings</h3>
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input type="checkbox" defaultChecked /> Email Notifications
              </label>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input type="checkbox" defaultChecked /> Sound Alerts
              </label>
              <button className="btn-small outline" style={{ marginTop: '20px' }} onClick={() => alert("Settings Saved")}>Save Preferences</button>
            </div>
          </div>
        )}

        {/* Handle specific section clicks by passing props to Dashboards */}
        {currentSection === 'gigs' && <FreelancerDash user={user} section="gigs" />}
        {currentSection === 'work' && <FreelancerDash user={user} section="work" />}
        {currentSection === 'portfolio' && <FreelancerDash user={user} section="portfolio" />}
        {currentSection === 'skills' && <FreelancerDash user={user} section="quizzes" />}

        {currentSection === 'explore' && <ClientDash user={user} section="explore" />}
        {currentSection === 'jobs' && <ClientDash user={user} section="jobs" />}
        {currentSection === 'orders' && <ClientDash user={user} section="orders" />}

        {/* Admin Views */}
        {viewMode === 'admin' && <AdminDash user={user} section={currentSection === 'dashboard' ? 'analytics' : currentSection} />}

      </main>
    </div>
  );
};

export default Dashboard;