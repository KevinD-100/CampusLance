import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const FreelancerDash = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data State
  const [myGigs, setMyGigs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0); 

  // UI State
  const [bidModal, setBidModal] = useState(null);
  const [bidData, setBidData] = useState({ price: '', days: '', msg: '' });
  const [loading, setLoading] = useState(true);

  // Manage Order
  const [manageOrder, setManageOrder] = useState(null);
  const [deliveryType, setDeliveryType] = useState('draft'); 
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryFile, setDeliveryFile] = useState(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");

  // Chat
  const [chatOrder, setChatOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatInterval = useRef(null);
  const chatBodyRef = useRef(null);

  // Profile Modal State
  const [viewProfileId, setViewProfileId] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // 1. FETCH DATA
  const refreshData = () => {
    if (user?.id) {
        setLoading(true);
        fetch(`http://localhost:5000/api/gigs/my/${user.id}`).then(res => res.json()).then(d => { if(Array.isArray(d)) setMyGigs(d); });
        
        fetch('http://localhost:5000/api/requirements').then(res => res.json()).then(d => { if(Array.isArray(d)) setRequests(d); });
        
        fetch(`http://localhost:5000/api/portfolio/${user.id}`).then(res => res.json()).then(d => { if(Array.isArray(d)) setPortfolio(d); });
        
        fetch(`http://localhost:5000/api/orders/freelancer/${user.id}`)
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) {
                    setOrders(data);
                    // Calculate Earnings
                    const earnings = data
                        .filter(o => o.status === 'completed')
                        .reduce((sum, o) => sum + parseFloat(o.total_price), 0);
                    setTotalEarnings(earnings);
                }
                setLoading(false);
            })
            .catch(err => console.error("Orders Error:", err));
    }
  };

  useEffect(() => { refreshData(); }, [user]);

  // Fetch Profile for Modal
  useEffect(() => {
    if (viewProfileId) {
        fetch(`http://localhost:5000/api/profile/${viewProfileId}`)
            .then(res => res.json())
            .then(data => setProfileData(data));
    }
  }, [viewProfileId]);

  // Fetch Revision Feedback
  useEffect(() => {
    if (manageOrder && manageOrder.status === 'revision_requested') {
        fetch(`http://localhost:5000/api/messages/${manageOrder.id}`)
            .then(res => res.json())
            .then(msgs => {
                const revMsg = [...msgs].reverse().find(m => m.text.includes("⚠️ REVISION REQUESTED:"));
                if (revMsg) setRevisionFeedback(revMsg.text.replace("⚠️ REVISION REQUESTED:", "").trim());
            });
    }
  }, [manageOrder]);

  // Actions
  const handleDeleteGig = async (gigId) => {
    if(!window.confirm("Are you sure you want to delete this gig?")) return;
    await fetch(`http://localhost:5000/api/gigs/${gigId}`, { method: 'DELETE' });
    refreshData();
  };

  const handleDuplicate = async (gigId) => {
    if(!window.confirm("Duplicate this gig?")) return;
    const res = await fetch(`http://localhost:5000/api/gigs/duplicate/${gigId}`, { method: 'POST' });
    if (res.ok) { alert("Gig Duplicated!"); refreshData(); }
  };

  const submitBid = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/bids', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement_id: bidModal.id, freelancer_id: user.id, price: bidData.price, delivery_days: bidData.days, message: bidData.msg })
    });
    if (res.ok) { alert("✅ Bid Submitted!"); setBidModal(null); }
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!deliveryFile) return alert("Please select a file.");
    const formData = new FormData();
    formData.append('workFile', deliveryFile);
    formData.append('order_id', manageOrder.id);
    formData.append('sender_id', user.id);
    const typeLabel = deliveryType === 'draft' ? '📝 DRAFT' : '✅ FINAL DELIVERY';
    formData.append('text', `${typeLabel}: ${deliveryNote || "Here is the work file."}`);
    await fetch('http://localhost:5000/api/orders/deliver', { method: 'POST', body: formData });
    alert(`${typeLabel} Sent Successfully!`);
    setManageOrder(null); setDeliveryFile(null); setDeliveryNote(''); refreshData();
  };

  // Chat Logic
  const openChat = (order) => { setChatOrder(order); setMessages([]); fetchMessages(order.id); if(chatInterval.current) clearInterval(chatInterval.current); chatInterval.current = setInterval(() => fetchMessages(order.id), 2000); };
  const closeChat = () => { setChatOrder(null); if(chatInterval.current) clearInterval(chatInterval.current); };
  const fetchMessages = (id) => fetch(`http://localhost:5000/api/messages/${id}`).then(res=>res.json()).then(d=>{if(Array.isArray(d)){setMessages(d); if(chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;}});
  const sendMessage = async (e) => { e.preventDefault(); if(!newMessage.trim()) return; await fetch('http://localhost:5000/api/messages', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ order_id: chatOrder.id, sender_id: user.id, text: newMessage }) }); setNewMessage(""); fetchMessages(chatOrder.id); };

  // --- SECTIONS ---
  const OverviewSection = () => (
    <div className="animate-fade-in">
      <div className="stats-grid">
        <div className="stat-card"><h3>💰 Total Earnings</h3><div className="value">₹{totalEarnings}</div></div>
        <div className="stat-card"><h3>📦 Active Orders</h3><div className="value">{orders.filter(o => o.status !== 'completed').length}</div></div>
        <div className="stat-card"><h3>✅ Completed</h3><div className="value">{orders.filter(o => o.status === 'completed').length}</div></div>
      </div>

      <div className="header-row"><h3 className="section-title">Active Orders</h3><button className="btn-small outline" onClick={refreshData}>Refresh</button></div>
      
      {orders.length === 0 ? <p style={{textAlign:'center', padding:'40px', color:'#A0AEC0', border:'2px dashed #E2E8F0', borderRadius:'12px'}}>No active orders. Start bidding!</p> : (
        <div className="requests-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))', gap:'20px'}}>
            {orders.map(order => (
                <div key={order.id} className="job-card-expanded" style={{padding:'20px', border:'1px solid #E2E8F0', borderRadius:'12px', background:'white', boxShadow:'0 4px 10px rgba(0,0,0,0.03)', borderLeft: `5px solid ${order.status==='completed'?'#48BB78':'#3182CE'}`}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                        <div>
                            <h4 style={{margin:0, color:'#2D3748'}}>{order.job_title}</h4>
                            <span style={{fontSize:'0.8rem', color:'#718096'}}>Client: {order.client_name}</span>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <div style={{fontWeight:'bold', fontSize:'1.1rem'}}>₹{order.total_price}</div>
                            <span className={`badge ${order.status === 'final_delivered' ? 'delivered' : order.status === 'revision_requested' ? 'dispute' : order.status === 'completed' ? 'active' : 'pending'}`}>
                                {order.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                        <button className="action-btn outline" style={{flex:1}} onClick={() => openChat(order)}>💬 Chat</button>
                        {order.status !== 'completed' && (
                            <button className="action-btn success" style={{flex:1}} onClick={() => setManageOrder(order)}>
                                🚀 Manage
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );

  const GigsSection = () => (
    <div className="animate-fade-in">
      <div className="header-row"><h3 className="section-title">Manage Services</h3><button className="create-btn-primary" onClick={() => navigate('/create-gig')}>+ Create Gig</button></div>
      <div className="gigs-list-vertical">
        {myGigs.map(gig => (
          <div key={gig.id} className="gig-row-card">
            <img src={gig.image_url || "https://placehold.co/100"} alt="Gig"/>
            <div className="gig-details"><h4>{gig.title}</h4><p>₹{gig.price}</p></div>
            <div className="gig-actions">
                <button className="btn-small" onClick={() => navigate(`/edit-gig/${gig.id}`)}>Edit</button>
                <button className="btn-small outline" onClick={() => handleDuplicate(gig.id)}>Duplicate</button>
                <button className="btn-small outline" style={{color:'red', borderColor:'red'}} onClick={() => handleDeleteGig(gig.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const FindWorkSection = () => (
    <div className="animate-fade-in">
      <div className="header-row"><h3 className="section-title">Available Jobs</h3><button className="btn-small outline" onClick={refreshData}>Refresh Feed</button></div>
      <div className="requests-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))', gap:'20px'}}>
        {requests.map(req => (
          <div key={req.id} className="job-card-expanded" style={{padding:'20px', border:'1px solid #E2E8F0', borderRadius:'12px', background:'white'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'15px'}}>
                <h4 style={{fontSize:'1.1rem', color:'#2D3748', margin:0, maxWidth:'70%'}}>{req.title}</h4>
                <div className="budget-tag" style={{background:'#E6FFFA', color:'#2C7A7B', padding:'5px 10px', borderRadius:'6px', fontWeight:'bold', fontSize:'0.85rem'}}>{req.description.match(/\[Budget: (.*?)\]/)?.[1] || "Open"}</div>
            </div>
            
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px', paddingBottom:'15px', borderBottom:'1px solid #EDF2F7'}}>
                <img src={req.profile_pic || "https://via.placeholder.com/40"} style={{width:'40px', height:'40px', borderRadius:'50%', cursor:'pointer'}} onClick={() => setViewProfileId(req.client_id)}/>
                <div>
                    <div style={{fontSize:'0.9rem', fontWeight:'600', cursor:'pointer'}} onClick={() => setViewProfileId(req.client_id)}>{req.client_name}</div>
                    <small style={{color:'#718096'}}>Posted: {new Date(req.created_at).toLocaleDateString()}</small>
                </div>
            </div>

            <p style={{fontSize:'0.9rem', color:'#4A5568', lineHeight:'1.5', marginBottom:'20px'}}>{req.description.replace(/\[.*?\]/g, '').substring(0, 150)}...</p>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{fontSize:'0.8rem', color:'#E53E3E', fontWeight:'600'}}>⏳ Due: {req.deadline ? new Date(req.deadline).toLocaleDateString() : 'ASAP'}</div>
                <button className="create-btn-primary" style={{padding:'8px 20px', fontSize:'0.9rem', borderRadius:'8px'}} onClick={() => setBidModal(req)}>Send Proposal</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PortfolioSection = () => (<div className="animate-fade-in"><div className="header-row"><h3 className="section-title">Portfolio</h3><button className="btn-small outline" onClick={() => navigate('/upload-portfolio')}>Upload</button></div><div className="gigs-grid">{portfolio.map(item => (<div key={item.id} className="gig-card"><img src={item.description.split("|||")[0]} alt={item.title} className="gig-img"/><div className="gig-info"><h4>{item.title}</h4></div></div>))}</div></div>);

  return (
    <div className="dashboard-content">
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab==='overview'?'active':''}`} onClick={()=>setActiveTab('overview')}>Overview</button>
        <button className={`tab-btn ${activeTab==='gigs'?'active':''}`} onClick={()=>setActiveTab('gigs')}>My Gigs</button>
        <button className={`tab-btn ${activeTab==='work'?'active':''}`} onClick={()=>setActiveTab('work')}>Find Work</button>
        <button className={`tab-btn ${activeTab==='portfolio'?'active':''}`} onClick={()=>setActiveTab('portfolio')}>Portfolio</button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'gigs' && <GigsSection />}
        {activeTab === 'work' && <FindWorkSection />}
        {activeTab === 'portfolio' && <PortfolioSection />}
      </div>

      {/* MANAGE ORDER MODAL */}
      {manageOrder && (
        <div className="modal-overlay">
            <div className="order-modal">
                <div className="order-header">
                    <div><h3>Manage Order</h3><span>{manageOrder.job_title} (Client: {manageOrder.client_name})</span></div>
                    <button onClick={()=>setManageOrder(null)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                </div>

                <div className="order-summary-box">
                    <div className="order-info-item"><small>Price</small><strong>₹{manageOrder.total_price}</strong></div>
                    <div className="order-info-item"><small>Status</small><strong style={{textTransform:'capitalize'}}>{manageOrder.status.replace('_', ' ')}</strong></div>
                </div>

                <div className="progress-container">
                    <div className={`progress-step completed`}><div className="step-circle">1</div><div className="step-label">Hired</div></div>
                    <div className={`progress-step ${['in_progress','final_delivered','completed'].includes(manageOrder.status) ? 'active' : ''}`}><div className="step-circle">2</div><div className="step-label">Work</div></div>
                    <div className={`progress-step ${['final_delivered','completed'].includes(manageOrder.status) ? 'completed' : ''}`}><div className="step-circle">3</div><div className="step-label">Deliver</div></div>
                    <div className={`progress-step ${manageOrder.status==='completed' ? 'completed' : ''}`}><div className="step-circle">4</div><div className="step-label">Finish</div></div>
                </div>

                {manageOrder.status === 'revision_requested' && (
                    <div className="revision-alert" style={{background:'#FFF5F5', border:'1px solid red', padding:10, borderRadius:8, color:'#C53030', marginBottom:20}}>
                        <h4>⚠️ Revision Requested</h4>
                        <p><b>Client Feedback:</b> "{revisionFeedback || 'Check chat for details'}"</p>
                    </div>
                )}

                <form onSubmit={handleDeliverySubmit}>
                    <div style={{fontWeight:'600', marginBottom:'10px', fontSize:'0.9rem'}}>DELIVER WORK</div>
                    <div className="delivery-type">
                        <div className={`type-btn ${deliveryType==='draft'?'selected':''}`} onClick={()=>setDeliveryType('draft')}>📝 Send Draft</div>
                        <div className={`type-btn ${deliveryType==='final'?'selected':''}`} onClick={()=>setDeliveryType('final')}>✅ Final Delivery</div>
                    </div>
                    <div className="upload-zone">
                        <label style={{cursor:'pointer', width:'100%', display:'block'}}>
                            <span className="upload-icon">☁️</span>
                            <span className="upload-text">{deliveryFile ? deliveryFile.name : "Click to Upload File"}</span>
                            <input type="file" style={{display:'none'}} onChange={(e)=>setDeliveryFile(e.target.files[0])} />
                        </label>
                    </div>
                    <textarea className="form-textarea" placeholder="Add a note..." onChange={(e)=>setDeliveryNote(e.target.value)}></textarea>
                    <button className="submit-btn" style={{marginTop:'10px'}}>Send Delivery</button>
                </form>
            </div>
        </div>
      )}

      {/* Client Profile Modal */}
      {viewProfileId && profileData && (
        <div className="modal-overlay" onClick={() => setViewProfileId(null)}>
            <div className="modal-card" style={{width:'400px', textAlign:'center'}} onClick={e => e.stopPropagation()}>
                <button onClick={() => setViewProfileId(null)} style={{position:'absolute', right:20, top:20, background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                <img src={profileData.profile_pic || "https://via.placeholder.com/100"} style={{width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover', marginBottom:'15px', border:'3px solid #E2E8F0'}} />
                <h3>{profileData.name}</h3><p style={{color:'#718096', marginBottom:'20px'}}>Client</p>
                <div style={{textAlign:'left', background:'#F7FAFC', padding:'15px', borderRadius:'8px', marginBottom:'15px'}}><strong style={{display:'block', marginBottom:'5px', fontSize:'0.9rem'}}>About:</strong><p style={{fontSize:'0.85rem', color:'#4A5568'}}>{profileData.bio || "No bio available."}</p></div>
                <button className="btn-small outline" style={{marginTop:'20px', width:'100%'}} onClick={() => setViewProfileId(null)}>Close</button>
            </div>
        </div>
      )}

      {/* Chat & Bid Modals */}
      {chatOrder && <div className="chat-overlay"><div className="chat-header"><span>Chat: {chatOrder.client_name}</span><button onClick={closeChat} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>✖</button></div><div className="chat-body" ref={chatBodyRef}>{messages.map(m => (<div key={m.id} className={`chat-bubble ${String(m.sender_id) === String(user.id) ? 'mine' : 'theirs'}`}>{m.text}<span className="chat-time">{m.sent_time?.slice(0,5)}</span></div>))}</div><form className="chat-footer" onSubmit={sendMessage}><input className="chat-input" placeholder="Type..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} /><button className="chat-send-btn">➤</button></form></div>}
      {bidModal && <div className="modal-overlay"><div className="modal-card"><h3>Bid on: {bidModal.title}</h3><form onSubmit={submitBid}><div style={{marginBottom:'10px'}}><label>Price</label><input type="number" className="form-input" onChange={e=>setBidData({...bidData, price:e.target.value})} required/></div><div style={{marginBottom:'10px'}}><label>Days</label><input type="number" className="form-input" onChange={e=>setBidData({...bidData, days:e.target.value})} required/></div><div style={{marginBottom:'10px'}}><label>Message</label><textarea className="form-textarea" onChange={e=>setBidData({...bidData, msg:e.target.value})} required></textarea></div><div style={{display:'flex', gap:'10px', marginTop:'15px'}}><button type="button" className="btn-small outline" onClick={()=>setBidModal(null)}>Cancel</button><button className="submit-btn" style={{margin:0}}>Submit</button></div></form></div></div>}
    </div>
  );
};

export default FreelancerDash;