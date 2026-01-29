import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import ChatWindow from '../components/ChatWindow';
import BidModal from '../components/BidModal';
import ManageOrderModal from '../components/ManageOrderModal';

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
      fetch(`http://localhost:5000/api/gigs/my/${user.id}`)
        .then(res => res.json())
        .then(d => { if (Array.isArray(d)) setMyGigs(d); });

      // Fetch Jobs
      fetch('http://localhost:5000/api/requirements')
        .then(res => res.json())
        .then(data => {
          setRequests(Array.isArray(data) ? data : []);
        })
        .catch(err => console.error("❌ Req fetch error:", err));

      // Fetch Portfolio
      fetch(`http://localhost:5000/api/portfolio/${user.id}`)
        .then(res => res.json())
        .then(d => { if (Array.isArray(d)) setPortfolio(d); });

      // Fetch Orders & Calc Earnings
      fetch(`http://localhost:5000/api/orders/freelancer/${user.id}`)
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
    if (!window.confirm("Are you sure you want to delete this gig?")) return;
    await fetch(`http://localhost:5000/api/gigs/${gigId}`, { method: 'DELETE' });
    refreshData();
  };

  const handleDuplicate = async (gigId) => {
    if (!window.confirm("Duplicate this gig?")) return;
    const res = await fetch(`http://localhost:5000/api/gigs/duplicate/${gigId}`, { method: 'POST' });
    if (res.ok) { alert("Gig Duplicated!"); refreshData(); }
  };

  const handleBidSubmit = async (bidData) => {
    const res = await fetch('http://localhost:5000/api/bids', {
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
    await fetch('http://localhost:5000/api/orders/deliver', { method: 'POST', body: formData });
    alert(`${typeLabel} Sent Successfully!`);
    setManageOrder(null); setDeliveryFile(null); setDeliveryNote(''); refreshData();
  };

  // --- SECTIONS ---
  const OverviewSection = () => {
    const [orderFilter, setOrderFilter] = useState('active'); // 'active' | 'past'

    // Filter logic
    const displayedOrders = orders.filter(o => {
      if (orderFilter === 'active') return o.status !== 'completed' && o.status !== 'cancelled';
      if (orderFilter === 'past') return o.status === 'completed' || o.status === 'cancelled';
      return true;
    });

    return (
      <div className="animate-fade-in">
        <div className="stats-grid">
          <div className="stat-card"><h3>💰 Total Earnings</h3><div className="value">₹{totalEarnings}</div></div>
          <div className="stat-card"><h3>📦 Active Orders</h3><div className="value">{orders.filter(o => o.status !== 'completed').length}</div></div>
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
      </div>
    );
  };

  const GigsSection = () => (
    <div className="animate-fade-in">
      <div className="header-row"><h3 className="section-title">Manage Services</h3><button className="create-btn-primary" onClick={() => navigate('/create-gig')}>+ Create Gig</button></div>
      <div className="gigs-list-vertical">
        {myGigs.map(gig => (
          <div key={gig.id} className="gig-row-card">
            <img src={gig.image_url || "https://placehold.co/100"} alt="Gig" />
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
  const QuizSection = () => {
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    const quizzes = [
      { id: 1, title: 'React.js Basics', questions: [{ q: "What is a Hook?", o: ["Function", "Class", "Var", "Loop"], a: "Function" }, { q: "JSX stands for?", o: ["JS XML", "Java X", "JSON X", "None"], a: "JS XML" }] },
      { id: 2, title: 'Python Mastery', questions: [{ q: "Is Python compiled?", o: ["Yes", "No", "Both", "None"], a: "No" }, { q: "Keyword for function?", o: ["func", "def", "fun", "function"], a: "def" }] },
      { id: 3, title: 'UI/UX Principles', questions: [{ q: "What is Contrast?", o: ["Difference in color", "Size", "Shape", "None"], a: "Difference in color" }, { q: "Best tool for UI?", o: ["Figma", "Paint", "Word", "Excel"], a: "Figma" }] }
    ];

    const handleAnswer = (ans) => {
      if (ans === activeQuiz.questions[currentQuestion].a) setScore(score + 10);
      if (currentQuestion + 1 < activeQuiz.questions.length) setCurrentQuestion(currentQuestion + 1);
      else {
        setFinished(true);
        // Submit Score
        fetch('http://localhost:5000/api/quiz/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, score: score + (ans === activeQuiz.questions[currentQuestion].a ? 10 : 0) })
        });
      }
    };

    return (
      <div className="animate-fade-in">
        <h3 className="section-title">Skill Assessments 🏆</h3>
        {!activeQuiz ? (
          <div className="gigs-grid">
            {quizzes.map(q => (
              <div key={q.id} className="gig-card" style={{ textAlign: 'center', padding: '30px' }}>
                <h4>{q.title}</h4>
                <p style={{ color: '#718096', marginBottom: '20px' }}>Verify your skills to earn a badge!</p>
                <button className="create-btn-primary" onClick={() => { setActiveQuiz(q); setCurrentQuestion(0); setScore(0); setFinished(false); }}>Start Quiz</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            {!finished ? (
              <>
                <h4>{activeQuiz.title} (Q{currentQuestion + 1}/{activeQuiz.questions.length})</h4>
                <p style={{ fontSize: '1.1rem', margin: '20px 0' }}>{activeQuiz.questions[currentQuestion].q}</p>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {activeQuiz.questions[currentQuestion].o.map(opt => (
                    <button key={opt} className="btn-small outline" style={{ padding: '15px', textAlign: 'left' }} onClick={() => handleAnswer(opt)}>{opt}</button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h3>🎉 Quiz Completed!</h3>
                <p style={{ fontSize: '1.5rem', color: '#48BB78', fontWeight: 'bold', margin: '20px 0' }}>Score: {score}</p>
                <p>Points added to your profile skill score.</p>
                <button className="btn-small outline" onClick={() => setActiveQuiz(null)}>Back to Quizzes</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const PortfolioSection = () => (<div className="animate-fade-in"><div className="header-row"><h3 className="section-title">Portfolio</h3><button className="btn-small outline" onClick={() => navigate('/upload-portfolio')}>Upload</button></div><div className="gigs-grid">{portfolio.map(item => (<div key={item.id} className="gig-card"><img src={item.description.split("|||")[0]} alt={item.title} className="gig-img" /><div className="gig-info"><h4>{item.title}</h4></div></div>))}</div></div>);

  return (
    <div className="dashboard-content">

      <div className="tab-content">
        {(activeTab === 'overview' || activeTab === 'dashboard') && <OverviewSection />}
        {activeTab === 'gigs' && <GigsSection />}
        {activeTab === 'work' && <FindWorkSection />}
        {activeTab === 'portfolio' && <PortfolioSection />}
        {activeTab === 'quizzes' && <QuizSection />}
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