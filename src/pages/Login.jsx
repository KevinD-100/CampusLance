import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import './Auth.css';
import commonAuthImage from '../assets/login-bg.png'; // Using the standard image variable

const authImage = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop";

const Login = () => {
  const navigate = useNavigate();
  
  // Form State
  const [formData, setFormData] = useState({ email: '', password: '' });
  
  // Errors State
  const [errors, setErrors] = useState({ email: '', password: '' });
  
  // Server Message State
  const [serverMsg, setServerMsg] = useState({ type: '', text: '' });

  // 🔴 VALIDATION LOGIC
  const validateField = (name, value) => {
    let errorMsg = '';
    
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) {
        errorMsg = "Email is required.";
      } else if (!emailRegex.test(value)) {
        errorMsg = "Please enter a valid email address.";
      }
    }
    
    if (name === 'password') {
      if (!value) errorMsg = "Password is required.";
    }

    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 1. Update Data
    setFormData({ ...formData, [name]: value });

    // 2. Real-time Validate
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    // Clear server error if user is typing
    if (serverMsg.type === 'error') setServerMsg({ type: '', text: '' });
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    
    // Check before submit
    const emailErr = validateField('email', formData.email);
    const passErr = validateField('password', formData.password);

    if (emailErr || passErr || !formData.email || !formData.password) {
      setErrors({ email: emailErr, password: passErr });
      return;
    }

    try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (res.ok) {
            setServerMsg({ type: 'success', text: "✅ Login Successful! Redirecting..." });
            localStorage.setItem('campusUser', JSON.stringify(data.user));
            // Slight delay so user sees the success message
            setTimeout(() => navigate('/dashboard'), 1000);
        } else {
            setServerMsg({ type: 'error', text: data.error || "Login Failed" });
        }
    } catch (error) {
        setServerMsg({ type: 'error', text: "Server connection failed. Is Backend running?" });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    try {
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: decoded.name, email: decoded.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setServerMsg({ type: 'success', text: "✅ Google Login Successful!" });
        localStorage.setItem('campusUser', JSON.stringify(data.user));
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setServerMsg({ type: 'error', text: data.error || "Google Login Failed" });
      }
    } catch (error) {
       setServerMsg({ type: 'error', text: "Network Error: Backend not reachable." });
    }
  };

  // Logic to disable button
  const isFormInvalid = !!errors.email || !!errors.password || !formData.email || !formData.password;

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        
        {/* LEFT: Image */}
        <div className="auth-visual">
          <img src={authImage} alt="CampusLance" className="auth-img" />
        </div>

        {/* RIGHT: Form */}
        <div className="auth-form-container">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Login to CampusLance</p>

          {/* Server Messages Area */}
          {serverMsg.text && (
            <div className={`message-box ${serverMsg.type}`}>
              {serverMsg.text}
            </div>
          )}

          <form style={{ width: '100%' }} onSubmit={handleManualLogin}>
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="text" 
                name="email"
                className={`custom-input ${errors.email ? 'invalid' : ''}`}
                placeholder="name@example.com"
                onChange={handleChange}
              />
              {/* Inline Error */}
              {errors.email && <span className="field-error-text">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password"
                className={`custom-input ${errors.password ? 'invalid' : ''}`}
                placeholder="••••••••"
                onChange={handleChange}
              />
              {errors.password && <span className="field-error-text">{errors.password}</span>}
            </div>

            <div style={{textAlign: 'right', marginBottom: '15px'}}>
              <Link to="/forgot-password" style={{color: '#2D3748', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none'}}>
                Forgot Password?
              </Link>
            </div>

            <button className="btn-dark" disabled={isFormInvalid}>Log In</button>
          </form>

          <div className="divider"><span>OR</span></div>

          <div className="social-login">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setServerMsg({type:'error', text:'Google Login Failed'})} 
              theme="outline" 
              size="large" 
              width="250" 
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