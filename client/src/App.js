import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// UPDATE THIS with your actual Render backend URL
const API_URL = " https://public-space-app.onrender.com";

function App() {
  const [posts, setPosts] = useState([]);
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState({});
  const [caption, setCaption] = useState("");

  // 1. Fetch Posts (Wrapped in useCallback to avoid ESLint errors)
  const fetchPosts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Fetch Posts Error:", err);
    }
  }, []);

  // 2. Fetch Status (Wrapped in useCallback to avoid ESLint errors)
  const fetchStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_URL}/api/user-status/${userId}`);
      setStatus(res.data);
    } catch (err) {
      console.error("Fetch Status Error:", err);
    }
  }, [userId]);

  // 3. Initial Load: Seed data or get User
  useEffect(() => {
    const initApp = async () => {
      try {
        const res = await axios.get(`${API_URL}/seed`);
        setUserId(res.data.userId);
        fetchPosts();
      } catch (err) {
        console.error("Connection Error:", err);
      }
    };
    initApp();
  }, [fetchPosts]);

  // 4. Fetch Status whenever userId changes
  useEffect(() => {
    if (userId) fetchStatus();
  }, [userId, fetchStatus]); // ✅ fetchStatus added as dependency

  const handlePost = async () => {
    try {
      await axios.post(`${API_URL}/api/posts`, { userId, caption });
      setCaption("");
      fetchPosts();
      fetchStatus();
    } catch (err) {
      alert(err.response?.data?.error || "Error posting");
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${API_URL}/api/posts/${postId}/like`, { userId });
      fetchPosts();
    } catch (err) {
      console.error("Like Error:", err);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${API_URL}/api/posts/${postId}`);
      fetchPosts();
      fetchStatus();
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'Arial' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>Public Space 📸</h1>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
          <p><strong>Welcome:</strong> {status.name || "Loading..."}</p>
          <p><strong>Friends:</strong> {status.friendCount || 0}</p>
          <p><strong>Daily Limit:</strong> {status.remaining ?? '...'}</p>
        </div>
      </header>
      
      <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea 
          placeholder="Share something with the world..." 
          value={caption} 
          onChange={(e) => setCaption(e.target.value)}
          style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={handlePost} 
          style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Post to Public Space
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {posts.map(post => (
          <div key={post._id} style={{ border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <img src={post.mediaUrl} alt="User post" style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: '15px' }}>
              <p style={{ margin: '0 0 10px 0' }}><strong>{post.authorId?.name}:</strong> {post.caption}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={() => handleLike(post._id)}
                  style={{ background: '#fff0f0', border: '1px solid #ffc1c1', borderRadius: '20px', padding: '5px 15px', cursor: 'pointer' }}
                >
                  ❤️ {post.likes?.length || 0}
                </button>
                <button 
                  onClick={() => handleDelete(post._id)} 
                  style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '14px' }}
                >
                  Delete Post
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;