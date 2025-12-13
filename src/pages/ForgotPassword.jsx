import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ height: 'auto', maxWidth: '500px' }}>
        
        {/* Only Form Side for this page, keeping it simple */}
        <div className="auth-form-container">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your email to receive instructions.</p>

          <form style={{ width: '100%' }}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="custom-input" placeholder="name@example.com" />
            </div>

            <button className="btn-dark">Send Reset Link</button>
          </form>

          <p className="auth-footer-text">
            <Link to="/login">← Back to Login</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;