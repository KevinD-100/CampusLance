import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const PublicProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch public profile data
        fetch(`http://localhost:5000/api/profile/${id}`)
            .then(res => res.json())
            .then(data => {
                setProfile(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Profile...</div>;
    if (!profile) return <div style={{ padding: '50px', textAlign: 'center' }}>User not found.</div>;

    return (
        <div style={{ background: '#FAFCFE', minHeight: '100vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button onClick={() => navigate(-1)} className="btn-small outline" style={{ marginBottom: '20px' }}>← Back</button>

                <div style={{ background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>

                    <img
                        src={profile.profile_pic || `https://ui-avatars.com/api/?name=${profile.name}&background=random`}
                        alt={profile.name}
                        style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '5px solid #F7FAFC', marginBottom: '20px' }}
                    />

                    <h1 style={{ margin: '0 0 10px 0', color: '#2D3748' }}>{profile.name}</h1>
                    <p style={{ color: '#718096', marginBottom: '30px' }}>Freelancer on CampusLance</p>

                    <div style={{ textAlign: 'left', background: '#F8FAFC', padding: '30px', borderRadius: '15px' }}>
                        <h3 style={{ fontSize: '1.1rem', color: '#4A5568', marginBottom: '15px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>About Me</h3>
                        <p style={{ lineHeight: '1.8', color: '#4A5568', whiteSpace: 'pre-line' }}>
                            {profile.bio || "This user hasn't written a bio yet."}
                        </p>

                        {profile.skills && (
                            <div style={{ marginTop: '30px' }}>
                                <h4 style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '10px', textTransform: 'uppercase' }}>Skills</h4>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {profile.skills.split(',').map((skill, i) => (
                                        <span key={i} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', color: '#2D3748', fontWeight: '600' }}>
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                            <strong style={{ color: '#2D3748' }}>Contact:</strong> <span style={{ color: '#718096' }}>{profile.email}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
