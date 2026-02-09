const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// --- 1. Schemas (The "Database Rules") ---
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  friends: [mongoose.Schema.Types.ObjectId] // Stores list of friends
}));

const Post = mongoose.model('Post', new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaUrl: String,
  caption: String,
  likes: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  comments: [{
    userName: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
}));

// --- 2. Middleware (The "Security Gate") ---
// This allows your Vercel frontend to talk to this Render backend
fastify.register(cors, { 
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
});

// ✅ CLOUD CONNECTION
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.pbadlee.mongodb.net/publicSpace?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => console.log('🚀 DATABASE CONNECTED: Full Logic Loaded'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// --- 3. API Routes ---

// Get User Status & Posting Limits
fastify.get('/api/user-status/:userId', async (request) => {
  const user = await User.findById(request.params.userId);
  if (!user) return { error: "User not found" };
  const postsToday = await Post.countDocuments({
    authorId: user._id,
    createdAt: { $gte: new Date().setHours(0,0,0,0) }
  });
  return { 
    name: user.name,
    friendCount: user.friends.length, 
    remaining: user.friends.length > 10 ? 'Unlimited' : Math.max(0, user.friends.length - postsToday) 
  };
});

// Get Global Feed
fastify.get('/api/posts', async () => {
  return await Post.find().populate('authorId', 'name').sort({ createdAt: -1 });
});

// Create Post with Logic (Check if user is allowed to post)
fastify.post('/api/posts', async (request, reply) => {
  try {
    const { userId, caption } = request.body;
    const user = await User.findById(userId);
    if (!user) return reply.status(404).send({ error: "User not found" });

    const postsToday = await Post.countDocuments({ 
      authorId: userId, 
      createdAt: { $gte: new Date().setHours(0,0,0,0) }
    });

    // Friendship Logic: Posts allowed = number of friends (if < 10)
    if (user.friends.length <= 10 && postsToday >= user.friends.length) {
      return reply.status(403).send({ error: "Daily limit reached! Add more friends." });
    }

    return await Post.create({
      authorId: userId,
      mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`, // Random placeholder image
      caption
    });
  } catch (err) { return reply.status(500).send({ error: "Server Error" }); }
});

// Like/Unlike Toggle
fastify.post('/api/posts/:id/like', async (request) => {
  const post = await Post.findById(request.params.id);
  const { userId } = request.body;
  post.likes.includes(userId) ? post.likes.pull(userId) : post.likes.push(userId);
  await post.save();
  return { success: true };
});

// Add Comment
fastify.post('/api/posts/:id/comment', async (request) => {
  const post = await Post.findById(request.params.id);
  post.comments.push(request.body); 
  await post.save();
  return { success: true };
});

// Delete Post
fastify.delete('/api/posts/:id', async (request, reply) => {
  try {
    await Post.findByIdAndDelete(request.params.id);
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: "Could not delete" });
  }
});

// Seed Initial Data (Crucial for testing)
fastify.get('/seed', async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  const user = await User.create({ 
    name: "Soham Patil", 
    friends: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()] // Starts with 2 friends
  });
  return { userId: user._id };
});

// --- 4. Listen ---
const PORT = process.env.PORT || 5000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`✅ Backend running on port ${PORT}`);
});