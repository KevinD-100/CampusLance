import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
// 👇 Import the separate Chat Component
import ChatWindow from '../components/ChatWindow';

const ClientDash = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('explore'); 
  
  // Data State
  const [gigs, setGigs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // Filters
  const [orderFilter, setOrderFilter] = useState('active');

  // Chat State (Only needs to track WHICH order is open, not messages)
  const [chatOrder, setChatOrder] = useState(null);

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState(null);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [latestDelivery, setLatestDelivery] = useState(null);
  const [ratingData, setRatingData] = useState({ stars: 5, comment: '' });

  // Profile Modal State
  const [viewProfileId, setViewProfileId] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // 1. DATA FETCHING
  const refreshData = () => {
    if (user?.id) {
        setLoading(true);
        fetch('http://localhost:5000/api/gigs').then(res => res.json()).then(data => setGigs(data));
        fetch(`http://localhost:5000/api/requirements/client/${user.id}`).then(res => res.json()).then(data => setMyJobs(data));
        fetch(`http://localhost:5000/api/orders/client/${user.id}`).then(res => res.json()).then(data => { setOrders(data); setLoading(false); }).catch(err => console.error(err));
        fetch(`http://localhost:5000/api/favorites/${user.id}`).then(res => res.json()).then(ids => setFavorites(ids));
    }
  };

  useEffect(() => { refreshData(); }, [user?.id]); // Optimized dependency

  useEffect(() => {
    if (activeTab === 'orders') refreshData();
  }, [activeTab]);

  // Fetch Profile for Modal
  useEffect(() => {
    if (viewProfileId) {
        fetch(`http://localhost:5000/api/profile/${viewProfileId}`).then(res => res.json()).then(data => setProfileData(data));
    }
  }, [viewProfileId]);

  // --- ACTIONS ---
  const toggleFavorite = async (targetId) => {
    await fetch('http://localhost:5000/api/favorites', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ user_id: user.id, target_id: targetId, fav_type: 'freelancer' }) });
    refreshData();
  };

  const submitRating = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/ratings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...ratingData, order_id: ratingOrder.id, client_id: user.id, freelancer_id: ratingOrder.freelancer_id }) });
    alert("Rating Submitted!"); setRatingOrder(null);
  };
  
  const openReview = async (order) => {
    setReviewOrder(order);
    try {
        const res = await fetch(`http://localhost:5000/api/messages/${order.id}`);
        const msgs = await res.json();
        const deliveryMsg = [...msgs].reverse().find(m => m.text && m.text.includes("[FILE:"));
        if (deliveryMsg) {
            const match = deliveryMsg.text.match(/\[FILE: (.*?)\]/);
            setLatestDelivery(match ? match[1] : null);
        } else setLatestDelivery(null);
    } catch (err) { console.error(err); }
  };

  const submitReview = async (status) => {
    if (status === 'revision_requested' && !revisionNote.trim()) return alert("Enter feedback.");
    if (status === 'completed' && !window.confirm("Accept work?")) return;
    await fetch('http://localhost:5000/api/orders/review', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ order_id: reviewOrder.id, client_id: user.id, status, feedback: revisionNote }) });
    alert(status === 'completed' ? "Order Completed!" : "Revision Requested.");
    setReviewOrder(null); refreshData();
  };

  // Helper
  const getProgress = (status) => {
      switch(status) {
          case 'completed': return 'prog-100';
          case 'final_delivered': return 'prog-90';
          case 'revision_requested': return 'prog-90';
          case 'in_progress': return 'prog-50';
          default: return 'prog-10';
      }
  };

  // --- SECTIONS ---

  // 1. EXPLORE SECTION
  const ExploreSection = () => (
    <div className="animate-fade-in">
      <div className="filter-bar"><input type="text" placeholder="Search services..." className="search-input" /><button onClick={refreshData} className="btn-small outline">Refresh</button></div>
      <div className="gigs-grid">
        {gigs.map(gig => {
            const isFav = favorites.includes(gig.freelancer_id);
            return (
              <div key={gig.id} className="gig-card">
                <img src={gig.image_url || `https://via.placeholder.com/400`} alt={gig.title} className="gig-img" onError={(e)=>e.target.src="https://via.placeholder.com/400"}/>
                <div className="gig-info"><h4>{gig.title}</h4><div className="gig-meta"><span onClick={() => setViewProfileId(gig.freelancer_id)} style={{cursor:'pointer', textDecoration:'underline'}}>👤 {gig.freelancer_name}</span><span>⭐ 5.0</span></div><div className="gig-footer"><span className="gig-price">₹{gig.price}</span><button className="btn-small outline">View</button></div></div>
                <button className={`fav-btn ${isFav ? 'active' : ''}`} onClick={() => toggleFavorite(gig.freelancer_id)} style={{color: isFav ? '#E53E3E' : '#CBD5E0'}}>♥</button>
              </div>
            );
        })}
      </div>
    </div>
  );

  // 2. MY JOBS SECTION
  const JobPostsSection = () => {
    const [bidsMap, setBidsMap] = useState({});
    const hiredJobIds = orders.map(o => o.requirement_id);
    const fetchBids = (jobId) => fetch(`http://localhost:5000/api/bids/job/${jobId}`).then(res => res.json()).then(data => setBidsMap(p => ({ ...p, [jobId]: data })));
    const handleHire = (job, bid) => { if(confirm(`Hire ${bid.freelancer_name}?`)) fetch('http://localhost:5000/api/orders/hire', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ requirement_id: job.id, client_id: user.id, freelancer_id: bid.freelancer_id, bid_id: bid.id, price: bid.price }) }).then(res=>res.json()).then(d=>{alert(d.message); refreshData(); setActiveTab('orders');}); };
    useEffect(() => { myJobs.forEach(j => fetchBids(j.id)); }, [myJobs]);
    return (
        <div className="animate-fade-in">
            <div className="header-row"><h3 className="section-title">My Posted Jobs</h3><button className="create-btn-primary" onClick={() => navigate('/post-job')}>+ Post New</button></div>
            {myJobs.map(job => {
                const isHired = hiredJobIds.includes(job.id);
                return (
                <div key={job.id} className="job-card-expanded" style={{marginBottom:'25px', border: isHired ? '2px solid #48BB78' : '1px solid #E2E8F0', opacity: isHired ? 0.8 : 1}}>
                    <div className="job-header"><div><h4>{job.title}</h4>{isHired && <span className="badge active">✅ Hired / Closed</span>}</div><div className="budget-tag">{job.description.match(/\[Budget: (.*?)\]/)?.[1] || "Open"}</div></div>
                    {!isHired && (<div className="bids-section"><h5 style={{marginBottom:'10px', color:'#718096'}}>Proposals ({bidsMap[job.id]?.length || 0})</h5>{bidsMap[job.id]?.map(bid => (<div key={bid.id} className="bid-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#F8FAFC', padding:'15px', borderRadius:'10px', marginBottom:'10px'}}><div style={{display:'flex', gap:'15px', alignItems:'center'}}><img src={bid.profile_pic || "https://via.placeholder.com/50"} style={{width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', cursor:'pointer'}} onClick={() => setViewProfileId(bid.user_id)} /><div><div style={{fontWeight:'700', fontSize:'0.95rem', cursor:'pointer', textDecoration:'underline'}} onClick={() => setViewProfileId(bid.user_id)}>{bid.freelancer_name}</div><p style={{fontSize:'0.85rem', color:'#555', margin:'2px 0'}}>"{bid.message}"</p><small style={{color:'#718096'}}>{bid.delivery_days} Days Delivery</small></div></div><div style={{textAlign:'right'}}><div style={{fontSize:'1.1rem', fontWeight:'bold', color:'#2D3748', marginBottom:'5px'}}>₹{bid.price}</div><div style={{display:'flex', gap:'5px'}}><button className="btn-small outline" onClick={() => setViewProfileId(bid.user_id)}>Profile</button><button className="action-btn success" onClick={() => handleHire(job, bid)}>Hire</button></div></div></div>))}</div>)}
                </div>
            )})}
        </div>
    );
  };

  // 3. ORDERS SECTION
  const OrdersSection = () => {
    const displayedOrders = orders.filter(o => orderFilter === 'active' ? o.status !== 'completed' && o.status !== 'cancelled' : o.status === 'completed' || o.status === 'cancelled');
    return (
    <div className="animate-fade-in">
        <div className="header-row"><h3 className="section-title">My Orders</h3><div style={{display:'flex', gap:'10px'}}><select className="filter-select" onChange={(e)=>setOrderFilter(e.target.value)} value={orderFilter}><option value="active">Active</option><option value="completed">History</option></select><button className="btn-small outline" onClick={refreshData}>Refresh</button></div></div>
        {displayedOrders.length === 0 ? <p style={{textAlign:'center', padding:'30px', color:'#999'}}>No orders found.</p> : (
            <div className="gigs-grid">
                {displayedOrders.map(order => (
                    <div key={order.id} className="order-card-modern">
                        <div className="oc-header"><div><h4 className="oc-title">{order.job_title}</h4><div className="oc-freelancer" onClick={() => setViewProfileId(order.freelancer_id)} style={{cursor:'pointer'}}><img src={`https://ui-avatars.com/api/?name=${order.freelancer_name}&background=random`} alt="F" /><span>{order.freelancer_name}</span></div></div><div className="oc-price">₹{order.total_price}</div></div>
                        <div><div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', marginBottom:'5px', color:'#718096'}}><span>Status</span><span style={{fontWeight:'bold', textTransform:'uppercase'}}>{order.status.replace('_',' ')}</span></div><div className="oc-progress-container"><div className={`oc-progress-fill ${getProgress(order.status)}`}></div></div></div>
                        <div className="oc-footer">
                            <button className="action-btn outline" onClick={() => setChatOrder(order)}>💬 Chat</button>
                            {order.status === 'final_delivered' && <button className="action-btn success" onClick={() => openReview(order)}>🔍 Review</button>}
                            {order.status === 'completed' && <div style={{display:'flex', gap:'5px'}}><button className="btn-small outline" onClick={() => openReview(order)}>📂 Files</button><button className="btn-small" style={{background:'#F6E05E', color:'#333'}} onClick={() => setRatingOrder(order)}>⭐ Rate</button></div>}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
    );
  };

  return (
    <div className="dashboard-content">
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab==='explore'?'active':''}`} onClick={()=>setActiveTab('explore')}>🔍 Explore</button>
        <button className={`tab-btn ${activeTab==='jobs'?'active':''}`} onClick={()=>setActiveTab('jobs')}>📢 My Jobs</button>
        <button className={`tab-btn ${activeTab==='orders'?'active':''}`} onClick={()=>setActiveTab('orders')}>📦 Orders</button>
      </div>
      <div className="tab-content">
        {activeTab === 'explore' && <ExploreSection />}
        {activeTab === 'jobs' && <JobPostsSection />}
        {activeTab === 'orders' && <OrdersSection />}
      </div>

      {/* MODALS */}
      {viewProfileId && profileData && (
        <div className="modal-overlay" onClick={() => setViewProfileId(null)}>
            <div className="modal-card" style={{width:'400px', textAlign:'center'}} onClick={e => e.stopPropagation()}>
                <button onClick={() => setViewProfileId(null)} style={{position:'absolute', right:20, top:20, background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                <img src={profileData.profile_pic || "https://via.placeholder.com/100"} style={{width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover', marginBottom:'15px', border:'3px solid #E2E8F0'}} />
                <h3>{profileData.name}</h3><p style={{color:'#718096', marginBottom:'20px'}}>Freelancer</p>
                <div style={{textAlign:'left', background:'#F7FAFC', padding:'15px', borderRadius:'8px', marginBottom:'15px'}}><strong style={{display:'block', marginBottom:'5px', fontSize:'0.9rem'}}>About:</strong><p style={{fontSize:'0.85rem', color:'#4A5568'}}>{profileData.bio || "No bio available."}</p><div style={{marginTop:'15px', borderTop:'1px solid #eee', paddingTop:'10px'}}><strong style={{fontSize:'0.8rem', color:'#2D3748'}}>📧 Contact:</strong> <span style={{fontSize:'0.8rem'}}>{profileData.email}</span></div></div>
                <button className="btn-small outline" style={{width:'100%'}} onClick={() => setViewProfileId(null)}>Close</button>
            </div>
        </div>
      )}

      {ratingOrder && <div className="modal-overlay"><div className="modal-card"><h3>Rate Freelancer</h3><form onSubmit={submitRating}><div style={{marginBottom:'15px', fontSize:'2rem', cursor:'pointer'}}>{[1,2,3,4,5].map(s => (<span key={s} onClick={() => setRatingData({...ratingData, stars: s})} style={{color: s <= ratingData.stars ? '#F6E05E' : '#eee'}}>★</span>))}</div><textarea className="form-textarea" placeholder="Write a review..." onChange={e => setRatingData({...ratingData, comment: e.target.value})}></textarea><button className="submit-btn">Submit Review</button><button type="button" className="btn-small outline" style={{marginTop:'10px', width:'100%'}} onClick={() => setRatingOrder(null)}>Cancel</button></form></div></div>}

      {reviewOrder && <div className="modal-overlay"><div className="order-modal"><div className="order-header"><div><h3>Review</h3><span>By: {reviewOrder.freelancer_name}</span></div><button onClick={()=>setReviewOrder(null)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button></div><div style={{background:'#E6FFFA', padding:'20px', borderRadius:'12px', marginBottom:'20px', textAlign:'center', border:'1px solid #B2F5EA'}}>{latestDelivery ? <a href={latestDelivery} target="_blank" rel="noreferrer" className="action-btn success">Download File</a> : <p style={{color:'#E53E3E'}}>No file found.</p>}</div><textarea className="form-textarea" placeholder="Feedback if rejecting..." value={revisionNote} onChange={(e)=>setRevisionNote(e.target.value)}></textarea><div style={{display:'flex', gap:'10px', marginTop:10}}><button className="action-btn outline" onClick={() => submitReview('revision_requested')}>Request Revision</button><button className="action-btn success" onClick={() => submitReview('completed')}>Accept</button></div></div></div>}
      
      {/* 🔴 OPTIMIZED CHAT WINDOW (Replaces internal state logic) */}
      {chatOrder && (
        <ChatWindow 
            order={chatOrder} 
            currentUser={user} 
            onClose={() => setChatOrder(null)} 
        />
      )}
    </div>
  );
};

export default ClientDash;