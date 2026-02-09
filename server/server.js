const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// --- 1. Middleware ---
fastify.register(cors, { origin: "*" });

// --- 2. Schemas ---
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

// --- 3. The "Standard Driver" Connection ---
// This format is required for Render to bypass internal DNS shielding
const MONGO_URI = 'mongodb://soham_admin:soham_admin123@ac-pbadlee-shard-00-00.pbadlee.mongodb.net:27017,ac-pbadlee-shard-00-01.pbadlee.mongodb.net:27017,ac-pbadlee-shard-00-02.pbadlee.mongodb.net:27017/publicSpace?ssl=true&replicaSet=atlas-m0p1z3-shard-0&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000, 
  connectTimeoutMS: 10000,
  family: 4 
})
  .then(() => console.log('🚀 DATABASE CONNECTED SUCCESSFULLY!'))
  .catch(err => console.error('❌ MONGODB ERROR:', err.message));

// --- 4. API Routes ---

fastify.get('/', async () => ({ 
  status: "Public Space API is Live", 
  db: mongoose.connection.readyState === 1 ? "Connected" : "Error" 
}));

fastify.get('/seed', async (req, reply) => {
  // Wait for connection before running the seed
  if (mongoose.connection.readyState !== 1) {
    return reply.status(503).send({ error: "Database not connected. Please refresh in 10 seconds." });
  }
  try {
    await User.deleteMany({});
    await Post.deleteMany({});
    const user = await User.create({ 
      name: "Soham Patil", 
      friends: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()] 
    });
    return { status: "Project Seeded!", userId: user._id };
  } catch (e) { return reply.status(500).send({ error: e.message }); }
});

fastify.get('/api/user-status/:userId', async (req) => {
  const user = await User.findById(req.params.userId);
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

fastify.get('/api/posts', async () => await Post.find().populate('authorId', 'name').sort({ createdAt: -1 }));

fastify.post('/api/posts', async (req) => {
  return await Post.create({
    authorId: req.body.userId,
    mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
    caption: req.body.caption
  });
});

// --- 5. Start ---
const PORT = process.env.PORT || 10000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { console.log(err); process.exit(1); }
});