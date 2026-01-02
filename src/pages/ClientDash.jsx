import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const ClientDash = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('explore'); 
  
  // Data
  const [gigs, setGigs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chat
  const [chatOrder, setChatOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatInterval = useRef(null);
  const chatBodyRef = useRef(null);

  // Review Modal
  const [reviewOrder, setReviewOrder] = useState(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [latestDelivery, setLatestDelivery] = useState(null);

  // 1. DATA FETCHING
  const refreshData = () => {
    if (user?.id) {
        setLoading(true);
        // Fetch Gigs
        fetch('http://localhost:5000/api/gigs').then(res => res.json()).then(data => setGigs(data));
        
        // Fetch Jobs
        fetch(`http://localhost:5000/api/requirements/client/${user.id}`).then(res => res.json()).then(data => setMyJobs(data));
        
        // Fetch Orders (Crucial for Review Button)
        fetch(`http://localhost:5000/api/orders/client/${user.id}`)
            .then(res => res.json())
            .then(data => {
                console.log("📦 Active Orders:", data); // Check Console to see status
                setOrders(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }
  };

  useEffect(() => { refreshData(); }, [user]);

  // Auto-refresh when switching tabs to ensure status is up to date
  useEffect(() => {
    if (activeTab === 'orders') refreshData();
  }, [activeTab]);

  // --- ACTIONS ---
  
  const openReview = async (order) => {
    setReviewOrder(order);
    // Find the file link in chat history
    try {
        const res = await fetch(`http://localhost:5000/api/messages/${order.id}`);
        const msgs = await res.json();
        
        // Find the last message with a file attachment
        // We reverse the array to find the most recent delivery first
        const deliveryMsg = [...msgs].reverse().find(m => m.text && m.text.includes("[FILE:"));
        
        if (deliveryMsg) {
            // Extract URL from text: "Some text [FILE: http://url]"
            const match = deliveryMsg.text.match(/\[FILE: (.*?)\]/);
            if (match && match[1]) {
                setLatestDelivery(match[1]);
            } else {
                setLatestDelivery(null);
            }
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
    refreshData(); // Refresh to update button state
  };

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
    const fetchBids = (jobId) => fetch(`http://localhost:5000/api/bids/job/${jobId}`).then(res => res.json()).then(data => setBidsMap(p => ({ ...p, [jobId]: data })));
    const handleHire = (job, bid) => {
        if(confirm(`Hire ${bid.freelancer_name}?`)) fetch('http://localhost:5000/api/orders/hire', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ requirement_id: job.id, client_id: user.id, freelancer_id: bid.freelancer_id, bid_id: bid.id, price: bid.price }) }).then(res=>res.json()).then(d=>{alert(d.message); refreshData(); setActiveTab('orders');});
    };
    useEffect(() => { myJobs.forEach(j => fetchBids(j.id)); }, []);
    return (
        <div className="animate-fade-in">
            <div className="header-row"><h3 className="section-title">My Jobs</h3><button className="create-btn-primary" onClick={() => navigate('/post-job')}>+ Post</button></div>
            {myJobs.map(job => (<div key={job.id} className="job-card-expanded"><div className="job-header"><h4>{job.title}</h4></div><div className="bids-section"><h5>Bids ({bidsMap[job.id]?.length || 0})</h5>{bidsMap[job.id]?.map(bid => (<div key={bid.id} className="bid-row"><div className="bid-info"><strong>{bid.freelancer_name}</strong><p>{bid.message}</p></div><button className="action-btn success" onClick={() => handleHire(job, bid)}>Hire</button></div>))}</div></div>))}
        </div>
    );
  };

  const OrdersSection = () => (
    <div className="animate-fade-in">
        <div className="header-row">
            <h3 className="section-title">Active Orders</h3>
            <button className="btn-small outline" onClick={refreshData}>↻ Refresh Status</button>
        </div>
        
        <table className="data-table">
            <thead><tr><th>Freelancer</th><th>Job</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
                {orders.map(order => (
                    <tr key={order.id}>
                        <td>{order.freelancer_name}</td>
                        <td>{order.job_title}</td>
                        <td>
    <span className={`badge ${order.status === 'final_delivered' ? 'delivered' : order.status === 'revision_requested' ? 'dispute' : 'active'}`}>
        {order.status}
    </span>
</td>
<td>
    <button className="action-btn outline" onClick={() => openChat(order)}>💬 Chat</button>
    
    {/* 🔴 FIX: Check for 'final_delivered' instead of 'delivered' */}
    {order.status === 'final_delivered' && (
        <button className="action-btn success" style={{marginLeft:'10px'}} onClick={() => openReview(order)}>
            🔍 Review & Accept
        </button>
    )}
</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );

  // Chat Helpers
  const openChat = (order) => { setChatOrder(order); fetchMessages(order.id); if(chatInterval.current) clearInterval(chatInterval.current); chatInterval.current = setInterval(() => fetchMessages(order.id), 2000); };
  const closeChat = () => { setChatOrder(null); if(chatInterval.current) clearInterval(chatInterval.current); };
  const fetchMessages = (id) => fetch(`http://localhost:5000/api/messages/${id}`).then(res=>res.json()).then(d=>{if(Array.isArray(d)){setMessages(d); if(chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;}});
  const sendMessage = async (e) => { e.preventDefault(); if(!newMessage.trim()) return; await fetch('http://localhost:5000/api/messages', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ order_id: chatOrder.id, sender_id: user.id, text: newMessage }) }); setNewMessage(""); fetchMessages(chatOrder.id); };

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

      {/* 🔴 REVIEW MODAL */}
      {reviewOrder && (
        <div className="modal-overlay">
            <div className="order-modal">
                <div className="order-header">
                    <div><h3>Review Work</h3><span>By: {reviewOrder.freelancer_name}</span></div>
                    <button onClick={()=>setReviewOrder(null)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                </div>

                <div style={{background:'#E6FFFA', padding:'20px', borderRadius:'12px', marginBottom:'20px', textAlign:'center', border:'1px solid #B2F5EA'}}>
                    {latestDelivery ? (
                        <>
                            <div style={{fontSize:'2.5rem', marginBottom:'10px'}}>📄</div>
                            <p style={{fontWeight:'600', color:'#2C7A7B'}}>Work File Ready</p>
                            <a href={latestDelivery} target="_blank" rel="noreferrer" className="action-btn success" style={{display:'inline-block', marginTop:'10px', textDecoration:'none'}}>
                                ⬇️ Download / View
                            </a>
                        </>
                    ) : (
                        <p style={{color:'#E53E3E'}}>⚠️ No file attached directly. Check chat history.</p>
                    )}
                </div>

                <div style={{marginBottom:'15px'}}>
                    <label style={{fontWeight:'600', display:'block', marginBottom:'5px'}}>Revision Instructions (If rejecting)</label>
                    <textarea 
                        className="form-textarea" 
                        placeholder="Describe changes needed..." 
                        value={revisionNote} 
                        onChange={(e)=>setRevisionNote(e.target.value)}
                    ></textarea>
                </div>

                <div style={{display:'flex', gap:'10px'}}>
                    <button className="action-btn outline" style={{flex:1, borderColor:'#E53E3E', color:'#E53E3E'}} onClick={() => submitReview('revision_requested')}>
                        Request Revision
                    </button>
                    <button className="action-btn success" style={{flex:1}} onClick={() => submitReview('completed')}>
                        Accept & Pay
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Chat Window */}
      {chatOrder && <div className="chat-overlay"><div className="chat-header"><span>Chat: {chatOrder.freelancer_name}</span><button onClick={closeChat} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>✖</button></div><div className="chat-body" ref={chatBodyRef}>{messages.map(m => (<div key={m.id} className={`chat-bubble ${String(m.sender_id) === String(user.id) ? 'mine' : 'theirs'}`}>{m.text}</div>))}</div><form className="chat-footer" onSubmit={sendMessage}><input className="chat-input" placeholder="Type..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} /><button className="chat-send-btn">➤</button></form></div>}
    </div>
  );
};

export default ClientDash;