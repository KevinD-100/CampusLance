import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Auth.css';
import commonAuthImage from '../assets/login-bg2.png'; // Or your image URL

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email'); // Reads ?email=... from the link

  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirmPass) {
        setMsg("❌ Passwords do not match");
        return;
    }

    try {
        const res = await fetch('http://localhost:5000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword: password }),
        });

        if (res.ok) {
            alert("✅ Password Updated! Please Login.");
            navigate('/login');
        } else {
            setMsg("❌ Failed to update password");
        }
    } catch (err) {
        console.error(err);
        setMsg("❌ Server Error");
    }
  };

  if (!email) return <div className="auth-wrapper"><h2>❌ Invalid or Broken Link</h2></div>;

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{height: '550px'}}>
        <div className="auth-visual">
          <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop" alt="Reset" className="auth-img" />
        </div>
        <div className="auth-form-container">
          <h2 className="auth-title">Set New Password</h2>
          <p className="auth-subtitle">For: {email}</p>
          
          {msg && <div style={{color: 'red', marginBottom: '10px'}}>{msg}</div>}

          <form style={{ width: '100%' }} onSubmit={handleUpdate}>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" className="custom-input" onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" className="custom-input" onChange={(e) => setConfirmPass(e.target.value)} required />
            </div>
            <button className="btn-dark">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;