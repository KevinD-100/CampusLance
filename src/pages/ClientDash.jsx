import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import ChatWindow from '../components/ChatWindow';
import ClientReviewModal from '../components/ClientReviewModal';
import ClientRatingModal from '../components/ClientRatingModal';
import ImageLightbox from '../components/ImageLightbox';
import ProjectRoadmap from '../components/ProjectRoadmap';


// 🔴 ADDED 'section' PROP
const ClientDash = ({ user, section }) => {
  const navigate = useNavigate();
  // 🔴 INITIALIZE WITH PROP
  const [activeTab, setActiveTab] = useState(section || 'explore');

  // Data State
  const [gigs, setGigs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // Filters
  const [orderFilter, setOrderFilter] = useState('active');
  const [filters, setFilters] = useState({ category: 'All', min: '', max: '', search: '' });

  // Chat State
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
  const [profilePortfolio, setProfilePortfolio] = useState([]);

  // Lightbox
  const [lightbox, setLightbox] = useState({ open: false, images: [], idx: 0 });

  const [hireDetails, setHireDetails] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [hasFetchedRecs, setHasFetchedRecs] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/analytics/leaderboard');
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) { console.error(err); }
  };

  const fetchRecommendations = async (requirements, title) => {
    if (loadingRecs) return;
    console.log("🤖 Fetching Recs for:", { title, requirements });
    setLoadingRecs(true);
    try {
      const res = await fetch('http://localhost:5000/api/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements, title })
      });
      const data = await res.json();
      console.log("🤖 Recs Received:", data);
      setRecommendations(data);
    } catch (err) {
      console.error("🤖 Matchmaking Error:", err);
    } finally {
      setLoadingRecs(false);
      setHasFetchedRecs(true);
    }
  };

  const handleHire = (job, bid) => {
    setHireDetails({ job, bid });
  };

  const confirmHire = () => {
    const { job, bid } = hireDetails;
    fetch('http://localhost:5000/api/orders/hire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement_id: job.id, client_id: user.id, freelancer_id: bid.freelancer_id, bid_id: bid.id, price: bid.price })
    })
      .then(res => res.json())
      .then(d => {
        alert(d.message);
        setHireDetails(null);
        refreshData();
        setActiveTab('orders');
      });
  };

  const HireConfirmationModal = () => {
    if (!hireDetails) return null;
    const { job, bid } = hireDetails;
    return (
      <div className="modal-overlay">
        <div className="modal-card hire-modal">
          <h2>Confirm Agreement</h2>
          <p>You are about to hire <strong>{bid.freelancer_name}</strong> for the project: <strong>{job.title}</strong>.</p>
          <div className="hire-summary">
            <div className="summary-row">
              <span>Total Price:</span>
              <span className="price-tag">₹{bid.price}</span>
            </div>
            <p className="summary-note">Payment will be processed only after you accept the final delivery.</p>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setHireDetails(null)}>Cancel</button>
            <button className="btn-primary" onClick={confirmHire}>Confirm & Hire</button>
          </div>
        </div>
      </div>
    );
  };

  // 1. DATA FETCHING
  const refreshData = () => {
    if (user?.id) {
      setLoading(true);
      // FETCH GIGS WITH FILTERS
      const query = new URLSearchParams(filters).toString();
      fetch(`http://localhost:5000/api/gigs?${query}`).then(res => res.json()).then(data => setGigs(data));

      fetch(`http://localhost:5000/api/requirements/client/${user.id}`).then(res => res.json()).then(data => setMyJobs(data));
      fetch(`http://localhost:5000/api/orders/client/${user.id}`)
        .then(res => res.json())
        .then(data => { setOrders(data); setLoading(false); })
        .catch(err => console.error(err));

      fetch(`http://localhost:5000/api/favorites/${user.id}`).then(res => res.json()).then(ids => setFavorites(ids));
    }
  };

  useEffect(() => { refreshData(); }, [user?.id]); // Stabilized dependency

  // 🤖 AUTO-FETCH RECS ONCE JOBS LOAD (Guarded to prevent loops)
  useEffect(() => {
    if (myJobs.length > 0 && !hasFetchedRecs && !loadingRecs) {
      fetchRecommendations(myJobs[0].description, myJobs[0].title);
    }
  }, [myJobs, hasFetchedRecs, loadingRecs]);

  // 🔴 UPDATE TAB WHEN PROP CHANGES
  useEffect(() => {
    if (section) setActiveTab(section);
  }, [section]);

  // Fetch Profile for Modal
  useEffect(() => {
    if (viewProfileId) {
      // Fetch Profile Info
      fetch(`http://localhost:5000/api/profile/${viewProfileId}`)
        .then(res => res.json())
        .then(data => setProfileData(data));

      // Fetch Portfolio
      fetch(`http://localhost:5000/api/portfolio/${viewProfileId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setProfilePortfolio(data);
          else setProfilePortfolio([]);
        })
        .catch(err => setProfilePortfolio([]));
    }
  }, [viewProfileId]);

  // --- ACTIONS ---
  const toggleFavorite = async (targetId) => {
    await fetch('http://localhost:5000/api/favorites', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, target_id: targetId, fav_type: 'freelancer' })
    });
    refreshData(); // Refresh list
  };

  const submitRating = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/ratings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ratingData, order_id: ratingOrder.id, client_id: user.id, freelancer_id: ratingOrder.freelancer_id })
    });
    alert("Rating Submitted!");
    setRatingOrder(null);
  };

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
      } else setLatestDelivery(null);
    } catch (err) { console.error(err); }
  };

  const submitReview = async (status) => {
    if (status === 'revision_requested' && !revisionNote.trim()) return alert("Enter feedback.");

    if (status === 'completed') {
      if (!window.Razorpay) {
        console.error("❌ Razorpay SDK NOT LOADED. Check global script tag in index.html.");
        return alert("Razorpay SDK is missing! Please refresh the page. If it persists, check your internet connection.");
      }
      if (!window.confirm(`Accept work and Pay ₹${reviewOrder.total_price}?`)) return;

      try {
        console.log("💳 Starting Payment Flow for Price:", reviewOrder.total_price);
        // 1. Create Razorpay Order
        const resOrder = await fetch('http://localhost:5000/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: reviewOrder.total_price })
        });
        const orderData = await resOrder.json();
        console.log("📦 Received Order Data:", orderData);

        if (!orderData || !orderData.id) {
          console.error("❌ Order Creation Failed:", orderData);
          return alert("Payment initialization failed. Razorpay could not create an order.");
        }

        // 2. Open Razorpay Modal
        if (!window.Razorpay) {
          console.error("❌ window.Razorpay NOT FOUND. Script might be blocked.");
          return alert("Razorpay SDK not loaded. Check your internet connection or browser security settings.");
        }

        const options = {
          key: 'rzp_test_SKKavRDsA7hwvi', // Real Test Key ID
          amount: orderData.amount,
          currency: orderData.currency,
          name: "CampusLance",
          description: `Payment for Order #${reviewOrder.id}`,
          order_id: orderData.id,
          modal: {
            ondismiss: function () { console.log("💸 Checkout Modal Closed by User"); }
          },
          handler: async (response) => {
            console.log("✅ Payment Success Response Received:", response);
            // 3. Verify Payment
            const resVerify = await fetch('http://localhost:5000/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response)
            });
            const verifyData = await resVerify.json();

            if (verifyData.status === 'success') {
              console.log("🎊 Payment Verified on Backend.");
              // 4. Finalize Review on Backend
              await fetch('http://localhost:5000/api/orders/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: reviewOrder.id, client_id: user.id, status, feedback: revisionNote })
              });
              alert("✅ Payment Successful! Order #" + reviewOrder.id + " is now Completed.");
              setReviewOrder(null);
              refreshData();
            } else {
              console.error("❌ Payment verification failed:", verifyData);
              alert("❌ Payment verification failed.");
            }
          },
          prefill: {
            name: user.name,
            email: user.email
          },
          theme: { color: "#3182CE" }
        };

        console.log("🚀 Launching Razorpay Checkout...");
        const rzp = new window.Razorpay(options);
        rzp.open();

      } catch (err) {
        console.error("🔥 Payment Process Crash:", err);
        alert("Payment process failed. Ensure backend and frontend are properly synced.");
      }
    } else {
      // Logic for Revision Requested (No Payment Needed)
      await fetch('http://localhost:5000/api/orders/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: reviewOrder.id, client_id: user.id, status, feedback: revisionNote })
      });
      alert("Revision Requested.");
      setReviewOrder(null);
      refreshData();
    }
  };

  // Helper
  const getProgress = (status) => {
    switch (status) {
      case 'pending': return 'w-10';
      case 'in_progress': return 'w-30';
      case 'draft_delivered': return 'w-60';
      case 'final_delivered': return 'w-80';
      case 'completed': return 'w-100';
      case 'revision_requested': return 'w-40';
      case 'cancelled': return 'w-0';
      default: return 'w-10';
    }
  };

  // --- SECTIONS ---

  // 1. EXPLORE SECTION


  // 2. MY JOBS & BIDS SECTION
  const JobPostsSection = () => {
    const [bidsMap, setBidsMap] = useState({});
    const hiredJobIds = orders.map(o => o.requirement_id);
    const fetchBids = (jobId) => fetch(`http://localhost:5000/api/bids/job/${jobId}`).then(res => res.json()).then(data => setBidsMap(p => ({ ...p, [jobId]: data })));

    useEffect(() => { myJobs.forEach(j => fetchBids(j.id)); }, [myJobs]);

    return (
      <div className="animate-fade-in">
        <div className="header-row" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>My Posted Jobs</h3>
            <p style={{ margin: '5px 0 0', color: '#718096', fontSize: '0.9rem' }}>Manage your active listings and hirings.</p>
          </div>
          <button className="create-btn-primary" onClick={() => navigate('/post-job')}>+ Post New Job</button>
        </div>

        {myJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', border: '2px dashed #E2E8F0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📢</div>
            <h4 style={{ color: '#2D3748' }}>No Jobs Posted Yet</h4>
            <p style={{ color: '#718096' }}>Post a requirement to start receiving bids from freelancers.</p>
            <button className="btn-small outline" style={{ marginTop: '15px' }} onClick={() => navigate('/post-job')}>Post a Job</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {myJobs.map(job => {
              const isHired = hiredJobIds.includes(job.id);
              const bidCount = bidsMap[job.id]?.length || 0;

              return (
                <div key={job.id} style={{
                  background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  borderLeft: isHired ? '5px solid #48BB78' : '5px solid #4299E1',
                  opacity: isHired ? 0.9 : 1, transition: 'all 0.2s', overflow: 'hidden'
                }}>
                  {/* Job Header */}
                  <div style={{ padding: '20px', borderBottom: '1px solid #EDF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: isHired ? '#F0FFF4' : 'white' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#2D3748', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {job.title}
                        {isHired && <span style={{ background: '#48BB78', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>Hired</span>}
                        {!isHired && <span style={{ background: '#4299E1', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>Open</span>}
                      </h4>
                      <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>{job.description.substring(0, 100)}...</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#2D3748' }}>{job.description.match(/\[Budget: (.*?)\]/)?.[1] || "N/A"}</div>
                      <small style={{ color: '#A0AEC0' }}>Budget</small>
                    </div>
                  </div>

                  {/* Proposals Section */}
                  {!isHired && (
                    <div style={{ padding: '20px', background: '#FAFCFE' }}>
                      <h5 style={{ margin: '0 0 15px 0', color: '#4A5568', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Received Proposals ({bidCount})
                      </h5>

                      {bidCount === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: '#A0AEC0', fontStyle: 'italic' }}>No proposals yet. Check back later!</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                          {bidsMap[job.id]?.map(bid => (
                            <div key={bid.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '15px', position: 'relative', transition: 'transform 0.2s' }}>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                                <img
                                  src={bid.profile_pic || "https://via.placeholder.com/50"}
                                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid #E2E8F0' }}
                                  onClick={() => setViewProfileId(bid.user_id)}
                                />
                                <div>
                                  <div
                                    style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#2D3748', cursor: 'pointer', textDecoration: 'hover:underline' }}
                                    onClick={() => setViewProfileId(bid.user_id)}
                                  >
                                    {bid.freelancer_name}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#718096' }}>{bid.delivery_days} Days Delivery</div>
                                </div>
                                <div style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#2B6CB0', fontSize: '1.1rem' }}>₹{bid.price}</div>
                              </div>

                              <div style={{ background: '#F7FAFC', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', color: '#4A5568', marginBottom: '15px', fontStyle: 'italic' }}>
                                "{bid.message}"
                              </div>

                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                  onClick={() => setViewProfileId(bid.user_id)}
                                  className="btn-small outline"
                                  style={{ flex: 1, padding: '8px' }}
                                >
                                  Profile
                                </button>
                                <button
                                  onClick={() => handleHire(job, bid)}
                                  className="btn-small"
                                  style={{ flex: 1, padding: '8px', background: 'linear-gradient(to right, #48BB78, #38A169)', color: 'white', border: 'none' }}
                                >
                                  Hire Now
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 3. ORDERS SECTION
  const OrdersSection = () => {
    const displayedOrders = orders.filter(o => orderFilter === 'active' ? o.status !== 'completed' && o.status !== 'cancelled' : o.status === 'completed' || o.status === 'cancelled');
    return (
      <div className="animate-fade-in">
        <div className="header-row"><h3 className="section-title">My Orders</h3><div style={{ display: 'flex', gap: '10px' }}><select className="filter-select" onChange={(e) => setOrderFilter(e.target.value)} value={orderFilter}><option value="active">Active</option><option value="completed">History</option></select><button className="btn-small outline" onClick={refreshData}>Refresh</button></div></div>
        {displayedOrders.length === 0 ? <p style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No orders found.</p> : (
          <div className="gigs-grid">
            {displayedOrders.map(order => (
              <div key={order.id} className="order-card-modern" style={{ borderLeft: `5px solid ${order.status === 'completed' ? '#48BB78' : order.status === 'revision_requested' ? '#F56565' : '#4299E1'}` }}>
                <div className="oc-header"><div><h4 className="oc-title">{order.job_title}</h4><div className="oc-freelancer" onClick={() => setViewProfileId(order.freelancer_id)} style={{ cursor: 'pointer' }}><img src={`https://ui-avatars.com/api/?name=${order.freelancer_name}&background=random`} alt="F" /><span>{order.freelancer_name}</span></div></div><div className="oc-price">₹{order.total_price}</div></div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '5px', color: '#718096' }}><span>Status</span><span style={{ fontWeight: 'bold', textTransform: 'uppercase', color: order.status === 'revision_requested' ? '#C53030' : 'inherit' }}>{order.status.replace('_', ' ')}</span></div>
                  <div className="oc-progress-container"><div className={`oc-progress-fill ${getProgress(order.status)}`}></div></div>
                </div>
                {/* 🗺️ PROJECT ROADMAP */}
                <ProjectRoadmap currentStatus={order.status} milestones={order.milestones} />
                <div className="oc-footer">
                  <button className="action-btn outline" onClick={() => setChatOrder(order)}>💬 Chat</button>
                  {order.status === 'final_delivered' && <button className="action-btn success" style={{ background: '#38B2AC', borderColor: '#319795', color: 'white' }} onClick={() => openReview(order)}>🔍 Review</button>}
                  {order.status === 'completed' && <div style={{ display: 'flex', gap: '5px' }}><button className="btn-small outline" onClick={() => openReview(order)}>📂 Files</button><button className="btn-small" style={{ background: '#F6E05E', color: '#333', fontWeight: 'bold' }} onClick={() => setRatingOrder(order)}>⭐ Rate</button></div>}
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
      <div className="tab-content">
        {/* 1. EXPLORE SECTION (Inlined to fix focus issue) */}
        {(section === 'explore' || section === 'dashboard') && (
          <div className="animate-fade-in">
            {/* FILTER BAR */}
            {/* FILTER BAR - REDESIGNED */}
            <div className="filter-bar" style={{ display: 'flex', gap: '15px', background: 'white', padding: '15px 20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', alignItems: 'center', position: 'relative' }}>

              {/* SEARCH & PREVIEW */}
              <div style={{ flex: 1.5, position: 'relative' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '15px', color: '#A0AEC0' }}></span>
                  <input
                    type="text" placeholder="Search for services..."
                    className="form-input" style={{ width: '100%', paddingLeft: '40px', margin: 0, borderRadius: '50px', border: '1px solid #E2E8F0', height: '50px', fontSize: '0.95rem' }}
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                    onFocus={() => { if (filters.search) setFilters({ ...filters, showPreview: true }) }}
                    onBlur={() => setTimeout(() => setFilters(f => ({ ...f, showPreview: false })), 200)} // Delay for click
                  />
                </div>

                {/* SEARCH PREVIEW DROPDOWN */}
                {filters.search && (
                  <div style={{ position: 'absolute', top: '55px', left: 0, width: '100%', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', border: '1px solid #F7FAFC' }}>
                    {gigs.filter(g => g.title.toLowerCase().includes(filters.search.toLowerCase())).slice(0, 5).map(g => (
                      <div
                        key={g.id}
                        onClick={() => navigate(`/gig/${g.id}`)}
                        style={{ padding: '12px 15px', borderBottom: '1px solid #F7FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => e.target.style.background = '#F7FAFC'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        <img src={g.image_url || "https://via.placeholder.com/30"} style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />
                        <span style={{ fontSize: '0.9rem', color: '#2D3748' }}>{g.title}</span>
                      </div>
                    ))}
                    {gigs.filter(g => g.title.toLowerCase().includes(filters.search.toLowerCase())).length === 0 && (
                      <div style={{ padding: '15px', color: '#718096', fontSize: '0.9rem', fontStyle: 'italic' }}>No results found</div>
                    )}
                  </div>
                )}
              </div>

              {/* CATEGORY (Same Size) */}
              <div style={{ flex: 1.5 }}>
                <select
                  className="form-select"
                  style={{ width: '100%', padding: '0 20px', margin: 0, borderRadius: '50px', border: '1px solid #E2E8F0', height: '50px', appearance: 'none', background: 'white url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23CBD5E0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 20px center', backgroundSize: '12px' }}
                  value={filters.category}
                  onChange={e => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="All">All Categories</option>
                  <option value="Development">💻 Development</option>
                  <option value="Design">🎨 Design</option>
                  <option value="Marketing">📈 Marketing</option>
                  <option value="Writing">✍️ Writing</option>
                  <option value="Others">🔮 Others</option>
                </select>
              </div>

              {/* PRICE ADJUSTING BOX (Popover) */}
              <div style={{ flex: 0.5, position: 'relative' }}>
                <button
                  onClick={() => setFilters(f => ({ ...f, showPrice: !f.showPrice }))}
                  style={{ width: '100%', height: '50px', borderRadius: '50px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#4A5568', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  Price ▾
                </button>

                {filters.showPrice && (
                  <div style={{ position: 'absolute', top: '60px', right: 0, width: '250px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #F7FAFC', zIndex: 50 }}>
                    <h5 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#2D3748' }}>Budget Range</h5>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                      <input type="number" placeholder="Min" className="form-input" style={{ margin: 0, borderRadius: '8px' }} value={filters.min} onChange={e => setFilters({ ...filters, min: e.target.value })} />
                      <span style={{ color: '#A0AEC0' }}>-</span>
                      <input type="number" placeholder="Max" className="form-input" style={{ margin: 0, borderRadius: '8px' }} value={filters.max} onChange={e => setFilters({ ...filters, max: e.target.value })} />
                    </div>
                    <button onClick={() => setFilters(f => ({ ...f, showPrice: false }))} style={{ width: '100%', padding: '8px', background: '#3182CE', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Set Budget</button>
                  </div>
                )}
              </div>

              {/* APPLY ICON BUTTON */}
              <button onClick={refreshData} style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#2D3748', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(45, 55, 72, 0.3)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', marginTop: '20px' }}>
              <div className="gigs-grid" style={{ marginTop: 0 }}>
                {gigs.map(gig => {
                  const isFav = favorites.includes(gig.freelancer_id);
                  const isTop = leaderboard.slice(0, 3).some(l => l.id === gig.freelancer_id);

                  return (
                    <div key={gig.id} className="gig-card" style={{ borderTop: isTop ? '3px solid #ECC94B' : 'none' }}>
                      {isTop && <div style={{ position: 'absolute', top: 10, left: 10, background: '#ECC94B', color: '#744210', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold', zIndex: 5 }}>🏆 TOP RATED</div>}
                      <img src={gig.image_url || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBzdHlsZT0iYmFja2dyb3VuZDoje2VlZXV9Ij48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzU1NSI+R2lnIEltYWdlPC90ZXh0Pjwvc3ZnPg=="} alt={gig.title} className="gig-img" onError={(e) => e.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBzdHlsZT0iYmFja2dyb3VuZDoje2VlZXV9Ij48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzU1NSI+R2lnIEltYWdlPC90ZXh0Pjwvc3ZnPg=="} />
                      <div className="gig-info">
                        <h4>{gig.title}</h4>
                        <div className="gig-meta">
                          <span onClick={() => setViewProfileId(gig.freelancer_id)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>👤 {gig.freelancer_name}</span>
                          <span>⭐ 5.0</span>
                        </div>
                        {/* 🏅 ACHIEVEMENT BADGES */}
                        <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                          {gig.skill_score > 50 && <span title="Skill Master" style={{ fontSize: '0.7rem', background: '#EBF8FF', color: '#2B6CB0', padding: '2px 6px', borderRadius: '4px' }}>🧠 Master</span>}
                          {leaderboard.some(l => l.id === gig.freelancer_id && l.completions >= 1) && <span title="Expert" style={{ fontSize: '0.7rem', background: '#F0FFF4', color: '#276749', padding: '2px 6px', borderRadius: '4px' }}>🎖️ Expert</span>}
                        </div>
                        <div className="gig-footer"><span className="gig-price">₹{gig.price}</span><button className="btn-small outline" onClick={() => navigate(`/gig/${gig.id}`)}>View Details</button></div>
                      </div>
                      <button className={`fav-btn ${isFav ? 'active' : ''}`} onClick={() => toggleFavorite(gig.freelancer_id)} style={{ color: isFav ? '#E53E3E' : '#CBD5E0' }}>♥</button>
                    </div>
                  );
                })}
              </div>

              {/* SIDEBAR: LEADERBOARD & RECS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* LEADERBOARD */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #EDF2F7' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#2D3748', display: 'flex', alignItems: 'center', gap: '8px' }}>🏆 Top Performers</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {leaderboard.map((f, i) => (
                      <div key={f.id} onClick={() => setViewProfileId(f.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.2s', border: i === 0 ? '1px solid #ECC94B' : '1px solid transparent' }} onMouseOver={e => e.currentTarget.style.background = '#F7FAFC'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ fontWeight: 'bold', color: i === 0 ? '#ECC94B' : '#A0AEC0', width: '20px' }}>{i + 1}</div>
                        <img src={f.profile_pic || `https://ui-avatars.com/api/?name=${f.name}&background=random`} style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2D3748' }}>{f.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#718096' }}>{f.skill_score} pts • {f.completions} jobs</div>
                        </div>
                        {i === 0 && <span title="Platform MVP">🏅</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SMART MATCHES BIAS */}
                {myJobs.length > 0 && (
                  <div style={{ background: 'linear-gradient(135deg, #E6FFFA 0%, #B2F5EA 100%)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #81E6D9', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '15px', right: '15px', cursor: 'pointer', color: '#2C7A7B' }} title="How it works: We match your job keywords against freelancer skills and factor in their reputation score (70% skill match, 30% reputation).">ℹ️</div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#2C7A7B', display: 'flex', alignItems: 'center', gap: '8px' }}>🤖 Smart Matches</h4>
                    <p style={{ fontSize: '0.75rem', color: '#285E61', marginBottom: '15px' }}>Top freelancers for: <strong>{myJobs[0].title}</strong></p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {loadingRecs ? (
                        <div style={{ fontSize: '0.75rem', color: '#2C7A7B', textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>🤖 Matching best talent...</div>
                      ) : (
                        recommendations.length > 0 ? recommendations.map(f => (
                          <div key={f.id} onClick={() => setViewProfileId(f.id)} style={{ background: 'white', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={f.profile_pic || `https://ui-avatars.com/api/?name=${f.name}&background=random`} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{f.name}</div>
                                <div style={{ fontSize: '0.65rem', color: '#38A169', fontWeight: 'bold' }}>{f.matchScore}% Optimal Match</div>
                              </div>
                            </div>
                            {f.matchedSkills && f.matchedSkills.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {f.matchedSkills.slice(0, 3).map((s, i) => (
                                  <span key={i} style={{ fontSize: '0.6rem', background: '#F0FFF4', color: '#276749', padding: '1px 5px', borderRadius: '4px', border: '1px solid #C6F6D5' }}>{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )) : (
                          <div style={{ fontSize: '0.75rem', color: '#718096', textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>No matches found yet.</div>
                        )
                      )}
                    </div>

                    <button
                      className="btn-small"
                      style={{ width: '100%', background: '#319795', color: 'white', border: 'none', marginTop: '15px', opacity: loadingRecs ? 0.7 : 1, cursor: loadingRecs ? 'not-allowed' : 'pointer' }}
                      onClick={() => fetchRecommendations(myJobs[0].description, myJobs[0].title)}
                      disabled={loadingRecs}
                    >
                      {loadingRecs ? 'Refining...' : 'Refresh Picks'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {section === 'jobs' && <JobPostsSection />}
        {section === 'orders' && <OrdersSection />}
      </div>

      {/* MODALS */}
      {viewProfileId && profileData && (
        <div className="modal-overlay" onClick={() => setViewProfileId(null)}>
          <div className="modal-card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewProfileId(null)} style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            <img src={profileData.profile_pic || "https://via.placeholder.com/100"} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '3px solid #E2E8F0' }} />
            <h3>{profileData.name}</h3><p style={{ color: '#718096', marginBottom: '20px' }}>Freelancer</p>

            <div style={{ textAlign: 'left', background: '#F7FAFC', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <strong style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>About:</strong>
              <p style={{ fontSize: '0.85rem', color: '#4A5568' }}>{profileData.bio || "No bio available."}</p>
              <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <strong style={{ fontSize: '0.8rem', color: '#2D3748' }}>📧 Contact:</strong> <span style={{ fontSize: '0.8rem' }}>{profileData.email}</span>
              </div>
            </div>

            {/* PORTFOLIO SECTION IN PUBLIC PROFILE */}
            <div style={{ textAlign: 'left', marginTop: '20px' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Portfolio Projects</h4>
              {profilePortfolio.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#A0AEC0' }}>No projects to show.</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                  {profilePortfolio.map(item => {
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

                    if (!Array.isArray(images)) images = [images];
                    images = images.filter(i => i && i !== "null");
                    if (images.length === 0) images = ["https://via.placeholder.com/400x300?text=No+Image"];

                    return (
                      <div key={item.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setLightbox({ open: true, images: images, idx: 0 })}>
                        <div className="hover-zoom-container" style={{ height: '120px', background: '#000', position: 'relative' }}>
                          <img
                            src={images[0]}
                            className="hover-zoom-img"
                            onError={(e) => e.target.src = "https://via.placeholder.com/400x300?text=Broken"}
                          />
                          {images.length > 1 && <span style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>+ {images.length - 1}</span>}
                        </div>
                        <div style={{ padding: '10px' }}>
                          <h5 style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>{item.title}</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                            {item.tools && item.tools.split(',').slice(0, 3).map((t, i) => (
                              <span key={i} style={{ fontSize: '0.65rem', background: '#EDF2F7', padding: '2px 4px', borderRadius: '4px' }}>{t}</span>
                            ))}
                          </div>
                          {item.link && (
                            <a
                              href={item.link} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', marginTop: '8px', fontSize: '0.75rem', color: '#3182CE', textDecoration: 'none' }}
                              onClick={e => e.stopPropagation()}
                            >
                              🔗 Visit Project
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button className="btn-small outline" style={{ width: '100%', marginTop: '20px' }} onClick={() => setViewProfileId(null)}>Close</button>

            {/* LIGHTBOX INSIDE MODAL */}
            {lightbox.open && (
              <ImageLightbox
                images={lightbox.images}
                initialIndex={lightbox.idx}
                onClose={() => setLightbox({ ...lightbox, open: false })}
              />
            )}
          </div>
        </div>
      )}

      {ratingOrder && (
        <ClientRatingModal
          order={ratingOrder}
          user={user}
          onClose={() => setRatingOrder(null)}
          onSubmit={() => {
            alert("Rating Submitted!");
            setRatingOrder(null);
          }}
        />
      )}

      {reviewOrder && (
        <ClientReviewModal
          order={reviewOrder}
          user={user}
          onClose={() => setReviewOrder(null)}
          onUpdate={() => {
            setReviewOrder(null);
            refreshData();
          }}
        />
      )}

      {hireDetails && <HireConfirmationModal />}

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