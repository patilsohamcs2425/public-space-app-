import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PublicSpace = () => {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState({ friendCount: 0, remaining: 0 });
  const [commentText, setCommentText] = useState({});

  
  const TEST_USER_ID = "6984a52f54fd92e3bbbacb5c"; 

  const loadData = async () => {
    if (TEST_USER_ID.includes("PASTE")) return;
    try {
      const p = await axios.get('http://localhost:5000/api/posts');
      const s = await axios.get(`http://localhost:5000/api/user-status/${TEST_USER_ID}`);
      setPosts(p.data);
      setStatus(s.data);
    } catch (e) { console.error("Sync Error:", e); }
  };

  useEffect(() => { loadData(); }, []);

  const handlePost = async () => {
    await axios.post('http://localhost:5000/api/posts', { userId: TEST_USER_ID, caption });
    setCaption('');
    loadData();
  };

  const handleLike = async (id) => {
    await axios.post(`http://localhost:5000/api/posts/${id}/like`, { userId: TEST_USER_ID });
    loadData();
  };

  const handleComment = async (id) => {
    await axios.post(`http://localhost:5000/api/posts/${id}/comment`, { userName: status.name || "User", text: commentText[id] });
    setCommentText({ ...commentText, [id]: '' });
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      // THE FIX IS THE URL BELOW
      await axios.delete(`http://localhost:5000/api/posts/${id}`);
      loadData();
    } catch (err) {
      alert("Delete failed. Check server console.");
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: 'auto', background: '#fdfdfd', minHeight: '100vh', fontFamily: 'Arial' }}>
      <header style={{ padding: '20px', background: '#fff', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: '#1877f2' }}>Public Space</h2>
        <p>Friends: {status.friendCount} | Limits: {status.remaining}</p>
      </header>

      <div style={{ padding: '15px', background: '#fff', borderBottom: '1px solid #ddd' }}>
        <textarea placeholder="Write something..." value={caption} onChange={e => setCaption(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', minHeight: '50px' }} />
        <button onClick={handlePost} style={{ width: '100%', padding: '10px', background: '#1877f2', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Post Now</button>
      </div>

      {posts.map(post => (
        <div key={post._id} style={{ background: '#fff', border: '1px solid #ddd', marginTop: '15px', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            {post.authorId?.name || "User"}
            <button onClick={() => handleDelete(post._id)} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer' }}>✕</button>
          </div>
          <img src={post.mediaUrl} width="100%" alt="feed" />
          <div style={{ padding: '12px' }}>
            <button onClick={() => handleLike(post._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>
              {post.likes.includes(TEST_USER_ID) ? '❤️' : '🤍'} {post.likes.length}
            </button>
            <p style={{ margin: '8px 0' }}>{post.caption}</p>
            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
              {post.comments.map((c, i) => (
                <div key={i} style={{ fontSize: '13px' }}><strong>{c.userName}</strong>: {c.text}</div>
              ))}
              <div style={{ display: 'flex', marginTop: '10px' }}>
                <input placeholder="Comment..." value={commentText[post._id] || ''} onChange={e => setCommentText({...commentText, [post._id]: e.target.value})} style={{ flex: 1, border: 'none', borderBottom: '1px solid #eee' }} />
                <button onClick={() => handleComment(post._id)} style={{ border: 'none', background: 'none', color: '#1877f2', fontWeight: 'bold' }}>Send</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PublicSpace;