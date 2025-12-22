import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import './Auth.css';
import commonAuthImage from '../assets/login-bg.png';

const authImage = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'freelancer';

  // State for form values
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  
  // 👇 State for Real-Time Field Errors
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });
  
  // 👇 State for Server Success/Failure Messages
  const [serverMsg, setServerMsg] = useState({ type: '', text: '' });

  // 🔴 VALIDATION LOGIC
  const validateField = (name, value) => {
    let errorMsg = '';

    switch (name) {
      case 'name':
        // Rule: Only letters and spaces allowed
        if (!/^[a-zA-Z\s]*$/.test(value)) {
          errorMsg = "Name must contain only letters.";
        } else if (value.trim().length > 0 && value.trim().length < 3) {
          errorMsg = "Name must be at least 3 characters.";
        }
        break;

      case 'email':
        // Rule: Valid Email Format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errorMsg = "Please enter a valid email address.";
        }
        break;

      case 'password':
        // Rule: 6+ chars, 1 Uppercase, 1 Lowercase, 1 Number
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNum = /[0-9]/.test(value);
        const isLongEnough = value.length >= 6;

        if (value && (!hasUpper || !hasLower || !hasNum || !isLongEnough)) {
          errorMsg = "Password must be 6+ chars with 1 Uppercase, 1 Lowercase & 1 Number.";
        }
        break;

      default:
        break;
    }
    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 1. Update Form Data
    setFormData({ ...formData, [name]: value });

    // 2. Validate Immediately
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    // Clear global server error when user tries to fix inputs
    if (serverMsg.type === 'error') setServerMsg({ type: '', text: '' });
  };

  const handleManualRegister = async (e) => {
    e.preventDefault();
    
    // Double check all fields before sending
    const nameErr = validateField('name', formData.name);
    const emailErr = validateField('email', formData.email);
    const passErr = validateField('password', formData.password);

    if (nameErr || emailErr || passErr || !formData.name || !formData.email || !formData.password) {
      setErrors({ name: nameErr, email: emailErr, password: passErr });
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: role }),
      });

      const data = await res.json();

      if (res.ok) {
        setServerMsg({ type: 'success', text: "✅ Account created! Redirecting..." });
        localStorage.setItem('campusUser', JSON.stringify(data.user));
        
        // Wait 1.5s then redirect
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setServerMsg({ type: 'error', text: data.error || "Registration failed." });
      }
    } catch (error) {
      setServerMsg({ type: 'error', text: "Cannot connect to server. Is Backend running?" });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    try {
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: decoded.name,
            email: decoded.email,
            role: role 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setServerMsg({ type: 'success', text: "✅ Google Sign-in successful!" });
        localStorage.setItem('campusUser', JSON.stringify(data.user));
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setServerMsg({ type: 'error', text: data.error || "Google Signup Failed" });
      }
    } catch (error) {
       setServerMsg({ type: 'error', text: "Network Error: Backend not reachable." });
    }
  };

  // Logic to disable button: If any error exists OR fields are empty
  const isFormInvalid = 
    !!errors.name || !!errors.email || !!errors.password || 
    !formData.name || !formData.email || !formData.password;

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-visual">
          <img src={authImage} alt="CampusLance" className="auth-img" />
        </div>

        <div className="auth-form-container">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">
            Signing up as: <strong>{role === 'client' ? 'Client' : 'Freelancer'}</strong>
          </p>

          {/* Top Server Messages (Success/Network Fail) */}
          {serverMsg.text && (
            <div className={`message-box ${serverMsg.type}`}>
              {serverMsg.text}
            </div>
          )}

          <form style={{ width: '100%' }} onSubmit={handleManualRegister}>
            
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="name" 
                className={`custom-input ${errors.name ? 'invalid' : ''}`}
                placeholder="Your Name" 
                onChange={handleChange} 
              />
              {/* 👇 INLINE ERROR TEXT */}
              {errors.name && <span className="field-error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="text" 
                name="email" 
                className={`custom-input ${errors.email ? 'invalid' : ''}`}
                placeholder="name@example.com" 
                onChange={handleChange} 
              />
              {errors.email && <span className="field-error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                className={`custom-input ${errors.password ? 'invalid' : ''}`}
                placeholder="Create Password" 
                onChange={handleChange} 
              />
              {errors.password && <span className="field-error-text">{errors.password}</span>}
            </div>

            {/* Button disabled until form is valid */}
            <button className="btn-dark" disabled={isFormInvalid}>Sign Up</button>
          </form>

          <div className="divider"><span>or </span></div>

          <div className="social-login">
            <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => setServerMsg({type:'error', text:'Google Signup Failed'})} 
                theme="outline" 
                size="large" 
                text="signup_with" 
                shape="pill" 
                width="250" 
            />
          </div>

          <p className="auth-footer-text">Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;