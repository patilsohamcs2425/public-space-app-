import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ✅ Your live backend URL
const API_URL = "https://public-space-app.onrender.com";

function App() {
  const [posts, setPosts] = useState([]);
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState({ name: "Loading...", remaining: "..." });
  const [caption, setCaption] = useState("");

  // 1. Function to fetch user details and limits
  const fetchStatus = useCallback(async (id) => {
    try {
      const res = await axios.get(`${API_URL}/api/user-status/${id}`);
      setStatus(res.data);
    } catch (err) {
      console.error("Status check failed", err);
    }
  }, []);

  // 2. Function to fetch the post feed
  const fetchPosts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Feed fetch failed", err);
    }
  }, []);

  // 3. Initial Setup: Seed the database and get your User ID
  useEffect(() => {
    const initApp = async () => {
      try {
        const res = await axios.get(`${API_URL}/seed`);
        const id = res.data.userId;
        setUserId(id);
        fetchStatus(id);
        fetchPosts();
      } catch (err) {
        console.error("Initial connection failed", err);
      }
    };
    initApp();
  }, [fetchPosts, fetchStatus]);

  // 4. Create a new post
  const handlePost = async () => {
    if (!caption.trim()) return;
    try {
      await axios.post(`${API_URL}/api/posts`, { userId, caption });
      setCaption("");
      fetchPosts();
      fetchStatus(userId);
    } catch (err) {
      alert(err.response?.data?.error || "Post failed");
    }
  };

  // 5. Like a post
  const handleLike = async (postId) => {
    try {
      await axios.post(`${API_URL}/api/posts/${postId}/like`, { userId });
      fetchPosts();
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  // 6. Delete a post
  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${API_URL}/api/posts/${postId}`);
      fetchPosts();
      fetchStatus(userId);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'Arial' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>Public Space 📸</h1>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #ddd' }}>
          <p><strong>Welcome:</strong> {status.name}</p>
          <p><strong>Remaining Posts:</strong> {status.remaining}</p>
        </div>
      </header>
      
      <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea 
          placeholder="What's happening?" 
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
          <div key={post._id} style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <img src={post.mediaUrl} alt="Post" style={{ width: '100%' }} />
            <div style={{ padding: '15px' }}>
              <p><strong>{post.authorId?.name}:</strong> {post.caption}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => handleLike(post._id)} style={{ cursor: 'pointer' }}>
                  ❤️ {post.likes?.length || 0}
                </button>
                <button onClick={() => handleDelete(post._id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
                  Delete
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