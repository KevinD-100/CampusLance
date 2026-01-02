import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FreelancerDash from './FreelancerDash';
import ClientDash from './ClientDash';
import AdminDash from './AdminDash';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // 'viewMode' determines which Dashboard to show (Freelancer vs Client)
  // We set it to null initially to wait for data loading
  const [viewMode, setViewMode] = useState(null); 

  useEffect(() => {
    // 1. Get Real User Data from Local Storage
    const storedData = localStorage.getItem('campusUser');
    
    if (!storedData) {
      // Security: If no user found, force login
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(storedData);
      setUser(parsedUser);
      
      // 2. Set Default View based on Database Role
      // If viewMode isn't set yet, initialize it with their registered role
      if (!viewMode) {
        setViewMode(parsedUser.role || 'client');
      }
    }
  }, [navigate, viewMode]);

  const handleLogout = () => {
    localStorage.removeItem('campusUser');
    navigate('/login');
  };

  // 3. Toggle Logic: Switch between Buying and Selling views
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'freelancer' ? 'client' : 'freelancer');
  };

  // Prevent rendering until user data is ready
  if (!user || !viewMode) return null;

  return (
    <div className="dashboard-layout">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <div className="sidebar-logo">CAMPUSLANCE</div>
        
        {/* 👇 ROLE SWITCHING BUTTON */}
        {/* Only show this for standard users (Not Admins) */}
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
          
          {/* 👇 FREELANCER SPECIFIC LINKS */}
          {viewMode === 'freelancer' && (
            <>
              <div className="menu-item" onClick={() => navigate('/create-gig')}>+ Create Gig</div>
              <div className="menu-item">My Gigs</div>
              <div className="menu-item">Portfolio</div>
            </>
          )}

          {/* 👇 CLIENT SPECIFIC LINKS */}
          {viewMode === 'client' && (
            <>
              <div className="menu-item" onClick={() => navigate('/post-job')}>+ Post Requirement</div>
              <div className="menu-item">Explore Gigs</div>
              <div className="menu-item">My Orders</div>
            </>
          )}

          {/* 👇 ADMIN SPECIFIC LINKS */}
          {viewMode === 'admin' && (
            <>
              <div className="menu-item">User Management</div>
              <div className="menu-item">Disputes</div>
              <div className="menu-item">Platform Settings</div>
            </>
          )}

          <div className="menu-item">Settings</div>
        </div>

        <div className="sidebar-footer">
   <div className="user-mini" onClick={() => navigate('/profile')} style={{cursor: 'pointer'}}>
     {/* Logic to show profile pic if available, else placeholder */}
     <img 
        src={user.profile_pic || user.picture || "https://via.placeholder.com/30"} 
        alt="User" 
        onError={(e) => e.target.src = "https://via.placeholder.com/30"}
     />
     <div style={{display:'flex', flexDirection:'column'}}>
        <span>{user.name}</span>
        <small style={{fontSize:'0.7rem', color:'#718096'}}>Edit Profile</small>
     </div>
   </div>
   <button onClick={handleLogout} className="logout-link">Logout</button>
</div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="main-area">
        <header className="top-bar">
          <div>
            <h2 style={{textTransform: 'capitalize'}}>Welcome, {user.name.split(' ')[0]} 👋</h2>
            <p style={{color:'#718096', fontSize:'0.9rem', margin:'5px 0 0'}}>
              You are currently in <b>{viewMode === 'freelancer' ? 'Freelancer (Selling)' : viewMode === 'client' ? 'Client (Buying)' : 'Admin'}</b> mode.
            </p>
          </div>
          <button className="notif-btn">🔔</button>
        </header>

        {/* Render the correct Dashboard Component and pass the REAL User object */}
        {viewMode === 'freelancer' && <FreelancerDash user={user} />}
        {viewMode === 'client' && <ClientDash user={user} />}
        {viewMode === 'admin' && <AdminDash user={user} />}

      </main>
    </div>
  );
};

export default Dashboard;