import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ✅ YOUR LIVE RENDER URL
const API_URL = "https://public-space-app.onrender.com";

function App() {
  const [posts, setPosts] = useState([]);
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState({ name: "Loading...", remaining: "..." });
  const [caption, setCaption] = useState("");

  // 1. Fetch Posts Logic
  const fetchPosts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Fetch Posts Error:", err);
    }
  }, []);

  // 2. Fetch User Status Logic
  const fetchStatus = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${API_URL}/api/user-status/${id}`);
      setStatus(res.data);
    } catch (err) {
      console.error("Fetch Status Error:", err);
    }
  }, []);

  // 3. Initial App Setup (Seeding and Getting User)
  useEffect(() => {
    const initApp = async () => {
      try {
        // Connect to backend and get/create user
        const res = await axios.get(`${API_URL}/seed`);
        const newUserId = res.data.userId;
        setUserId(newUserId);
        
        // Load initial content
        fetchPosts();
        fetchStatus(newUserId);
      } catch (err) {
        console.error("Connection Error:", err);
        alert("Server is starting up. Please refresh in 30 seconds.");
      }
    };
    initApp();
  }, [fetchPosts, fetchStatus]);

  // 4. Handle Creating a New Post
  const handlePost = async () => {
    if (!caption.trim()) return;
    try {
      await axios.post(`${API_URL}/api/posts`, { userId, caption });
      setCaption("");
      fetchPosts();
      fetchStatus(userId);
    } catch (err) {
      alert(err.response?.data?.error || "Error creating post");
    }
  };

  // 5. Handle Liking a Post
  const handleLike = async (postId) => {
    try {
      await axios.post(`${API_URL}/api/posts/${postId}/like`, { userId });
      fetchPosts(); // Refresh to update like count
    } catch (err) {
      console.error("Like Error:", err);
    }
  };

  // 6. Handle Deleting a Post
  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${API_URL}/api/posts/${postId}`);
      fetchPosts(); // Refresh to remove from UI
      fetchStatus(userId); // Refresh limit count
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>Public Space 📸</h1>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
          <p><strong>Welcome:</strong> {status.name}</p>
          <p><strong>Daily Limit:</strong> {status.remaining}</p>
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
            <img src={post.mediaUrl} alt="User content" style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: '15px' }}>
              <p style={{ margin: '0 0 10px 0' }}><strong>{post.authorId?.name || 'User'}:</strong> {post.caption}</p>
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
        {posts.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>No posts yet. Be the first!</p>}
      </div>
    </div>
  );
}

export default App;