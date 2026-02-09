import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ✅ SWITCH THIS TO YOUR RENDER URL
// Example: https://public-space-backend.onrender.com
const API_URL = " https://public-space-app.onrender.com";

function App() {
  const [posts, setPosts] = useState([]);
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState({});
  const [caption, setCaption] = useState("");

  // 1. Initial Load: Seed data or get User
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
  }, []);

  // 2. Fetch Status whenever userId changes
  useEffect(() => {
    if (userId) fetchStatus();
  }, [userId]);

  const fetchPosts = async () => {
    const res = await axios.get(`${API_URL}/api/posts`);
    setPosts(res.data);
  };

  const fetchStatus = async () => {
    const res = await axios.get(`${API_URL}/api/user-status/${userId}`);
    setStatus(res.data);
  };

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
    await axios.post(`${API_URL}/api/posts/${postId}/like`, { userId });
    fetchPosts();
  };

  const handleDelete = async (postId) => {
    await axios.delete(`${API_URL}/api/posts/${postId}`);
    fetchPosts();
    fetchStatus();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'Arial' }}>
      <h1>Public Space 📸</h1>
      
      {/* User Info Section */}
      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <p><strong>User:</strong> {status.name || "Loading..."}</p>
        <p><strong>Friends:</strong> {status.friendCount}</p>
        <p><strong>Posts Remaining Today:</strong> {status.remaining}</p>
      </div>

      {/* Create Post Section */}
      <div style={{ marginBottom: '30px' }}>
        <textarea 
          placeholder="What's on your mind?" 
          value={caption} 
          onChange={(e) => setCaption(e.target.value)}
          style={{ width: '100%', height: '60px', marginBottom: '10px' }}
        />
        <button onClick={handlePost} style={{ padding: '10px 20px', cursor: 'pointer' }}>Post Image</button>
      </div>

      {/* Feed Section */}
      <div>
        {posts.map(post => (
          <div key={post._id} style={{ border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>
            <img src={post.mediaUrl} alt="post" style={{ width: '100%' }} />
            <div style={{ padding: '15px' }}>
              <p><strong>{post.authorId?.name}:</strong> {post.caption}</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleLike(post._id)}>
                  ❤️ {post.likes?.length || 0}
                </button>
                <button onClick={() => handleDelete(post._id)} style={{ color: 'red' }}>
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