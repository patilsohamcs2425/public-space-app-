import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:10000";

function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  
  // Form States
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [resetInput, setResetInput] = useState('');
  
  // Dashboard States
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState("");
  const [limits, setLimits] = useState({ remaining: 0 });
  const [commentInputs, setCommentInputs] = useState({});

  // --- ACTIONS ---
  const handleRegister = async () => {
    try {
      await axios.post(`${API_URL}/api/register`, formData);
      alert("Account Created! Please Login.");
      setView('login');
    } catch (err) { alert(err.response?.data?.error || "Registration failed"); }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/login`, { email: formData.email, password: formData.password });
      setUser(res.data);
      setView('dashboard');
      loadDashboard(res.data.userId);
    } catch (err) { alert("Invalid Credentials"); }
  };

  const handleForgot = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/forgot-password`, { identifier: resetInput });
      alert(`✅ Reset Success! New Password: ${res.data.newPassword}`);
      setView('login');
    } catch (err) { alert(err.response?.data?.error || "Error"); }
  };

  const loadDashboard = async (userId) => {
    const status = await axios.get(`${API_URL}/api/user-status/${userId}`);
    setLimits(status.data);
    const feed = await axios.get(`${API_URL}/api/posts`);
    setPosts(feed.data);
  };

  const handlePost = async () => {
    if (!caption.trim()) return;
    await axios.post(`${API_URL}/api/posts`, { userId: user.userId, caption });
    setCaption("");
    loadDashboard(user.userId);
  };

  const handleLike = async (postId) => {
    await axios.post(`${API_URL}/api/posts/${postId}/like`, { userId: user.userId });
    loadDashboard(user.userId);
  };

  const handleDelete = async (postId) => {
    if(!window.confirm("Delete this post?")) return;
    await axios.delete(`${API_URL}/api/posts/${postId}`);
    loadDashboard(user.userId);
  };

  const handleComment = async (postId) => {
    const text = commentInputs[postId];
    if(!text) return;
    await axios.post(`${API_URL}/api/posts/${postId}/comment`, { text, userName: user.name });
    setCommentInputs({...commentInputs, [postId]: ''});
    loadDashboard(user.userId);
  };

  // --- STYLES ---
  const styles = {
    container: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', background: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    authCard: { background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '350px', marginTop: '50px', textAlign: 'center' },
    input: { width: '100%', padding: '12px', margin: '8px 0', border: '1px solid #dbdbdb', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', background: '#fafafa' },
    btnPrimary: { width: '100%', padding: '12px', background: '#0095f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    btnSecondary: { background: 'none', border: 'none', color: '#0095f6', cursor: 'pointer', fontWeight: '600', fontSize: '12px' },
    nav: { width: '100%', background: 'white', borderBottom: '1px solid #dbdbdb', padding: '15px 0', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'center' },
    navContent: { width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' },
    feed: { width: '100%', maxWidth: '600px', padding: '20px 0' },
    postCard: { background: 'white', border: '1px solid #dbdbdb', borderRadius: '8px', marginBottom: '24px' },
    postHeader: { padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    avatar: { width: '32px', height: '32px', borderRadius: '50%', marginRight: '10px', background: '#ddd' },
    postImage: { width: '100%', display: 'block' },
    postActions: { padding: '12px' },
    commentSection: { borderTop: '1px solid #efefef', padding: '10px', background: '#fafafa' },
    limitBadge: { background: '#efefef', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: '#555' }
  };

  // --- RENDER ---
  return (
    <div style={styles.container}>
      
      {/* 1. LOGIN VIEW */}
      {view === 'login' && (
        <div style={styles.authCard}>
          <h1 style={{fontSize:'24px', margin:'0 0 20px 0'}}>Public Space</h1>
          <input placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} style={styles.input} />
          <input placeholder="Password" type="password" onChange={e => setFormData({...formData, password: e.target.value})} style={styles.input} />
          <button onClick={handleLogin} style={styles.btnPrimary}>Log In</button>
          
          <div style={{marginTop:'20px', display:'flex', justifyContent:'space-between'}}>
             <button onClick={() => setView('forgot')} style={{...styles.btnSecondary, color:'red'}}>Forgot Password?</button>
             <button onClick={() => setView('register')} style={styles.btnSecondary}>Sign Up</button>
          </div>
        </div>
      )}

      {/* 2. REGISTER VIEW */}
      {view === 'register' && (
        <div style={styles.authCard}>
          <h2 style={{fontSize:'20px'}}>Create Account</h2>
          <input placeholder="Full Name" onChange={e => setFormData({...formData, name: e.target.value})} style={styles.input} />
          <input placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} style={styles.input} />
          <input placeholder="Phone" onChange={e => setFormData({...formData, phone: e.target.value})} style={styles.input} />
          <input placeholder="Password" type="password" onChange={e => setFormData({...formData, password: e.target.value})} style={styles.input} />
          <button onClick={handleRegister} style={{...styles.btnPrimary, background:'#000'}}>Sign Up</button>
          <p onClick={() => setView('login')} style={{marginTop:'15px', cursor:'pointer', color:'#0095f6', fontSize:'14px'}}>Back to Login</p>
        </div>
      )}

      {/* 3. FORGOT PASSWORD VIEW */}
      {view === 'forgot' && (
        <div style={styles.authCard}>
          <h3>Trouble logging in?</h3>
          <p style={{fontSize:'14px', color:'#8e8e8e', marginBottom:'20px'}}>Enter your email or phone and we'll send you a new password.</p>
          <input placeholder="Email or Phone" value={resetInput} onChange={e => setResetInput(e.target.value)} style={styles.input} />
          <button onClick={handleForgot} style={{...styles.btnPrimary, background:'#ff9800'}}>Reset Password</button>
          <p onClick={() => setView('login')} style={{marginTop:'20px', cursor:'pointer', color:'#000', fontWeight:'bold', fontSize:'14px'}}>Back to Login</p>
        </div>
      )}

      {/* 4. DASHBOARD VIEW */}
      {view === 'dashboard' && user && (
        <>
          {/* Navbar */}
          <div style={styles.nav}>
            <div style={styles.navContent}>
              <h2 style={{margin:0, fontSize:'20px'}}>Public Space</h2>
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <span style={styles.limitBadge}>Posts Left: {limits.remaining}</span>
                <button onClick={() => setView('login')} style={{background:'none', border:'none', cursor:'pointer', fontSize:'20px'}}>🚪</button>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div style={styles.feed}>
            
            {/* Create Post Input */}
            <div style={{...styles.postCard, padding:'15px', display:'flex', gap:'10px'}}>
               <div style={{...styles.avatar, background:'#000'}}></div>
               <div style={{flex:1}}>
                 <textarea 
                    placeholder={`What's on your mind, ${user.name}?`} 
                    value={caption} 
                    onChange={e => setCaption(e.target.value)}
                    style={{width:'100%', border:'none', outline:'none', resize:'none', fontSize:'14px', fontFamily:'inherit'}}
                  />
                  <div style={{textAlign:'right', marginTop:'10px'}}>
                    <button 
                      onClick={handlePost} 
                      disabled={limits.remaining <= 0}
                      style={{...styles.btnPrimary, width:'auto', padding:'8px 16px', marginTop:0, opacity: limits.remaining > 0 ? 1 : 0.5}}
                    >
                      {limits.remaining > 0 ? "Post" : "Limit Reached"}
                    </button>
                  </div>
               </div>
            </div>

            {/* Posts List */}
            {posts.map(p => (
              <div key={p._id} style={styles.postCard}>
                {/* Header */}
                <div style={styles.postHeader}>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <img src={`https://ui-avatars.com/api/?name=${p.authorId?.name}&background=random`} alt="avatar" style={styles.avatar} />
                    <span style={{fontWeight:'bold', fontSize:'14px'}}>{p.authorId?.name}</span>
                  </div>
                  <button onClick={() => handleDelete(p._id)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'18px'}}>🗑️</button>
                </div>

                {/* Image */}
                <img src={p.mediaUrl} alt="post" style={styles.postImage} />

                {/* Actions & Caption */}
                <div style={styles.postActions}>
                  <div style={{display:'flex', gap:'15px', marginBottom:'10px'}}>
                    <button onClick={() => handleLike(p._id)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'22px'}}>
                      {/* Only simple like logic for now */}
                      ❤️ <span style={{fontSize:'14px', fontWeight:'bold', color:'#333'}}>{p.likes.length} likes</span>
                    </button>
                    <button style={{background:'none', border:'none', cursor:'pointer', fontSize:'22px'}}>💬</button>
                  </div>
                  <p style={{margin:'0 0 10px 0', fontSize:'14px'}}>
                    <span style={{fontWeight:'bold', marginRight:'5px'}}>{p.authorId?.name}</span>
                    {p.caption}
                  </p>
                </div>

                {/* Comments */}
                <div style={styles.commentSection}>
                   {p.comments.map((c, i) => (
                     <div key={i} style={{fontSize:'13px', marginBottom:'4px'}}>
                       <span style={{fontWeight:'bold'}}>{c.author}: </span>{c.text}
                     </div>
                   ))}
                   <div style={{display:'flex', marginTop:'10px'}}>
                     <input 
                       placeholder="Add a comment..." 
                       value={commentInputs[p._id] || ''}
                       onChange={e => setCommentInputs({...commentInputs, [p._id]: e.target.value})}
                       style={{flex:1, border:'none', background:'none', outline:'none', fontSize:'13px'}}
                     />
                     <button 
                       onClick={() => handleComment(p._id)} 
                       style={{border:'none', background:'none', color:'#0095f6', fontWeight:'bold', cursor:'pointer', fontSize:'13px'}}
                     >Post</button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;