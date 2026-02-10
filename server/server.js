const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// --- 1. Middleware (Crucial for Vercel) ---
fastify.register(cors, { 
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
});

// --- 2. Schemas ---
const User = mongoose.model('User', new mongoose.Schema({ 
  name: String, 
  friends: [mongoose.Schema.Types.ObjectId] 
}));

const Post = mongoose.model('Post', new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaUrl: String,
  caption: String,
  likes: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
}));

// --- 3. Database Connection ---
// ✅ Using your verified cluster: r3hqnt8
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.r3hqnt8.mongodb.net/publicSpace?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => console.log('🚀 DATABASE CONNECTED SUCCESSFULLY'))
  .catch(err => console.error('❌ MONGODB ERROR:', err.message));

// --- 4. API Routes ---

// ✅ ROOT ROUTE (ONLY ONE ALLOWED)
fastify.get('/', async () => {
  return { 
    status: "Public Space API is Live", 
    message: "Soham Patil's Final Internship Project",
    dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Connecting..." 
  };
});

// ✅ SEED ROUTE (Resets DB for demo)
fastify.get('/seed', async (request, reply) => {
  try {
    await User.deleteMany({});
    await Post.deleteMany({});
    
    // Create User
    const user = await User.create({ 
      name: "Soham Patil", 
      friends: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()] 
    });
    
    // Create Initial Post
    await Post.create({
      authorId: user._id,
      mediaUrl: "https://picsum.photos/seed/public/600/400",
      caption: "Welcome to the Public Space! Project Finalized."
    });

    return { userId: user._id, status: "Seeded" };
  } catch (e) {
    return reply.status(500).send({ error: e.message });
  }
});

// ✅ USER STATUS (Fixes 404 on frontend)
fastify.get('/api/user-status/:userId', async (request, reply) => {
  try {
    const user = await User.findById(request.params.userId);
    if (!user) return reply.status(404).send({ error: "User not found" });

    const postsToday = await Post.countDocuments({
      authorId: user._id,
      createdAt: { $gte: new Date().setHours(0,0,0,0) }
    });

    return { 
      name: user.name, 
      friends: user.friends.length,
      remaining: Math.max(0, user.friends.length - postsToday) 
    };
  } catch (err) {
    return reply.status(500).send({ error: "Server Error" });
  }
});

// ✅ GET POSTS
fastify.get('/api/posts', async () => {
  return await Post.find().populate('authorId', 'name').sort({ createdAt: -1 });
});

// ✅ CREATE POST
fastify.post('/api/posts', async (request) => {
  const { userId, caption } = request.body;
  return await Post.create({
    authorId: userId,
    mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
    caption
  });
});

// ✅ LIKE POST
fastify.post('/api/posts/:id/like', async (request) => {
  const post = await Post.findById(request.params.id);
  const { userId } = request.body;
  
  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(id => id !== userId);
  } else {
    post.likes.push(userId);
  }
  
  await post.save();
  return { success: true };
});

// ✅ DELETE POST
fastify.delete('/api/posts/:id', async (request) => {
  await Post.findByIdAndDelete(request.params.id);
  return { success: true };
});

// --- 5. Start Server ---
const PORT = process.env.PORT || 10000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`✅ Server listening on port ${PORT}`);
});