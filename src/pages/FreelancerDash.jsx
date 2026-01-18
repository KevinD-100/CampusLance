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
  const [score, setScore] = useState(85);
  
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

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // 🔴 PROFILE MODAL STATE (New)
  const [viewProfileId, setViewProfileId] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // 1. FETCH DATA
  const refreshData = () => {
    if (user?.id) {
        setLoading(true);
        fetch(`http://localhost:5000/api/gigs/my/${user.id}`).then(res => res.json()).then(d => { if(Array.isArray(d)) setMyGigs(d); });
        // Fetch requests with client profile info (Backend already joins users table)
        fetch('http://localhost:5000/api/requirements').then(res => res.json()).then(d => { if(Array.isArray(d)) setRequests(d); });
        fetch(`http://localhost:5000/api/portfolio/${user.id}`).then(res => res.json()).then(d => { if(Array.isArray(d)) setPortfolio(d); });
        fetch(`http://localhost:5000/api/orders/freelancer/${user.id}`).then(res => res.json()).then(d => { if(Array.isArray(d)) setOrders(d); setLoading(false); });
        fetch(`http://localhost:5000/api/notifications/${user.id}`).then(res => res.json()).then(data => setNotifications(data));
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

  // Notifications Filter
  const freelancerNotifs = notifications.filter(n => ['order', 'review', 'message'].includes(n.type));
  const unreadCount = freelancerNotifs.filter(n => !n.is_read).length;

  const handleOpenNotifications = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown && unreadCount > 0) {
        fetch(`http://localhost:5000/api/notifications/read/all/${user.id}`, { method: 'PUT' });
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    }
  };

  // Actions
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

  // Chat
  const openChat = (order) => { setChatOrder(order); setMessages([]); fetchMessages(order.id); if(chatInterval.current) clearInterval(chatInterval.current); chatInterval.current = setInterval(() => fetchMessages(order.id), 2000); };
  const closeChat = () => { setChatOrder(null); if(chatInterval.current) clearInterval(chatInterval.current); };
  const fetchMessages = (id) => fetch(`http://localhost:5000/api/messages/${id}`).then(res=>res.json()).then(d=>{if(Array.isArray(d)){setMessages(d); if(chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;}});
  const sendMessage = async (e) => { e.preventDefault(); if(!newMessage.trim()) return; await fetch('http://localhost:5000/api/messages', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ order_id: chatOrder.id, sender_id: user.id, text: newMessage }) }); setNewMessage(""); fetchMessages(chatOrder.id); };

  // --- SECTIONS ---
  const OverviewSection = () => (
    <div className="animate-fade-in">
      <div className="stats-grid">
        <div className="stat-card"><h3>💰 Earnings</h3><div className="value">₹0</div></div>
        <div className="stat-card"><h3>📦 Active Orders</h3><div className="value">{orders.length}</div></div>
      </div>
      <h3 className="section-title">My Active Orders</h3>
      {orders.length === 0 ? <p style={{color:'#718096'}}>No active orders.</p> : (
        <table className="data-table">
          <thead><tr><th>Client</th><th>Project</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {orders.map(order => (
                <tr key={order.id}>
                    <td>{order.client_name}</td><td>{order.job_title}</td>
                    <td><span className={`badge ${order.status === 'final_delivered' ? 'delivered' : order.status === 'revision_requested' ? 'dispute' : 'active'}`}>{order.status === 'revision_requested' ? '⚠️ Revision' : order.status}</span></td>
                    <td>
                        <button className="action-btn outline" onClick={() => openChat(order)}>💬 Chat</button>
                        {order.status !== 'completed' && <button className="action-btn success" style={{marginLeft:'10px'}} onClick={() => setManageOrder(order)}>🚀 Manage</button>}
                    </td>
                </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const GigsSection = () => (<div className="animate-fade-in"><div className="header-row"><h3 className="section-title">Manage Services</h3><button className="create-btn-primary" onClick={() => navigate('/create-gig')}>+ Create Gig</button></div><div className="gigs-list-vertical">{myGigs.map(gig => (<div key={gig.id} className="gig-row-card"><img src={gig.image_url || "https://via.placeholder.com/150"} alt="Gig"/><div className="gig-details"><h4>{gig.title}</h4><p>₹{gig.price}</p></div><div className="gig-actions"><button className="btn-small" onClick={() => navigate(`/edit-gig/${gig.id}`)}>Edit</button><button className="btn-small outline" onClick={() => handleDuplicate(gig.id)}>Duplicate</button></div></div>))}</div></div>);

  // 🔴 IMPROVED FIND WORK SECTION (Card Style)
  const FindWorkSection = () => (
    <div className="animate-fade-in">
      <div className="header-row"><h3 className="section-title">Available Jobs</h3><button className="btn-small outline" onClick={refreshData}>Refresh Feed</button></div>
      
      <div className="requests-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))', gap:'20px'}}>
        {requests.length === 0 ? <p>No jobs found.</p> : requests.map(req => (
          <div key={req.id} className="job-card-expanded" style={{padding:'20px', border:'1px solid #E2E8F0', borderRadius:'12px', background:'white', transition:'transform 0.2s', boxShadow:'0 4px 10px rgba(0,0,0,0.03)'}}>
            
            {/* Header: Title & Budget */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'15px'}}>
                <h4 style={{fontSize:'1.1rem', color:'#2D3748', margin:0, maxWidth:'70%'}}>{req.title}</h4>
                <div className="budget-tag" style={{background:'#E6FFFA', color:'#2C7A7B', padding:'5px 10px', borderRadius:'6px', fontWeight:'bold', fontSize:'0.85rem'}}>
                    {req.description.match(/\[Budget: (.*?)\]/)?.[1] || "Open"}
                </div>
            </div>

            {/* Client Info (Avatar & Name) */}
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px', paddingBottom:'15px', borderBottom:'1px solid #EDF2F7'}}>
                <img 
                    src={req.profile_pic || `https://ui-avatars.com/api/?name=${req.client_name}&background=random`} 
                    alt="Client" 
                    style={{width:'40px', height:'40px', borderRadius:'50%', cursor:'pointer'}}
                    onClick={() => setViewProfileId(req.client_id)}
                />
                <div>
                    <div style={{fontSize:'0.9rem', fontWeight:'600', cursor:'pointer'}} onClick={() => setViewProfileId(req.client_id)}>
                        {req.client_name}
                    </div>
                    <small style={{color:'#718096'}}>Posted: {new Date(req.created_at).toLocaleDateString()}</small>
                </div>
                <button className="btn-small outline" style={{marginLeft:'auto', fontSize:'0.75rem', padding:'4px 8px'}} onClick={() => setViewProfileId(req.client_id)}>
                    View Profile
                </button>
            </div>

            {/* Description */}
            <p style={{fontSize:'0.9rem', color:'#4A5568', lineHeight:'1.5', marginBottom:'20px'}}>
                {req.description.replace(/\[.*?\]/g, '').substring(0, 150)}...
            </p>

            {/* Footer: Deadline & Bid Button */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{fontSize:'0.8rem', color:'#E53E3E', fontWeight:'600'}}>
                    ⏳ Due: {req.deadline ? new Date(req.deadline).toLocaleDateString() : 'ASAP'}
                </div>
                <button 
                    className="create-btn-primary" 
                    style={{padding:'8px 20px', fontSize:'0.9rem', borderRadius:'8px'}}
                    onClick={() => setBidModal(req)}
                >
                    Send Proposal
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PortfolioSection = () => (<div className="animate-fade-in"><div className="header-row"><h3 className="section-title">Portfolio</h3><button className="btn-small outline" onClick={() => navigate('/upload-portfolio')}>Upload</button></div><div className="gigs-grid">{portfolio.map(item => (<div key={item.id} className="gig-card"><img src={item.description.split("|||")[0]} alt={item.title} className="gig-img"/><div className="gig-info"><h4>{item.title}</h4></div></div>))}</div></div>);

  return (
    <div className="dashboard-content">
      {/* Bell */}
      <div style={{position:'absolute', top:'20px', right:'30px', zIndex:100}}>
        <button className="notif-btn" onClick={handleOpenNotifications}>
            🔔 {unreadCount > 0 && <span className="badge dispute" style={{position:'absolute', top:-5, right:-5, padding:0, width:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem'}}>{unreadCount}</span>}
        </button>
        {showNotifDropdown && <div className="notif-dropdown" style={{position:'absolute', right:0, top:50, width:300, background:'white', boxShadow:'0 5px 15px rgba(0,0,0,0.1)', padding:10, borderRadius:10, zIndex:200, maxHeight:'300px', overflowY:'auto', border:'1px solid #E2E8F0'}}><h5 style={{margin:0, padding:'12px', background:'#F7FAFC', borderBottom:'1px solid #eee'}}>Freelancer Alerts</h5>{freelancerNotifs.length === 0 ? <p style={{fontSize:'0.8rem', color:'#888', padding:'20px', textAlign:'center'}}>No alerts.</p> : freelancerNotifs.map(n => (<div key={n.id} style={{padding:'12px', borderBottom:'1px solid #eee', fontSize:'0.85rem', opacity: n.is_read ? 0.6 : 1, background: n.is_read ? 'white' : '#F0FFF4'}}>{JSON.parse(n.payload).message}</div>))}</div>}
      </div>

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

      {/* 🔴 CLIENT PROFILE MODAL */}
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

      {/* Order Modal, Chat, Bid Modal (Keep existing) */}
      {manageOrder && <div className="modal-overlay">... (Manage Order Code) ...</div>}
      {/* (Rest of modals omitted for brevity, ensure you keep them from previous code) */}
      
      {/* RE-PASTING MODALS TO ENSURE COMPLETE FILE */}
      {manageOrder && (
        <div className="modal-overlay">
            <div className="order-modal">
                <div className="order-header"><div><h3>Manage Order</h3><span>Client: {manageOrder.client_name}</span></div><button onClick={()=>setManageOrder(null)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button></div>
                <div className="progress-track"><div className="step completed">1</div><div className="step active">2</div><div className={`step ${manageOrder.status==='final_delivered'?'completed':''}`}>3</div><div className="step">4</div></div>
                {manageOrder.status === 'revision_requested' && <div className="revision-alert" style={{background:'#FFF5F5', border:'1px solid red', padding:10, marginBottom:20, color:'#C53030'}}>⚠️ <b>Revision:</b> {revisionFeedback}</div>}
                <form onSubmit={handleDeliverySubmit}><div className="delivery-type"><div className={`type-btn ${deliveryType==='draft'?'selected':''}`} onClick={()=>setDeliveryType('draft')}>Draft</div><div className={`type-btn ${deliveryType==='final'?'selected':''}`} onClick={()=>setDeliveryType('final')}>Final</div></div><div className="upload-zone"><label style={{cursor:'pointer'}}><span className="upload-icon">☁️</span><span className="upload-text">{deliveryFile ? deliveryFile.name : "Upload File"}</span><input type="file" style={{display:'none'}} onChange={(e)=>setDeliveryFile(e.target.files[0])} /></label></div><textarea className="form-textarea" placeholder="Note..." onChange={(e)=>setDeliveryNote(e.target.value)}></textarea><button className="submit-btn" style={{marginTop:'10px'}}>Send</button></form>
            </div>
        </div>
      )}
      {chatOrder && <div className="chat-overlay"><div className="chat-header"><span>Chat: {chatOrder.client_name}</span><button onClick={closeChat} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>✖</button></div><div className="chat-body" ref={chatBodyRef}>{messages.map(m => (<div key={m.id} className={`chat-bubble ${String(m.sender_id) === String(user.id) ? 'mine' : 'theirs'}`}>{m.text}</div>))}</div><form className="chat-footer" onSubmit={sendMessage}><input className="chat-input" placeholder="Type..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} /><button className="chat-send-btn">➤</button></form></div>}
      {bidModal && <div className="modal-overlay"><div className="modal-card"><h3>Bid on: {bidModal.title}</h3><form onSubmit={submitBid}><div style={{marginBottom:'10px'}}><label>Price</label><input type="number" className="form-input" onChange={e=>setBidData({...bidData, price:e.target.value})} required/></div><div style={{marginBottom:'10px'}}><label>Days</label><input type="number" className="form-input" onChange={e=>setBidData({...bidData, days:e.target.value})} required/></div><div style={{marginBottom:'10px'}}><label>Message</label><textarea className="form-textarea" onChange={e=>setBidData({...bidData, msg:e.target.value})} required></textarea></div><div style={{display:'flex', gap:'10px', marginTop:'15px'}}><button type="button" className="btn-small outline" onClick={()=>setBidModal(null)}>Cancel</button><button className="submit-btn" style={{margin:0}}>Submit</button></div></form></div></div>}
    </div>
  );
};

export default FreelancerDash;