import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const FreelancerDash = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data
  const [myGigs, setMyGigs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  
  // UI
  const [bidModal, setBidModal] = useState(null);
  const [bidData, setBidData] = useState({ price: '', days: '', msg: '' });
  const [loading, setLoading] = useState(true);

  // 🔴 MANAGE ORDER STATE
  const [manageOrder, setManageOrder] = useState(null);
  const [deliveryType, setDeliveryType] = useState('draft'); // 'draft' or 'final'
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryFile, setDeliveryFile] = useState(null);

  // Chat
  const [chatOrder, setChatOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatInterval = useRef(null);
  const chatBodyRef = useRef(null);

  // Fetch Data
  const refreshData = () => {
    if (user?.id) {
        setLoading(true);
        fetch(`http://localhost:5000/api/gigs/my/${user.id}`).then(res => res.json()).then(d => { if(Array.isArray(d)) setMyGigs(d); });
        fetch('http://localhost:5000/api/requirements').then(res => res.json()).then(d => { if(Array.isArray(d)) setRequests(d); });
        fetch(`http://localhost:5000/api/portfolio/${user.id}`).then(res => res.json()).then(d => { if(Array.isArray(d)) setPortfolio(d); });
        fetch(`http://localhost:5000/api/orders/freelancer/${user.id}`).then(res => res.json()).then(d => {
            if(Array.isArray(d)) setOrders(d);
            setLoading(false);
        });
    }
  };

  useEffect(() => { refreshData(); }, [user]);

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

  // 🔴 DELIVERY LOGIC (Using Manage Modal)
  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!deliveryFile) return alert("Please select a file.");

    const formData = new FormData();
    formData.append('workFile', deliveryFile);
    formData.append('order_id', manageOrder.id);
    formData.append('sender_id', user.id);
    
    // Custom Message based on Type
    const typeLabel = deliveryType === 'draft' ? '📝 DRAFT' : '✅ FINAL DELIVERY';
    formData.append('text', `${typeLabel}: ${deliveryNote || "Here is the work file."}`);

    await fetch('http://localhost:5000/api/orders/deliver', { method: 'POST', body: formData });
    
    alert(`${typeLabel} Sent Successfully!`);
    setManageOrder(null);
    setDeliveryFile(null);
    setDeliveryNote('');
    refreshData();
  };

  // Chat Logic
  const openChat = (order) => {
    setChatOrder(order);
    setMessages([]);
    fetchMessages(order.id);
    if(chatInterval.current) clearInterval(chatInterval.current);
    chatInterval.current = setInterval(() => fetchMessages(order.id), 2000);
  };
  const closeChat = () => {
    setChatOrder(null);
    if(chatInterval.current) clearInterval(chatInterval.current);
  };
  const fetchMessages = (orderId) => {
    fetch(`http://localhost:5000/api/messages/${orderId}`)
        .then(res => res.json())
        .then(data => {
            if(Array.isArray(data)) {
                setMessages(data);
                if(chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
            }
        });
  };
  const sendMessage = async (e) => {
    e.preventDefault();
    if(!newMessage.trim()) return;
    await fetch('http://localhost:5000/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: chatOrder.id, sender_id: user.id, text: newMessage })
    });
    setNewMessage("");
    fetchMessages(chatOrder.id);
  };

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
                    <td>{order.client_name}</td>
                    <td>{order.job_title}</td>
                    <td>
                        {/* Dynamic Status Badges */}
                        <span className={`badge ${
        order.status === 'final_delivered' ? 'delivered' : 
        order.status === 'revision_requested' ? 'dispute' : 'active'
    }`}>
        {order.status === 'revision_requested' ? '⚠️ Revision' : order.status}
    </span>
                    </td>
                    <td>
                        <button className="action-btn outline" onClick={() => openChat(order)}>💬 Chat</button>
                        {/* Open Manage Modal */}
                        {order.status !== 'completed' && (
                            <button className="action-btn success" style={{marginLeft:'10px'}} onClick={() => setManageOrder(order)}>
                                🚀 Manage & Deliver
                            </button>
                        )}
                    </td>
                </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const GigsSection = () => (<div className="animate-fade-in"><div className="header-row"><h3 className="section-title">Manage Services</h3><button className="create-btn-primary" onClick={() => navigate('/create-gig')}>+ Create Gig</button></div><div className="gigs-list-vertical">{myGigs.map(gig => (<div key={gig.id} className="gig-row-card"><img src={gig.image_url || "https://placehold.co/100"} alt="Gig"/><div className="gig-details"><h4>{gig.title}</h4><p>₹{gig.price}</p></div><div className="gig-actions"><button className="btn-small" onClick={() => navigate(`/edit-gig/${gig.id}`)}>Edit</button><button className="btn-small outline" onClick={() => handleDuplicate(gig.id)}>Duplicate</button></div></div>))}</div></div>);
  const FindWorkSection = () => (<div className="animate-fade-in"><div className="header-row"><h3 className="section-title">Requests</h3><button className="btn-small outline" onClick={refreshData}>Refresh</button></div><div className="requests-grid">{requests.map(req => (<div key={req.id} className="request-card"><div className="req-header"><h4>{req.title}</h4></div><div className="req-footer"><button className="create-btn-primary" style={{width:'100%'}} onClick={() => setBidModal(req)}>Bid Now</button></div></div>))}</div></div>);
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

      {/* 🔴 MANAGE ORDER MODAL (Delivery & Revision) */}
      {manageOrder && (
        <div className="modal-overlay">
            <div className="order-modal">
                <div className="order-header">
                    <div>
                        <h3>Manage Order</h3>
                        <span>Client: {manageOrder.client_name}</span>
                    </div>
                    <button onClick={()=>setManageOrder(null)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                </div>

                {/* Progress Tracker */}
                <div className="progress-track">
                    <div className="step completed" data-label="Start">✓</div>
                    <div className="step active" data-label="Working">2</div>
                    <div className={`step ${manageOrder.status === 'delivered' ? 'completed' : ''}`} data-label="Deliver">3</div>
                    <div className="step" data-label="Finish">4</div>
                </div>

                {/* Revision Alert */}
                {manageOrder.status === 'revision_requested' && (
                    <div className="revision-alert">
                        ⚠️ <b>Revision Requested:</b> Please check chat for feedback and upload a new version.
                    </div>
                )}

                {/* Checklist */}
                <div className="checklist-container">
                    <div style={{fontWeight:'600', marginBottom:'10px', fontSize:'0.85rem'}}>MILESTONE CHECKLIST</div>
                    <label className="checklist-item"><input type="checkbox" defaultChecked /> Requirements Clear</label>
                    <label className="checklist-item"><input type="checkbox" /> First Draft Created</label>
                    <label className="checklist-item"><input type="checkbox" /> Final Polish</label>
                </div>

                <form onSubmit={handleDeliverySubmit}>
                    <div style={{fontWeight:'600', marginBottom:'10px', fontSize:'0.9rem'}}>UPLOAD WORK</div>
                    
                    {/* Toggle: Draft vs Final */}
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

      {/* CHAT WINDOW */}
      {chatOrder && (
        <div className="chat-overlay">
            <div className="chat-header">
                <span>Chat: {chatOrder.client_name}</span>
                <button onClick={closeChat} style={{background:'none', border:'none', color:'white', cursor:'pointer', fontSize:'1.2rem'}}>✖</button>
            </div>
            
            <div className="chat-body" ref={chatBodyRef}>
                {messages.length === 0 && <p style={{textAlign:'center', color:'#aaa', marginTop:'20px'}}>No messages yet.</p>}
                
                {messages.map(m => (
                    <div 
                        key={m.id} 
                        className={`chat-bubble ${String(m.sender_id) === String(user.id) ? 'mine' : 'theirs'}`}
                    >
                        {m.text}
                        <span className="chat-time">{m.sent_time ? m.sent_time.slice(0, 5) : ''}</span>
                    </div>
                ))}
            </div>

            <form className="chat-footer" onSubmit={sendMessage}>
                <input className="chat-input" placeholder="Type a message..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} />
                <button className="chat-send-btn">➤</button>
            </form>
        </div>
      )}

      {/* BIDDING MODAL */}
      {bidModal && (
        <div className="modal-overlay">
            <div className="modal-card">
                <h3>Bid on: {bidModal.title}</h3>
                <form onSubmit={submitBid}>
                    <div style={{marginBottom:'10px'}}><label>Price (₹)</label><input type="number" className="form-input" onChange={e=>setBidData({...bidData, price:e.target.value})} required/></div>
                    <div style={{marginBottom:'10px'}}><label>Delivery (Days)</label><input type="number" className="form-input" onChange={e=>setBidData({...bidData, days:e.target.value})} required/></div>
                    <div style={{marginBottom:'10px'}}><label>Message</label><textarea className="form-textarea" onChange={e=>setBidData({...bidData, msg:e.target.value})} required></textarea></div>
                    <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                        <button type="button" className="btn-small outline" onClick={()=>setBidModal(null)}>Cancel</button>
                        <button className="submit-btn" style={{margin:0}}>Submit</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default FreelancerDash;