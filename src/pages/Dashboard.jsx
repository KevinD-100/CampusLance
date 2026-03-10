import API_URL from '../config';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FreelancerDash from './FreelancerDash';
import ClientDash from './ClientDash';
import AdminDash from './AdminDash';
import ChatWindow from '../components/ChatWindow'; // Import ChatWindow
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get navigation state
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState(null);

  // State for Chat
  const [activeChatOrder, setActiveChatOrder] = useState(null);

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
      if (!viewMode) {
        const savedMode = localStorage.getItem('dashboardViewMode');
        setViewMode(savedMode || parsedUser.role || 'client');
      }

      // Fetch Notifications
      fetch(`${API_URL}/api/notifications/${parsedUser.id}`)
        .then(res => res.json())
        .then(data => setNotifications(data));

      // 🔴 CHECK FOR CHAT INTENT
      if (location.state?.section === 'messages' && location.state?.orderId) {
        setCurrentSection('messages');
        fetch(`${API_URL}/api/orders/single/${location.state.orderId}`)
          .then(res => res.json())
          .then(orderData => setActiveChatOrder(orderData))
          .catch(err => console.error("Failed to load chat order", err));

        // Clear state so it doesn't reopen on refresh
        window.history.replaceState({}, document.title);
      } else if (location.state?.section) {
        setCurrentSection(location.state.section);
      }
    }
  }, [navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem('campusUser');
    localStorage.removeItem('dashboardViewMode'); // Clear preference on logout
    navigate('/login');
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'freelancer' ? 'client' : 'freelancer';
    setViewMode(newMode);
    localStorage.setItem('dashboardViewMode', newMode); // Persist change
    setCurrentSection('dashboard');
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
      fetch(`${API_URL}/api/notifications/read/all/${user.id}`, { method: 'PUT' });
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
                      <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '2px' }}>
                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
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
        {/* Messages & Settings */}
        {currentSection === 'messages' && (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px' }}>
            <h3>💌 Messages Center</h3>
            <p>Select an active order in "My Orders" to start chatting.</p>
            {activeChatOrder && <p style={{ color: 'green' }}>Opening chat...</p>}
          </div>
        )}

        {currentSection === 'settings' && (
          <div className="animate-fade-in" style={{ padding: '30px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 5px 0', color: '#2D3748', borderBottom: '2px solid #EDF2F7', paddingBottom: '15px' }}>⚙️ Personal Settings</h2>
            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '30px' }}>Manage your preferences and notification settings.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {/* Profile Details */}
              <div style={{ padding: '20px', background: '#F7FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#4A5568', display: 'flex', alignItems: 'center', gap: '8px' }}>👤 Account Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#A0AEC0', marginBottom: '5px' }}>Full Name</label>
                    <input className="form-input" disabled value={user?.name || ''} style={{ background: '#EDF2F7', color: '#718096', cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#A0AEC0', marginBottom: '5px' }}>Email Address</label>
                    <input className="form-input" disabled value={user?.email || ''} style={{ background: '#EDF2F7', color: '#718096', cursor: 'not-allowed' }} />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#4A5568', display: 'flex', alignItems: 'center', gap: '8px' }}>🔔 Notifications</h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #EDF2F7' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#2D3748' }}>Email Notifications</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>Receive emails about order updates and messages.</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#2D3748' }}>Push Alerts</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>Enable browser alerts for real-time updates.</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{ padding: '20px', background: '#FFF5F5', borderRadius: '12px', border: '1px dashed #FEB2B2' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#C53030' }}>Danger Zone</h4>
                <p style={{ fontSize: '0.85rem', color: '#742A2A', marginBottom: '15px' }}>Request account deletion. This action cannot be undone and will erase all data.</p>
                <button className="btn-small" style={{ background: 'transparent', color: '#E53E3E', border: '1px solid #E53E3E' }} onClick={async () => {
                  if (window.confirm("🚨 WARNING: Are you strictly sure you want to permanently delete your account? All gigs, orders, and history will be lost. This CANNOT be undone.")) {
                    try {
                      const res = await fetch(`${API_URL}/api/users/${user.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        alert("Account successfully deleted. We're sorry to see you go.");
                        handleLogout();
                      } else {
                        alert("Error deleting account.");
                      }
                    } catch (err) { console.error(err); alert("Network error."); }
                  }
                }}>Permanently Delete Account</button>
              </div>

            </div>

            <div style={{ marginTop: '30px', textAlign: 'right', borderTop: '2px solid #EDF2F7', paddingTop: '20px' }}>
              <button className="create-btn-primary" style={{ padding: '12px 30px', fontSize: '1rem', borderRadius: '8px' }} onClick={() => alert("Settings preferences saved.")}>Save Preferences</button>
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

      {/* GLOBAL CHAT OVERLAY */}
      {activeChatOrder && (
        <ChatWindow
          order={activeChatOrder}
          currentUser={user}
          onClose={() => setActiveChatOrder(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;