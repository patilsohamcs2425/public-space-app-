const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// --- 1. Middleware ---
fastify.register(cors, { origin: "*" });

// --- 2. Schemas (All Features Preserved) ---
const User = mongoose.model('User', new mongoose.Schema({ 
  name: String, 
  friends: [mongoose.Schema.Types.ObjectId] 
}));

const Post = mongoose.model('Post', new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaUrl: String,
  caption: String,
  likes: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  createdAt: { type: Date, default: Date.now }
}));

// --- 3. The Stable Connection ---
// This uses the direct shard links to bypass Render's connection issues
const MONGO_URI = 'mongodb://soham_admin:soham_admin123@ac-pbadlee-shard-00-00.pbadlee.mongodb.net:27017,ac-pbadlee-shard-00-01.pbadlee.mongodb.net:27017,ac-pbadlee-shard-00-02.pbadlee.mongodb.net:27017/publicSpace?ssl=true&replicaSet=atlas-m0p1z3-shard-0&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => console.log('🚀 DATABASE CONNECTED SUCCESSFULLY!'))
  .catch(err => console.error('❌ MONGODB ERROR:', err.message));

// --- 4. All Website Functions ---

// Home route to check if server is awake
fastify.get('/', async () => ({ status: "Public Space API is Live", db: mongoose.connection.readyState === 1 ? "Connected" : "Error" }));

// Seed route to reset your data for the demo
fastify.get('/seed', async (req, reply) => {
  try {
    await User.deleteMany({});
    await Post.deleteMany({});
    const user = await User.create({ 
      name: "Soham Patil", 
      friends: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()] 
    });
    return { status: "Project Reset Successful!", userId: user._id };
  } catch (e) { return reply.status(500).send({ error: e.message }); }
});

// Get User Status (Name, Friends, and Post Limits)
fastify.get('/api/user-status/:userId', async (request) => {
  const user = await User.findById(request.params.userId);
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

// Post Logic (Includes Daily Limit based on Friends)
fastify.post('/api/posts', async (request, reply) => {
  const { userId, caption } = request.body;
  const user = await User.findById(userId);
  const postsToday = await Post.countDocuments({ authorId: userId, createdAt: { $gte: new Date().setHours(0,0,0,0) }});

  if (user.friends.length <= 10 && postsToday >= user.friends.length) {
    return reply.status(403).send({ error: "Daily limit reached! Add more friends to post more." });
  }

  return await Post.create({
    authorId: userId,
    mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
    caption
  });
});

// Feed Logic
fastify.get('/api/posts', async () => await Post.find().populate('authorId', 'name').sort({ createdAt: -1 }));

// --- 5. Start Server ---
const PORT = process.env.PORT || 10000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { console.log(err); process.exit(1); }
  console.log(`✅ Server is live on port ${PORT}`);
});