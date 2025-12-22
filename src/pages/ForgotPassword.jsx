import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

// Using the same image for consistency
const authImage = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    if (!email) {
        setStatus({ type: 'error', msg: 'Please enter your email address.' });
        setLoading(false);
        return;
    }

    try {
      // 👇 SEND REQUEST TO YOUR NODE.JS BACKEND
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', msg: '✅ Reset link sent! Check your email (and server console).' });
      } else {
        setStatus({ type: 'error', msg: `❌ ${data.error || 'Failed to send link'}` });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: '❌ Cannot connect to server.' });
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{height: '500px'}}> 
        
        <div className="auth-visual">
          <img src={authImage} alt="Forgot Password" className="auth-img" />
        </div>

        <div className="auth-form-container">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">
            Enter your email address and we'll send you a link to get back into your account.
          </p>

          {/* Status Messages */}
          {status.msg && (
            <div style={{
              color: status.type === 'success' ? '#38A169' : '#E53E3E',
              fontWeight: 'bold',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {status.msg}
            </div>
          )}

          <form style={{ width: '100%' }} onSubmit={handleReset}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="custom-input" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button className="btn-dark" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="auth-footer-text">
            Remembered it? <Link to="/login">Back to Login</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;