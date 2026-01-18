import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const ClientDash = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('explore'); 
  
  // Data State
  const [gigs, setGigs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chat State
  const [chatOrder, setChatOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatInterval = useRef(null);
  const chatBodyRef = useRef(null);

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [latestDelivery, setLatestDelivery] = useState(null);

  // Profile Modal State
  const [viewProfileId, setViewProfileId] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // 1. DATA FETCHING
  const refreshData = () => {
    if (user?.id) {
        setLoading(true);
        fetch('http://localhost:5000/api/gigs').then(res => res.json()).then(data => setGigs(data));
        fetch(`http://localhost:5000/api/requirements/client/${user.id}`).then(res => res.json()).then(data => setMyJobs(data));
        fetch(`http://localhost:5000/api/orders/client/${user.id}`)
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }
  };

  useEffect(() => { refreshData(); }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') refreshData();
  }, [activeTab]);

  // Fetch Profile for Modal
  useEffect(() => {
    if (viewProfileId) {
        fetch(`http://localhost:5000/api/profile/${viewProfileId}`)
            .then(res => res.json())
            .then(data => setProfileData(data));
    }
  }, [viewProfileId]);

  // --- ACTIONS ---
  
  const openReview = async (order) => {
    setReviewOrder(order);
    try {
        const res = await fetch(`http://localhost:5000/api/messages/${order.id}`);
        const msgs = await res.json();
        const deliveryMsg = [...msgs].reverse().find(m => m.text && m.text.includes("[FILE:"));
        
        if (deliveryMsg) {
            const match = deliveryMsg.text.match(/\[FILE: (.*?)\]/);
            if (match && match[1]) setLatestDelivery(match[1]);
            else setLatestDelivery(null);
        } else {
            setLatestDelivery(null);
        }
    } catch (err) {
        console.error("Error finding file:", err);
    }
  };

  const submitReview = async (status) => {
    if (status === 'revision_requested' && !revisionNote.trim()) return alert("Please enter feedback.");
    if (status === 'completed' && !window.confirm("Accept work and complete order?")) return;

    await fetch('http://localhost:5000/api/orders/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: reviewOrder.id, client_id: user.id, status, feedback: revisionNote })
    });

    alert(status === 'completed' ? "Order Completed!" : "Revision Requested.");
    setReviewOrder(null);
    refreshData();
  };

  // Chat Logic
  const openChat = (order) => { setChatOrder(order); setMessages([]); fetchMessages(order.id); if(chatInterval.current) clearInterval(chatInterval.current); chatInterval.current = setInterval(() => fetchMessages(order.id), 2000); };
  const closeChat = () => { setChatOrder(null); if(chatInterval.current) clearInterval(chatInterval.current); };
  const fetchMessages = (id) => fetch(`http://localhost:5000/api/messages/${id}`).then(res=>res.json()).then(d=>{if(Array.isArray(d)){setMessages(d); if(chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;}});
  const sendMessage = async (e) => { e.preventDefault(); if(!newMessage.trim()) return; await fetch('http://localhost:5000/api/messages', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ order_id: chatOrder.id, sender_id: user.id, text: newMessage }) }); setNewMessage(""); fetchMessages(chatOrder.id); };

  // --- SECTIONS ---

  const ExploreSection = () => (
    <div className="animate-fade-in">
      <div className="filter-bar"><input type="text" placeholder="Search..." className="search-input" /><button onClick={refreshData} className="btn-small outline">Refresh</button></div>
      <div className="gigs-grid">
        {gigs.map(gig => (
          <div key={gig.id} className="gig-card">
            <img src={gig.image_url || `https://via.placeholder.com/400`} alt={gig.title} className="gig-img" onError={(e)=>e.target.src="https://via.placeholder.com/400"}/>
            <div className="gig-info"><h4>{gig.title}</h4><div className="gig-meta"><span>👤 {gig.freelancer_name}</span><span>⭐ 5.0</span></div><div className="gig-footer"><span className="gig-price">₹{gig.price}</span><button className="btn-small outline">View</button></div></div>
          </div>
        ))}
      </div>
    </div>
  );

  const JobPostsSection = () => {
    const [bidsMap, setBidsMap] = useState({});
    const hiredJobIds = orders.map(o => o.requirement_id);
    const fetchBids = (jobId) => fetch(`http://localhost:5000/api/bids/job/${jobId}`).then(res => res.json()).then(data => setBidsMap(p => ({ ...p, [jobId]: data })));
    
    const handleHire = (job, bid) => {
        if(!window.confirm(`Hire ${bid.freelancer_name}?`)) return;
        fetch('http://localhost:5000/api/orders/hire', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ requirement_id: job.id, client_id: user.id, freelancer_id: bid.freelancer_id, bid_id: bid.id, price: bid.price }) })
        .then(res=>res.json())
        .then(d=>{alert(d.message); refreshData(); setActiveTab('orders');});
    };
    useEffect(() => { myJobs.forEach(j => fetchBids(j.id)); }, [myJobs]);
    
    return (
        <div className="animate-fade-in">
            <div className="header-row"><h3 className="section-title">My Jobs</h3><button className="create-btn-primary" onClick={() => navigate('/post-job')}>+ Post</button></div>
            {myJobs.map(job => {
                const isHired = hiredJobIds.includes(job.id);
                return (
                <div key={job.id} className="job-card-expanded" style={{marginBottom:'25px', border: isHired ? '2px solid #48BB78' : '1px solid #E2E8F0', opacity: isHired ? 0.8 : 1}}>
                    <div className="job-header">
                        <div><h4>{job.title}</h4>{isHired && <span className="badge active">✅ Hired / Closed</span>}</div>
                        <div className="budget-tag">{job.description.match(/\[Budget: (.*?)\]/)?.[1] || "Open"}</div>
                    </div>

                    {!isHired && (
                        <div className="bids-section">
                            <h5 style={{marginBottom:'10px', color:'#718096'}}>Proposals ({bidsMap[job.id]?.length || 0})</h5>
                            {bidsMap[job.id]?.map(bid => (
                                <div key={bid.id} className="bid-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#F8FAFC', padding:'15px', borderRadius:'10px', marginBottom:'10px'}}>
                                    <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                        <img src={bid.profile_pic || "https://via.placeholder.com/50"} style={{width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', cursor:'pointer'}} onClick={() => setViewProfileId(bid.user_id)} />
                                        <div>
                                            <div style={{fontWeight:'700', fontSize:'0.95rem', cursor:'pointer', textDecoration:'underline'}} onClick={() => setViewProfileId(bid.user_id)}>{bid.freelancer_name}</div>
                                            <p style={{fontSize:'0.85rem', color:'#555', margin:'2px 0'}}>"{bid.message}"</p>
                                            <small style={{color:'#718096'}}>{bid.delivery_days} Days Delivery</small>
                                        </div>
                                    </div>
                                    <div style={{textAlign:'right'}}>
                                        <div style={{fontSize:'1.1rem', fontWeight:'bold', color:'#2D3748', marginBottom:'5px'}}>₹{bid.price}</div>
                                        <div style={{display:'flex', gap:'5px'}}>
                                            <button className="btn-small outline" onClick={() => setViewProfileId(bid.user_id)}>Profile</button>
                                            <button className="action-btn success" onClick={() => handleHire(job, bid)}>Hire</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )})}
        </div>
    );
  };

  const OrdersSection = () => (
    <div className="animate-fade-in">
        <div className="header-row"><h3 className="section-title">Active Orders</h3><button className="btn-small outline" onClick={refreshData}>Refresh Status</button></div>
        <table className="data-table"><thead><tr><th>Freelancer</th><th>Job</th><th>Status</th><th>Action</th></tr></thead><tbody>{orders.map(order => (<tr key={order.id}><td>{order.freelancer_name}</td><td>{order.job_title}</td><td><span className={`badge ${order.status === 'final_delivered' ? 'delivered' : order.status === 'revision_requested' ? 'dispute' : 'active'}`}>{order.status}</span></td><td><button className="action-btn outline" onClick={() => openChat(order)}>Chat</button>{order.status === 'final_delivered' && <button className="action-btn success" style={{marginLeft:'10px'}} onClick={() => openReview(order)}>Review</button>}</td></tr>))}</tbody></table>
    </div>
  );

  return (
    <div className="dashboard-content">
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab==='explore'?'active':''}`} onClick={()=>setActiveTab('explore')}>Explore</button>
        <button className={`tab-btn ${activeTab==='jobs'?'active':''}`} onClick={()=>setActiveTab('jobs')}>My Jobs</button>
        <button className={`tab-btn ${activeTab==='orders'?'active':''}`} onClick={()=>setActiveTab('orders')}>Orders</button>
      </div>

      <div className="tab-content">
        {activeTab === 'explore' && <ExploreSection />}
        {activeTab === 'jobs' && <JobPostsSection />}
        {activeTab === 'orders' && <OrdersSection />}
      </div>

      {/* FREELANCER PROFILE MODAL */}
      {viewProfileId && profileData && (
        <div className="modal-overlay" onClick={() => setViewProfileId(null)}>
            <div className="modal-card" style={{width:'400px', textAlign:'center'}} onClick={e => e.stopPropagation()}>
                <button onClick={() => setViewProfileId(null)} style={{position:'absolute', right:20, top:20, background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                <img src={profileData.profile_pic || "https://via.placeholder.com/100"} style={{width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover', marginBottom:'15px', border:'3px solid #E2E8F0'}} />
                <h3>{profileData.name}</h3><p style={{color:'#718096', marginBottom:'20px'}}>Freelancer</p>
                <div style={{textAlign:'left', background:'#F7FAFC', padding:'15px', borderRadius:'8px', marginBottom:'15px'}}><strong style={{display:'block', marginBottom:'5px', fontSize:'0.9rem'}}>About:</strong><p style={{fontSize:'0.85rem', color:'#4A5568'}}>{profileData.bio || "No bio available."}</p></div>
                <div style={{textAlign:'left', background:'#F7FAFC', padding:'15px', borderRadius:'8px'}}><strong style={{display:'block', marginBottom:'5px', fontSize:'0.9rem'}}>Skills:</strong><div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>{profileData.skills ? profileData.skills.split(',').map(s => (<span key={s} style={{background:'white', border:'1px solid #E2E8F0', padding:'3px 8px', borderRadius:'4px', fontSize:'0.75rem', color:'#2D3748'}}>{s.trim()}</span>)) : <span style={{color:'#A0AEC0', fontSize:'0.8rem'}}>No skills listed.</span>}</div></div>
            </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewOrder && <div className="modal-overlay"><div className="order-modal"><div className="order-header"><div><h3>Review</h3><span>By: {reviewOrder.freelancer_name}</span></div><button onClick={()=>setReviewOrder(null)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button></div><div style={{background:'#E6FFFA', padding:'20px', borderRadius:'12px', marginBottom:'20px', textAlign:'center', border:'1px solid #B2F5EA'}}>{latestDelivery ? <a href={latestDelivery} target="_blank" rel="noreferrer" className="action-btn success">Download File</a> : <p style={{color:'#E53E3E'}}>No file found.</p>}</div><textarea className="form-textarea" placeholder="Feedback if rejecting..." value={revisionNote} onChange={(e)=>setRevisionNote(e.target.value)}></textarea><div style={{display:'flex', gap:'10px', marginTop:10}}><button className="action-btn outline" onClick={() => submitReview('revision_requested')}>Request Revision</button><button className="action-btn success" onClick={() => submitReview('completed')}>Accept</button></div></div></div>}

      {/* CHAT WINDOW */}
      {chatOrder && <div className="chat-overlay"><div className="chat-header"><span>Chat: {chatOrder.freelancer_name}</span><button onClick={closeChat} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>✖</button></div><div className="chat-body" ref={chatBodyRef}>{messages.map(m => (<div key={m.id} className={`chat-bubble ${String(m.sender_id) === String(user.id) ? 'mine' : 'theirs'}`}>{m.text}<span className="chat-time">{m.sent_time?.slice(0,5)}</span></div>))}</div><form className="chat-footer" onSubmit={sendMessage}><input className="chat-input" placeholder="Type..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} /><button className="chat-send-btn">➤</button></form></div>}
    </div>
  );
};

export default ClientDash;