const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// --- 1. Schemas ---
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  friends: [mongoose.Schema.Types.ObjectId]
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

// --- 2. Setup (CRITICAL FIX FOR DELETE ERROR) ---
fastify.register(cors, { 
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"], // MUST include DELETE here
  allowedHeaders: ["Content-Type"]
});

mongoose.connect('mongodb://127.0.0.1:27017/publicSpace')
  .then(() => console.log(' MongoDB Connected'))
  .catch(err => console.error(' Connection Error:', err));

// --- 3. API Routes ---

// Get Status
fastify.get('/api/user-status/:userId', async (request) => {
  const user = await User.findById(request.params.userId);
  if (!user) return { error: "Not found" };
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

// Feed
fastify.get('/api/posts', async () => {
  return await Post.find().populate('authorId', 'name').sort({ createdAt: -1 });
});

// Post with Logic
fastify.post('/api/posts', async (request, reply) => {
  try {
    const { userId, caption } = request.body;
    const user = await User.findById(userId);
    const postsToday = await Post.countDocuments({ authorId: userId, createdAt: { $gte: new Date().setHours(0,0,0,0) }});

    if (user.friends.length <= 10 && postsToday >= user.friends.length) {
      return reply.status(403).send({ error: "Daily limit reached!" });
    }

    return await Post.create({
      authorId: userId,
      mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
      caption
    });
  } catch (err) { return reply.status(500).send({ error: "Server Error" }); }
});

// Like Toggle
fastify.post('/api/posts/:id/like', async (request) => {
  const post = await Post.findById(request.params.id);
  const { userId } = request.body;
  post.likes.includes(userId) ? post.likes.pull(userId) : post.likes.push(userId);
  await post.save();
  return { success: true };
});

// Comment
fastify.post('/api/posts/:id/comment', async (request) => {
  const post = await Post.findById(request.params.id);
  post.comments.push(request.body); 
  await post.save();
  return { success: true };
});

// Delete (The route causing the Network Error)
fastify.delete('/api/posts/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    await Post.findByIdAndDelete(id);
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: "Could not delete" });
  }
});

// Seed
fastify.get('/seed', async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  const user = await User.create({ name: "Soham Patil", friends: Array(3).fill(new mongoose.Types.ObjectId()) });
  return { userId: user._id };
});

fastify.listen({ port: 5000 });