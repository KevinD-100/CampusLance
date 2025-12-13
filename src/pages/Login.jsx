import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import './Auth.css';
import commonAuthImage from '../assets/login-bg2.png'; // Ensure this file exists
const authImage = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop"; 
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    localStorage.setItem('campusUser', JSON.stringify(decoded));
    navigate('/dashboard');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        
        {/* LEFT: Image fits perfectly due to object-fit: cover in CSS */}
        <div className="auth-visual">
          <img src={authImage} alt="CampusLance" className="auth-img" />
        </div>

        {/* RIGHT: Form */}
        <div className="auth-form-container">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Login to CampusLance</p>

          <form style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="custom-input" 
                placeholder="name@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                className="custom-input" 
                placeholder="••••••••"
              />
            </div>

            <button className="btn-dark">Log In</button>
          </form>

          <div className="divider"><span>OR</span></div>

          {/* GOOGLE LOGIN - Using standard look to ensure visibility */}
          <div className="social-login">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Login Failed')}
              theme="outline"
              size="large"
              width="250" /* Forces a width */
              text="signin_with"
              shape="pill"
            />
          </div>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;