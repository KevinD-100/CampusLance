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
  
  // 🔴 NOTIFICATION STATE (Moved here)
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

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
  };

  // 🔴 INTELLIGENT NOTIFICATION FILTERING
  const filteredNotifs = notifications.filter(n => {
      // Freelancer sees: Hired alerts, Reviews, Messages
      if (viewMode === 'freelancer') return ['order', 'review', 'message'].includes(n.type);
      // Client sees: Bid alerts, Delivery alerts, Messages
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
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">CAMPUSLANCE</div>
        {user.role !== 'admin' && (
          <div className="switch-container">
            <button className="switch-btn" onClick={toggleViewMode}>
              {viewMode === 'freelancer' ? '⇄ Switch to Buying' : '⇄ Switch to Selling'}
            </button>
          </div>
        )}
        <div className="menu-group">
          <p className="menu-label">MENU ({viewMode.toUpperCase()})</p>
          <div className="menu-item active">Dashboard</div>
          <div className="menu-item">Messages</div>
          {viewMode === 'freelancer' && <><div className="menu-item" onClick={() => navigate('/create-gig')}>+ Create Gig</div><div className="menu-item">My Gigs</div><div className="menu-item">Portfolio</div></>}
          {viewMode === 'client' && <><div className="menu-item" onClick={() => navigate('/post-job')}>+ Post Requirement</div><div className="menu-item">Explore Gigs</div><div className="menu-item">My Orders</div></>}
          {viewMode === 'admin' && <><div className="menu-item">User Management</div><div className="menu-item">Disputes</div></>}
          <div className="menu-item">Settings</div>
        </div>
        <div className="sidebar-footer">
           <div className="user-mini" onClick={() => navigate('/profile')} style={{cursor: 'pointer'}}>
             <img src={user.profile_pic || user.picture || "https://via.placeholder.com/30"} alt="User" onError={(e) => e.target.src = "https://via.placeholder.com/30"} />
             <div style={{display:'flex', flexDirection:'column'}}><span>{user.name}</span><small style={{fontSize:'0.7rem', color:'#718096'}}>Edit Profile</small></div>
           </div>
           <button onClick={handleLogout} className="logout-link">Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-area">
        <header className="top-bar">
          <div>
            <h2 style={{textTransform: 'capitalize'}}>Welcome, {user.name.split(' ')[0]} 👋</h2>
            <p style={{color:'#718096', fontSize:'0.9rem', margin:'5px 0 0'}}>
              You are currently in <b>{viewMode === 'freelancer' ? 'Freelancer (Selling)' : viewMode === 'client' ? 'Client (Buying)' : 'Admin'}</b> mode.
            </p>
          </div>
          
          {/* 🔴 SINGLE BELL ICON HERE */}
          <div style={{position:'relative'}}>
            <button className="notif-btn" onClick={handleOpenNotifications}>
                🔔 {unreadCount > 0 && <span className="badge dispute" style={{position:'absolute', top:-5, right:-5, padding:0, width:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem'}}>{unreadCount}</span>}
            </button>
            {showNotifDropdown && (
                <div className="notif-dropdown" style={{position:'absolute', right:0, top:50, width:300, background:'white', boxShadow:'0 5px 15px rgba(0,0,0,0.1)', padding:10, borderRadius:10, zIndex:200, maxHeight:'300px', overflowY:'auto', border:'1px solid #E2E8F0'}}>
                    <h5 style={{margin:'0 0 10px 0', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>Notifications</h5>
                    {filteredNotifs.length === 0 ? <p style={{fontSize:'0.8rem', color:'#888', padding:'20px', textAlign:'center'}}>No new alerts.</p> : 
                        filteredNotifs.map(n => (
                            <div key={n.id} style={{padding:'12px', borderBottom:'1px solid #eee', fontSize:'0.85rem', opacity: n.is_read ? 0.5 : 1, background: n.is_read ? 'white' : '#F0FFF4'}}>
                                {JSON.parse(n.payload).message}
                                <div style={{fontSize:'0.7rem', color:'#aaa', marginTop:'2px'}}>{new Date(n.created_at).toLocaleTimeString()}</div>
                            </div>
                        ))
                    }
                </div>
            )}
          </div>
        </header>

        {/* Render Child Pages */}
        {viewMode === 'freelancer' && <FreelancerDash user={user} />}
        {viewMode === 'client' && <ClientDash user={user} />}
        {viewMode === 'admin' && <AdminDash user={user} />}

      </main>
    </div>
  );
};

export default Dashboard;