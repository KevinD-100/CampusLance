import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import './Auth.css';

// Importing the shared image
import commonAuthImage from '../assets/login-bg.png';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'freelancer';

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log(`Registering as ${role}`, decoded);
    localStorage.setItem('campusUser', JSON.stringify(decoded));
    navigate('/dashboard');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        
        {/* LEFT SIDE: IMAGE */}
        <div className="auth-visual">
          <img 
            src={commonAuthImage} 
            alt="CampusLance" 
            className="auth-img" 
          />
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="auth-form-container">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">
            Signing up as: <strong>{role === 'client' ? 'Client' : 'Freelancer'}</strong>
          </p>

          <form style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="custom-input" placeholder="Your Name" />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="custom-input" placeholder="name@example.com" />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" className="custom-input" placeholder="Create Password" />
            </div>

            <button className="btn-dark">Sign Up</button>
          </form>

          <div className="divider"><span>or </span></div>

          {/* 👇 FIXED GOOGLE BUTTON SECTION */}
          <div className="social-login">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Signup Failed')}
              theme="outline"      /* Makes it visible with a border */
              size="large"         /* Standard size */
              text="signup_with"   /* Says "Sign up with Google" */
              shape="pill"         /* Rounded edges */
              width="250"          /* Forces specific width so it doesn't hide */
            />
          </div>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;