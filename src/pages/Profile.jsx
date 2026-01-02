import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forms.css'; // Reusing your existing form styles

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('campusUser')));
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    skills: ''
  });
  const [preview, setPreview] = useState("https://via.placeholder.com/150");
  const [selectedFile, setSelectedFile] = useState(null);

  // Load Data
  useEffect(() => {
    if (user?.id) {
        fetch(`http://localhost:5000/api/profile/${user.id}`)
            .then(res => res.json())
            .then(data => {
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    bio: data.bio || '',
                    skills: data.skills || ''
                });
                if (data.profile_pic) setPreview(data.profile_pic);
            })
            .catch(err => console.error(err));
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('bio', formData.bio);
    data.append('skills', formData.skills);
    if (selectedFile) data.append('profilePic', selectedFile);

    try {
        const res = await fetch(`http://localhost:5000/api/profile/${user.id}`, {
            method: 'PUT',
            body: data
        });
        const result = await res.json();
        
        if (res.ok) {
            alert("✅ Profile Updated Successfully!");
            
            // Update LocalStorage to reflect new name/pic immediately in Sidebar
            const updatedUser = { ...user, name: formData.name };
            if (result.newPic) updatedUser.picture = result.newPic; // Assuming 'picture' key is used in Sidebar
            // Note: If your sidebar uses 'profile_pic', ensure naming consistency. 
            // Better to stick to the key used in Login: usually 'picture' for Google, or map it.
            
            // For now, let's just update name in storage
            localStorage.setItem('campusUser', JSON.stringify(updatedUser));
            navigate('/dashboard');
        } else {
            alert("Update Failed");
        }
    } catch (err) {
        console.error(err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file)); // Show preview instantly
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>
        
        <div className="form-header">
          <h2>Edit Profile</h2>
          <p>Update your personal details and portfolio info.</p>
        </div>

        <form onSubmit={handleUpdate}>
          {/* Profile Picture Section */}
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'20px'}}>
            <img 
                src={preview} 
                alt="Profile" 
                style={{width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover', border:'3px solid #E2E8F0', marginBottom:'10px'}}
            />
            <label className="btn-small outline" style={{cursor:'pointer'}}>
                Change Photo
                <input type="file" style={{display:'none'}} accept="image/*" onChange={handleImageChange} />
            </label>
          </div>

          <div className="form-section">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>

          <div className="form-section">
            <label className="form-label">Email (Read Only)</label>
            <input type="email" className="form-input" value={formData.email} disabled style={{background:'#F7FAFC', color:'#A0AEC0'}} />
          </div>

          <div className="form-section">
            <label className="form-label">Bio / About Me</label>
            <textarea className="form-textarea" placeholder="Tell us about yourself..." value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}></textarea>
          </div>

          <div className="form-section">
            <label className="form-label">Skills (Comma separated)</label>
            <input type="text" className="form-input" placeholder="e.g. React, Photoshop, Python" value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})} />
          </div>

          <button type="submit" className="submit-btn">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;