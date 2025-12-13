import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    navigate('/register', { state: { role } });
  };

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="brand-logo">CAMPUSLANCE</div>
        <button onClick={() => navigate('/login')} className="nav-btn">Log In</button>
      </nav>

      <div className="landing-hero">
        <h1 className="hero-heading">
          Freelancing for <br />
          <span>Your Campus.</span>
        </h1>
        <p className="hero-sub">
          The verified marketplace to hire talent, build your portfolio, 
          and collaborate securely within the student community.
        </p>

        <div className="role-cards">
          {/* Client Card */}
          <div className="role-card" onClick={() => handleRoleSelect('client')}>
            <span className="role-icon">🔍</span>
            <h3>I want to Hire</h3>
            <p>Find students for design, coding, and creative projects.</p>
            <div className="arrow-icon">→</div>
          </div>

          {/* Freelancer Card */}
          <div className="role-card" onClick={() => handleRoleSelect('freelancer')}>
            <span className="role-icon">🚀</span>
            <h3>I want to Work</h3>
            <p>List your gigs, showcase your skills, and earn money.</p>
            <div className="arrow-icon">→</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;