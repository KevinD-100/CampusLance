import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FreelancerDash from './FreelancerDash';
import ClientDash from './ClientDash';
import AdminDash from './AdminDash';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Default role. In real app, get this from database user.role
  const [currentRole, setCurrentRole] = useState('freelancer');

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem('campusUser'));
    if (!loggedUser) navigate('/login');
    setUser(loggedUser);
  }, [navigate]);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">CAMPUSLANCE</div>
        
        <div className="menu-group">
          <p className="menu-label">MENU</p>
          <div className="menu-item active">Overview</div>
          <div className="menu-item">Messages <span className="msg-badge">2</span></div>
          <div className="menu-item">Settings</div>
        </div>

        <div className="menu-group">
          <p className="menu-label">VIEW MODE (DEMO)</p>
          <button className={`role-select ${currentRole === 'freelancer' ? 'active' : ''}`} onClick={() => setCurrentRole('freelancer')}>Freelancer</button>
          <button className={`role-select ${currentRole === 'client' ? 'active' : ''}`} onClick={() => setCurrentRole('client')}>Client</button>
          <button className={`role-select ${currentRole === 'admin' ? 'active' : ''}`} onClick={() => setCurrentRole('admin')}>Admin</button>
        </div>

        <div className="sidebar-footer">
           <div className="user-mini">
             <img src={user?.picture || "https://via.placeholder.com/30"} alt="User" />
             <span>{user?.name || "User"}</span>
           </div>
           <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-link">Logout</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        <header className="top-bar">
          <h2>{currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Dashboard</h2>
          <button className="notif-btn">🔔</button>
        </header>

        {/* Render the specific dashboard based on role */}
        {currentRole === 'freelancer' && <FreelancerDash user={user} />}
        {currentRole === 'client' && <ClientDash user={user} />}
        {currentRole === 'admin' && <AdminDash user={user} />}
      </main>
    </div>
  );
};

export default Dashboard;