import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import ChatWindow from '../components/ChatWindow';
import ClientReviewModal from '../components/ClientReviewModal';
import ClientRatingModal from '../components/ClientRatingModal';

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

  useEffect(() => { refreshData(); }, [user]); // Initial load (filters empty)
  // Re-fetch when filters apply? Or manual button? Manual is better for performance, but "Live" is cooler. 
  // Let's do manual "Apply Filter" button for explicit control.

  // 🔴 UPDATE TAB WHEN PROP CHANGES
  useEffect(() => {
    if (section) setActiveTab(section);
  }, [section]);

  // Fetch Profile for Modal
  useEffect(() => {
    if (viewProfileId) {
      fetch(`http://localhost:5000/api/profile/${viewProfileId}`)
        .then(res => res.json())
        .then(data => setProfileData(data));
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
    if (status === 'completed' && !window.confirm("Accept work?")) return;
    await fetch('http://localhost:5000/api/orders/review', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: reviewOrder.id, client_id: user.id, status, feedback: revisionNote })
    });
    alert(status === 'completed' ? "Order Completed!" : "Revision Requested.");
    setReviewOrder(null); refreshData();
  };

  // Helper
  const getProgress = (status) => {
    switch (status) {
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
      {/* FILTER BAR */}
      <div className="filter-bar" style={{ display: 'flex', gap: '10px', background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Search services..."
          className="form-input" style={{ flex: 2 }}
          value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
        />
        <select className="form-input" style={{ flex: 1 }} value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
          <option value="All">All Categories</option>
          <option value="Development">Development</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Writing">Writing</option>
        </select>
        <input type="number" placeholder="Min ₹" className="form-input" style={{ width: '80px' }} value={filters.min} onChange={e => setFilters({ ...filters, min: e.target.value })} />
        <input type="number" placeholder="Max ₹" className="form-input" style={{ width: '80px' }} value={filters.max} onChange={e => setFilters({ ...filters, max: e.target.value })} />
        <button onClick={refreshData} className="create-btn-primary" style={{ margin: 0 }}>Apply</button>
      </div>

      <div className="gigs-grid" style={{ marginTop: '20px' }}>
        {gigs.map(gig => {
          const isFav = favorites.includes(gig.freelancer_id);
          return (
            <div key={gig.id} className="gig-card">
              <img src={gig.image_url || `https://via.placeholder.com/400`} alt={gig.title} className="gig-img" onError={(e) => e.target.src = "https://via.placeholder.com/400"} />
              <div className="gig-info"><h4>{gig.title}</h4><div className="gig-meta"><span onClick={() => setViewProfileId(gig.freelancer_id)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>👤 {gig.freelancer_name}</span><span>⭐ 5.0</span></div><div className="gig-footer"><span className="gig-price">₹{gig.price}</span><button className="btn-small outline">View</button></div></div>
              <button className={`fav-btn ${isFav ? 'active' : ''}`} onClick={() => toggleFavorite(gig.freelancer_id)} style={{ color: isFav ? '#E53E3E' : '#CBD5E0' }}>♥</button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 2. MY JOBS & BIDS SECTION
  const JobPostsSection = () => {
    const [bidsMap, setBidsMap] = useState({});
    const hiredJobIds = orders.map(o => o.requirement_id);
    const fetchBids = (jobId) => fetch(`http://localhost:5000/api/bids/job/${jobId}`).then(res => res.json()).then(data => setBidsMap(p => ({ ...p, [jobId]: data })));

    const handleHire = (job, bid) => {
      if (confirm(`Hire ${bid.freelancer_name}?`)) {
        fetch('http://localhost:5000/api/orders/hire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirement_id: job.id, client_id: user.id, freelancer_id: bid.freelancer_id, bid_id: bid.id, price: bid.price })
        })
          .then(res => res.json())
          .then(d => { alert(d.message); refreshData(); setActiveTab('orders'); });
      }
    };

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
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '5px', color: '#718096' }}><span>Status</span><span style={{ fontWeight: 'bold', textTransform: 'uppercase', color: order.status === 'revision_requested' ? '#C53030' : 'inherit' }}>{order.status.replace('_', ' ')}</span></div><div className="oc-progress-container"><div className={`oc-progress-fill ${getProgress(order.status)}`}></div></div></div>
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
        {(section === 'explore' || section === 'dashboard') && <ExploreSection />}
        {section === 'jobs' && <JobPostsSection />}
        {section === 'orders' && <OrdersSection />}
      </div>

      {/* MODALS */}
      {viewProfileId && profileData && (
        <div className="modal-overlay" onClick={() => setViewProfileId(null)}>
          <div className="modal-card" style={{ width: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewProfileId(null)} style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            <img src={profileData.profile_pic || "https://via.placeholder.com/100"} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '3px solid #E2E8F0' }} />
            <h3>{profileData.name}</h3><p style={{ color: '#718096', marginBottom: '20px' }}>Freelancer</p>
            <div style={{ textAlign: 'left', background: '#F7FAFC', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}><strong style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>About:</strong><p style={{ fontSize: '0.85rem', color: '#4A5568' }}>{profileData.bio || "No bio available."}</p><div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}><strong style={{ fontSize: '0.8rem', color: '#2D3748' }}>📧 Contact:</strong> <span style={{ fontSize: '0.8rem' }}>{profileData.email}</span></div></div>
            <button className="btn-small outline" style={{ width: '100%' }} onClick={() => setViewProfileId(null)}>Close</button>
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