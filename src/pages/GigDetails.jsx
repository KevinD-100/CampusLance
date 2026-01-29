import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const GigDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('campusUser'));
    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:5000/api/gigs/single/${id}`)
            .then(res => res.json())
            .then(data => { setGig(data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });

        if (user) {
            fetch(`http://localhost:5000/api/favorites/${user.id}`)
                .then(res => res.json())
                .then(ids => setGig(prev => {
                    if (ids.includes(prev?.freelancer_id)) setIsFav(true);
                    return prev;
                }));
        }
    }, [id, user]);

    const handleOrder = async () => {
        if (!user || user.role !== 'client') return alert("Please login as a Client to place an order.");

        if (window.confirm(`Confirm order for ₹${gig.price}?`)) {
            try {
                // Determine deadline based on delivery_days
                const deadline = new Date();
                deadline.setDate(deadline.getDate() + parseInt(gig.delivery_days || 3));

                const response = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: user.id,
                        freelancer_id: gig.freelancer_id,
                        job_title: gig.title,
                        total_price: gig.price,
                        deadline: deadline.toISOString().split('T')[0]
                    })
                });

                if (response.ok) {
                    alert("🎉 Order Placed Successfully!");
                    navigate('/dashboard', { state: { section: 'orders' } });
                } else {
                    alert("Failed to place order. Please try again.");
                }
            } catch (err) { console.error(err); alert("Error processing order."); }
        }
    };

    const handleMessage = async () => {
        if (!user) return navigate('/login');
        try {
            const res = await fetch('http://localhost:5000/api/chat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: user.id, freelancer_id: gig.freelancer_id, gig_id: gig.id, gig_title: gig.title })
            });
            const data = await res.json();
            if (data.orderId) {
                navigate('/dashboard', { state: { section: 'messages' } }); // Ideally open chat automatically
            }
        } catch (err) { console.error(err); alert("Could not start chat."); }
    };

    const toggleFavorite = async () => {
        if (!user) return;
        await fetch('http://localhost:5000/api/favorites', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, target_id: gig.freelancer_id, fav_type: 'freelancer' })
        });
        setIsFav(!isFav);
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Gig Details...</div>;
    if (!gig) return <div style={{ padding: '50px', textAlign: 'center' }}>Gig not found.</div>;

    return (
        <div style={{ background: '#FAFAFA', minHeight: '100vh', paddingBottom: '50px' }}>
            {/* HERO BANNER - Modernized */}
            <div style={{ background: '#1A202C', color: 'white', padding: '40px 0 100px 0', position: 'relative' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

                    {/* TOP BAR */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <button onClick={() => navigate('/dashboard')} className="btn-small" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>← Back to Dashboard</button>

                        {/* FAVORITE BUTTON */}
                        <button onClick={toggleFavorite} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.2rem', color: isFav ? '#F56565' : 'white', transition: 'all 0.2s' }}>
                            {isFav ? '♥' : '♡'}
                        </button>
                    </div>

                    <h1 style={{ fontSize: '2.5rem', margin: '0 0 15px 0', maxWidth: '800px', fontWeight: '800' }}>{gig.title}</h1>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', opacity: 0.9, fontSize: '0.9rem' }}>
                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '20px' }}>📂 {gig.category || "General"}</span>
                        <span>⭐ {gig.skill_score ? (gig.skill_score / 20).toFixed(1) : "5.0"} (Verified Seller)</span>
                        <span>🕒 {gig.delivery_days} Days Delivery</span>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '-60px auto 0', padding: '0 20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', alignItems: 'start', position: 'relative', zIndex: 10 }}>

                {/* LEFT CONTENT */}
                <div>
                    {/* IMAGE CARD */}
                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                        <img
                            src={gig.image_url || "https://via.placeholder.com/800x400"}
                            alt={gig.title}
                            style={{ width: '100%', height: '450px', objectFit: 'cover' }}
                            onError={(e) => e.target.src = "https://via.placeholder.com/800x400"}
                        />
                    </div>

                    {/* DESCRIPTION */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#2D3748' }}>About This Gig</h3>
                        <p style={{ lineHeight: '1.8', color: '#4A5568', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
                            {gig.description}
                        </p>

                        {(gig.skills || gig.freelancer_skills) && (
                            <div style={{ marginTop: '30px' }}>
                                <h4 style={{ marginBottom: '15px', fontSize: '1rem', color: '#718096' }}>Skills & Expertise</h4>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {(gig.skills || gig.freelancer_skills || "").split(',').map((skill, i) => (
                                        <span key={i} style={{ background: '#EDF2F7', padding: '8px 15px', borderRadius: '20px', color: '#2D3748', fontSize: '0.9rem', fontWeight: '600' }}>{skill.trim()}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FREELANCER BIO - NOW POPULATED */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', display: 'flex', gap: '25px', alignItems: 'start' }}>
                        <img
                            src={gig.profile_pic || `https://ui-avatars.com/api/?name=${gig.freelancer_name}&background=random`}
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #E2E8F0' }}
                            onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${gig.freelancer_name}&background=random`}
                        />
                        <div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '5px', color: '#2D3748' }}>{gig.freelancer_name}</h3>
                            <p style={{ color: '#718096', fontSize: '0.9rem', margin: '0 0 15px 0' }}> Freelancer on CampusLance </p>
                            <p style={{ fontSize: '0.95rem', color: '#4A5568', lineHeight: '1.6' }}>
                                {gig.bio || "This freelancer has not added a bio yet, but they are verified and ready to work!"}
                            </p>
                            <button className="btn-small outline" style={{ marginTop: '15px' }} onClick={() => navigate(`/profile/${gig.freelancer_id}`)}>View Full Profile</button>
                        </div>
                    </div>
                </div>

                {/* RIGHT STICKY CARD */}
                <div style={{ position: 'sticky', top: '30px' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <strong style={{ fontSize: '1.1rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Standard Package</strong>
                            <span style={{ fontSize: '2rem', fontWeight: '800', color: '#2D3748' }}>₹{gig.price}</span>
                        </div>

                        <p style={{ color: '#4A5568', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.5' }}>
                            Complete professional service including all source files and revisions.
                        </p>

                        <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#4A5568', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🕒 <strong style={{ color: '#2D3748' }}>{gig.delivery_days} Days Delivery</strong></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🔄 <strong style={{ color: '#2D3748' }}>{gig.revisions || 1} Revisions Included</strong></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>✅ <strong style={{ color: '#2D3748' }}>Source Files Included</strong></div>
                        </div>

                        <button
                            onClick={handleOrder}
                            className="submit-btn"
                            style={{ width: '100%', padding: '15px', fontSize: '1.1rem', marginBottom: '15px', background: '#2D3748', color: 'white', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', border: 'none' }}
                        >
                            Continue (₹{gig.price})
                        </button>

                        <button
                            className="btn-small outline"
                            style={{ width: '100%', padding: '12px', color: '#4A5568', borderColor: '#CBD5E0' }}
                            onClick={handleMessage}
                        >
                            Message Seller
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px', color: '#A0AEC0', fontSize: '0.85rem' }}>
                        🔒 100% Secure Payment • Satisfaction Guaranteed
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GigDetails;
