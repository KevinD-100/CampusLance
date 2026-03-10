import API_URL from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import ChatWindow from '../components/ChatWindow';
import BidModal from '../components/BidModal';
import ManageOrderModal from '../components/ManageOrderModal';
import ImageLightbox from '../components/ImageLightbox';
import SkillAssessment from '../components/SkillAssessment';

const FreelancerDash = ({ user, section }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(section || 'overview');

  // Data State
  const [myGigs, setMyGigs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  // UI State
  const [bidModalReq, setBidModalReq] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lightbox State
  const [lightbox, setLightbox] = useState({ open: false, images: [], idx: 0 });

  // Manage Order
  const [manageOrder, setManageOrder] = useState(null);
  const [deliveryType, setDeliveryType] = useState('draft');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryFile, setDeliveryFile] = useState(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");

  // Chat State
  const [chatOrder, setChatOrder] = useState(null);

  // Profile Modal State
  const [viewProfileId, setViewProfileId] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // 1. SYNC SIDEBAR
  useEffect(() => {
    if (section) setActiveTab(section);
  }, [section]);

  // 2. FETCH DATA
  const refreshData = () => {
    if (user?.id) {
      setLoading(true);

      // Fetch My Gigs
      fetch(`${API_URL}/api/gigs/my/${user.id}`)
        .then(res => res.json())
        .then(d => { if (Array.isArray(d)) setMyGigs(d); });

      // Fetch Jobs
      fetch(`${API_URL}/api/requirements`)
        .then(res => res.json())
        .then(data => {
          setRequests(Array.isArray(data) ? data : []);
        })
        .catch(err => console.error("❌ Req fetch error:", err));

      // Fetch Portfolio
      fetch(`${API_URL}/api/portfolio/${user.id}`)
        .then(res => res.json())
        .then(d => { if (Array.isArray(d)) setPortfolio(d); });

      // Fetch Orders & Calc Earnings
      fetch(`${API_URL}/api/orders/freelancer/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOrders(data);
            const earnings = data.filter(o => o.status === 'completed').reduce((sum, o) => sum + parseFloat(o.total_price), 0);
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
      fetch(`${API_URL}/api/profile/${viewProfileId}`)
        .then(res => res.json())
        .then(data => setProfileData(data));
    }
  }, [viewProfileId]);

  // Fetch Revision Feedback
  useEffect(() => {
    if (manageOrder && manageOrder.status === 'revision_requested') {
      fetch(`${API_URL}/api/messages/${manageOrder.id}`)
        .then(res => res.json())
        .then(msgs => {
          const revMsg = [...msgs].reverse().find(m => m.text.includes("⚠️ REVISION REQUESTED:"));
          if (revMsg) setRevisionFeedback(revMsg.text.replace("⚠️ REVISION REQUESTED:", "").trim());
        });
    }
  }, [manageOrder]);

  // Actions
  const handleDeleteGig = async (gigId) => {
    if (!window.confirm("Are you sure you want to delete this gig?")) return;
    await fetch(`${API_URL}/api/gigs/${gigId}`, { method: 'DELETE' });
    refreshData();
  };

  const handleDuplicate = async (gigId) => {
    if (!window.confirm("Duplicate this gig?")) return;
    const res = await fetch(`${API_URL}/api/gigs/duplicate/${gigId}`, { method: 'POST' });
    if (res.ok) { alert("Gig Duplicated!"); refreshData(); }
  };

  const handleBidSubmit = async (bidData) => {
    const res = await fetch(`${API_URL}/api/bids`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirement_id: bidModalReq.id,
        freelancer_id: user.id,
        price: bidData.price,
        delivery_days: bidData.days,
        message: bidData.msg
      })
    });
    if (res.ok) { alert("✅ Bid Submitted!"); setBidModalReq(null); }
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
    await fetch(`${API_URL}/api/orders/deliver`, { method: 'POST', body: formData });
    alert(`${typeLabel} Sent Successfully!`);
    setManageOrder(null); setDeliveryFile(null); setDeliveryNote(''); refreshData();
  };

  // --- SECTIONS ---
  const OverviewSection = () => {
    const [orderFilter, setOrderFilter] = useState('active'); // 'active' | 'past'
    const [viewOrderDetails, setViewOrderDetails] = useState(null);

    // Filter logic
    const displayedOrders = orders.filter(o => {
      // Hide inquiries from main list (they are in messages)
      if (o.status === 'inquiry') return false;

      if (orderFilter === 'active') return o.status !== 'completed' && o.status !== 'cancelled';
      if (orderFilter === 'past') return o.status === 'completed' || o.status === 'cancelled';
      return true;
    });

    return (
      <div className="animate-fade-in">
        <div className="stats-grid">
          <div className="stat-card"><h3>💰 Total Earnings</h3><div className="value">₹{totalEarnings}</div></div>
          {/* Filter out inquiries from active count to match list */}
          <div className="stat-card"><h3>📦 Active Orders</h3><div className="value">{orders.filter(o => o.status !== 'completed' && o.status !== 'inquiry').length}</div></div>
          <div className="stat-card"><h3>✅ Completed</h3><div className="value">{orders.filter(o => o.status === 'completed').length}</div></div>
        </div>

        <div className="header-row" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <h3 className="section-title" style={{ margin: 0 }}>My Orders</h3>
            <div className="toggle-pill-container" style={{ background: '#EDF2F7', padding: '4px', borderRadius: '8px', display: 'flex' }}>
              <button
                onClick={() => setOrderFilter('active')}
                style={{
                  padding: '6px 15px',
                  borderRadius: '6px',
                  border: 'none',
                  background: orderFilter === 'active' ? 'white' : 'transparent',
                  boxShadow: orderFilter === 'active' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                  fontWeight: orderFilter === 'active' ? '600' : 'normal',
                  cursor: 'pointer',
                  color: orderFilter === 'active' ? '#2D3748' : '#718096'
                }}
              >
                Running
              </button>
              <button
                onClick={() => setOrderFilter('past')}
                style={{
                  padding: '6px 15px',
                  borderRadius: '6px',
                  border: 'none',
                  background: orderFilter === 'past' ? 'white' : 'transparent',
                  boxShadow: orderFilter === 'past' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                  fontWeight: orderFilter === 'past' ? '600' : 'normal',
                  cursor: 'pointer',
                  color: orderFilter === 'past' ? '#2D3748' : '#718096'
                }}
              >
                Past
              </button>
            </div>
          </div>
          <button className="btn-small outline" onClick={refreshData}>Refresh</button>
        </div>

        {displayedOrders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#A0AEC0', border: '2px dashed #E2E8F0', borderRadius: '12px' }}>
            {orderFilter === 'active' ? "No active orders. Apply for jobs!" : "No completed orders yet."}
          </p>
        ) : (
          <div className="requests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {displayedOrders.map(order => (
              <div key={order.id} className="job-card-expanded" style={{ padding: '20px', border: '1px solid #E2E8F0', borderRadius: '12px', background: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', borderLeft: `5px solid ${order.status === 'completed' ? '#48BB78' : '#3182CE'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#2D3748' }}>{order.job_title}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#718096' }}>Client: {order.client_name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>₹{order.total_price}</div>
                    <span className={`badge ${order.status === 'final_delivered' ? 'delivered' : order.status === 'revision_requested' ? 'dispute' : order.status === 'completed' ? 'active' : 'pending'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="action-btn outline" style={{ flex: 1 }} onClick={() => setChatOrder(order)}>💬 Chat</button>
                  <button className="action-btn outline" style={{ flex: 1 }} onClick={() => setViewOrderDetails(order)}>📄 Details</button>
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button className="action-btn success" style={{ flex: 1 }} onClick={() => setManageOrder(order)}>
                      🚀 Manage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDER DETAILS MODAL */}
        {viewOrderDetails && (
          <div className="modal-overlay" onClick={() => setViewOrderDetails(null)}>
            <div className="modal-card" style={{ width: '500px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Order Details</h3>
                <button onClick={() => setViewOrderDetails(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#718096', fontSize: '0.85rem' }}>ORDER ID</label>
                <div style={{ fontSize: '1.1rem' }}>#ORD-{viewOrderDetails.id}</div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#718096', fontSize: '0.85rem' }}>JOB TITLE</label>
                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{viewOrderDetails.job_title}</div>
              </div>

              <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto', background: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#718096', fontSize: '0.85rem' }}>DETAILS / REQUIREMENTS</label>
                <div style={{ fontSize: '0.95rem', color: '#2D3748', whiteSpace: 'pre-wrap' }}>{viewOrderDetails.job_description || "No specific details provided."}</div>
              </div>

              <div style={{ marginBottom: '20px', background: '#F7FAFC', padding: '15px', borderRadius: '8px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#718096', fontSize: '0.85rem' }}>CLIENT & PRICE</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>👤 {viewOrderDetails.client_name}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#48BB78' }}>₹{viewOrderDetails.total_price}</div>
                </div>
              </div>

              <button className="create-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setViewOrderDetails(null)}>Close</button>
            </div>
          </div>
        )}

      </div>
    );
  };

  const GigsSection = () => (
    <div className="animate-fade-in">
      <div className="header-row"><h3 className="section-title">Manage Services</h3><button className="create-btn-primary" onClick={() => navigate('/create-gig')}>+ Create Gig</button></div>
      <div className="gigs-list-vertical">
        {myGigs.map(gig => (
          <div key={gig.id} className="gig-row-card">
            <img src={gig.image_url || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBzdHlsZT0iYmFja2dyb3VuZDoje2VlZXV9Ij48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzU1NSI+R2lnIEltYWdlPC90ZXh0Pjwvc3ZnPg=="} alt="Gig" onError={(e) => e.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBzdHlsZT0iYmFja2dyb3VuZDoje2VlZXV9Ij48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzU1NSI+R2lnIEltYWdlPC90ZXh0Pjwvc3ZnPg=="} />
            <div className="gig-details"><h4>{gig.title}</h4><p>₹{gig.price}</p></div>
            <div className="gig-actions">
              <button className="btn-small" onClick={() => navigate(`/edit-gig/${gig.id}`)}>Edit</button>
              <button className="btn-small outline" onClick={() => handleDuplicate(gig.id)}>Duplicate</button>
              <button className="btn-small outline" style={{ color: 'red', borderColor: 'red' }} onClick={() => handleDeleteGig(gig.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const FindWorkSection = () => (
    <div className="animate-fade-in">
      <div className="header-row"><h3 className="section-title">Available Jobs</h3><button className="btn-small outline" onClick={refreshData}>Refresh Feed</button></div>

      {(!requests || requests.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '10px' }}>
          <p style={{ color: '#718096' }}>No active jobs found.</p>
          <p style={{ fontSize: '0.8rem' }}>Switch to "Client Mode" and post a requirement to test.</p>
        </div>
      ) : (
        <div className="requests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {requests.map(req => (
            <div key={req.id} className="job-card-expanded" style={{ padding: '20px', border: '1px solid #E2E8F0', borderRadius: '12px', background: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h4 style={{ fontSize: '1.1rem', color: '#2D3748', margin: 0, maxWidth: '70%' }}>{req.title}</h4>
                <div className="budget-tag" style={{ background: '#E6FFFA', color: '#2C7A7B', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  {req.description && req.description.match(/\[Budget: (.*?)\]/) ? req.description.match(/\[Budget: (.*?)\]/)[1] : "Open"}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #EDF2F7' }}>
                <img
                  src={req.profile_pic || "https://via.placeholder.com/40"}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer' }}
                  onClick={() => setViewProfileId(req.client_id)}
                  alt="Client"
                />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }} onClick={() => setViewProfileId(req.client_id)}>{req.client_name}</div>
                  <small style={{ color: '#718096' }}>Posted: {new Date(req.created_at).toLocaleDateString()}</small>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#4A5568', lineHeight: '1.5', marginBottom: '20px' }}>
                {req.description ? req.description.replace(/\[.*?\]/g, '').substring(0, 150) : "No details."}...
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#E53E3E', fontWeight: '600' }}>
                  ⏳ Due: {req.deadline ? new Date(req.deadline).toLocaleDateString() : 'ASAP'}
                </div>
                {req.client_id === user.id ? (
                  <button className="btn-small outline" disabled title="You posted this">Your Job</button>
                ) : (
                  <button className="create-btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem', borderRadius: '8px' }} onClick={() => setBidModalReq(req)}>
                    Send Proposal
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- QUIZ SECTION ---
  const QuizSection = () => (
    <SkillAssessment user={user} onComplete={refreshData} />
  );



  const handleDeletePortfolio = async (id) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`${API_URL}/api/portfolio/${id}`, { method: 'DELETE' });
    refreshData();
  };

  const PortfolioSection = () => (
    <div className="animate-fade-in">
      <div className="header-row"><h3 className="section-title">Portfolio</h3><button className="btn-small outline" onClick={() => navigate('/upload-portfolio')}>+ Add Project</button></div>



      {portfolio.length === 0 ? <p style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>No projects yet. Add your best work!</p> : (
        <div className="animate-fade-in">
          {/* 📊 UNIQUE ANALYTICS BAR */}
          <div className="portfolio-stats-bar">
            <div className="stat-box">
              <span className="stat-value">{portfolio.length}</span>
              <span className="stat-label">Projects</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">
                {[...portfolio].sort((a, b) => portfolio.filter(v => v.category === a.category).length - portfolio.filter(v => v.category === b.category).length).pop()?.category || "General"}
              </span>
              <span className="stat-label">Top Skill</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">
                {new Set(portfolio.flatMap(p => p.tools ? p.tools.split(',') : [])).size}
              </span>
              <span className="stat-label">Tools Used</span>
            </div>
          </div>

          <div className="gigs-grid">
            {portfolio.map(item => {
              // Handle legacy data (image hidden in description) vs new data
              let images = [];
              try {
                if (item.image_url && typeof item.image_url === 'string' && item.image_url.startsWith('[')) {
                  images = JSON.parse(item.image_url);
                } else if (item.image_url) {
                  images = [item.image_url];
                } else {
                  images = [item.description.split("|||")[0]];
                }
              } catch (e) { images = ["https://via.placeholder.com/400x300?text=Error"]; }

              // Safety check & Filter
              if (!Array.isArray(images)) images = [images];
              images = images.filter(i => i && i !== "null" && i.length > 5);
              if (images.length === 0) images = ["https://via.placeholder.com/400x300?text=No+Image"];

              const displayDesc = item.description.includes("|||") ? item.description.split("|||")[1] : item.description;

              return (
                <div key={item.id} className="gig-card tilt-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    className="hover-zoom-container"
                    style={{ position: 'relative', height: '200px', background: '#000', cursor: 'pointer' }}
                    onClick={() => setLightbox({ open: true, images: images, idx: 0 })}
                  >
                    {/* COVER IMAGE (Zoomable) */}
                    <img
                      src={images[0]}
                      className="hover-zoom-img"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/400x300?text=Broken+Image"; }}
                    />

                    {/* BADGE for Multi-Image */}
                    {images.length > 1 && (
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
                        + {images.length - 1} More
                      </div>
                    )}

                    {/* DELETE BUTTON (Stop Propagation) */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePortfolio(item.id); }}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', color: 'red', zIndex: 10 }}
                      title="Delete Project"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="gig-info" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '5px' }}>
                      <h4 style={{ margin: 0 }}>{item.title}</h4>
                      <span style={{ fontSize: '0.7rem', background: '#EBF8FF', color: '#2B6CB0', padding: '2px 6px', borderRadius: '4px' }}>{item.category}</span>
                    </div>

                    {item.tools && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {item.tools.split(',').map((t, i) => (
                          <span key={i} style={{ fontSize: '0.7rem', background: '#F0FFF4', color: '#276749', padding: '2px 6px', borderRadius: '4px', border: '1px solid #C6F6D5' }}>{t.trim()}</span>
                        ))}
                      </div>
                    )}

                    <p style={{ fontSize: '0.85rem', color: '#4A5568', margin: '0 0 15px 0', flex: 1 }}>{displayDesc?.substring(0, 100)}...</p>

                    {item.link && (
                      <a
                        href={item.link} target="_blank" rel="noopener noreferrer"
                        className="btn-small outline"
                        style={{ textAlign: 'center', display: 'block', marginTop: 'auto' }}
                        onClick={e => e.stopPropagation()}
                      >
                        🔗 Visit Project
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {/* RENDER LIGHTBOX */}
            {lightbox.open && (
              <ImageLightbox
                images={lightbox.images}
                initialIndex={lightbox.idx}
                onClose={() => setLightbox({ ...lightbox, open: false })}
              />
            )}
          </div>
        </div>
      )
      }
    </div >
  );

  return (
    <div className="dashboard-content">

      <div className="tab-content">
        {(activeTab === 'overview' || activeTab === 'dashboard') && OverviewSection()}
        {activeTab === 'gigs' && GigsSection()}
        {activeTab === 'work' && FindWorkSection()}
        {activeTab === 'portfolio' && PortfolioSection()}
        {activeTab === 'quizzes' && QuizSection()}
      </div>

      {/* MANAGE ORDER MODAL */}
      {manageOrder && (
        <ManageOrderModal
          order={manageOrder}
          user={user}
          onClose={() => setManageOrder(null)}
          onUpdate={() => {
            setManageOrder(null);
            refreshData();
          }}
        />
      )}

      {/* Client Profile Modal */}
      {viewProfileId && profileData && (
        <div className="modal-overlay" onClick={() => setViewProfileId(null)}>
          <div className="modal-card" style={{ width: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewProfileId(null)} style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            <img src={profileData.profile_pic || "https://via.placeholder.com/100"} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '3px solid #E2E8F0' }} />
            <h3>{profileData.name}</h3><p style={{ color: '#718096', marginBottom: '20px' }}>Client</p>
            <div style={{ textAlign: 'left', background: '#F7FAFC', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}><strong style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>About:</strong><p style={{ fontSize: '0.85rem', color: '#4A5568' }}>{profileData.bio || "No bio available."}</p></div>
            <button className="btn-small outline" style={{ marginTop: '20px', width: '100%' }} onClick={() => setViewProfileId(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Chat & Bid Modals */}
      {chatOrder && (
        <ChatWindow
          order={chatOrder}
          currentUser={user}
          onClose={() => setChatOrder(null)}
        />
      )}

      {bidModalReq && (
        <BidModal
          requirement={bidModalReq}
          user={user}
          onClose={() => setBidModalReq(null)}
          onSubmit={handleBidSubmit}
        />
      )}
    </div>
  );
};

export default FreelancerDash;