const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// --- 1. Middleware ---
fastify.register(cors, { origin: "*" });

// --- 2. Schemas ---
const User = mongoose.model('User', new mongoose.Schema({ name: String, friends: [mongoose.Schema.Types.ObjectId] }));
const Post = mongoose.model('Post', new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaUrl: String,
  caption: String,
  likes: { type: [mongoose.Schema.Types.ObjectId], default: [] }
}));

// --- 3. THE "BRUTE FORCE" CONNECTION ---
// We are using the direct shard links. This is the hardest connection for a firewall to block.
const MONGO_URI = 'mongodb://soham_admin:soham_admin123@ac-pbadlee-shard-00-00.pbadlee.mongodb.net:27017,ac-pbadlee-shard-00-01.pbadlee.mongodb.net:27017,ac-pbadlee-shard-00-02.pbadlee.mongodb.net:27017/publicSpace?ssl=true&replicaSet=atlas-m0p1z3-shard-0&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  family: 4 
})
.then(() => console.log('🚀 DATABASE CONNECTED: Handshake Successful'))
.catch(err => console.error('❌ CONNECTION ERROR:', err.message));

// --- 4. API Routes ---

// Health Check
fastify.get('/', async () => ({ 
  status: "Online", 
  db: mongoose.connection.readyState === 1 ? "Connected" : "Connecting..." 
}));

// Seed Route (Fixed: Wait for connection)
fastify.get('/seed', async (req, reply) => {
  if (mongoose.connection.readyState !== 1) {
    return reply.status(503).send({ error: "Database not ready. Refresh in 5 seconds." });
  }
  try {
    await User.deleteMany({});
    const user = await User.create({ name: "Soham Patil", friends: [new mongoose.Types.ObjectId()] });
    return { status: "Success", userId: user._id };
  } catch (e) { return reply.status(500).send({ error: e.message }); }
});

fastify.get('/api/posts', async () => Post.find().populate('authorId', 'name'));

fastify.post('/api/posts', async (req) => {
  return Post.create({
    authorId: req.body.userId,
    mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
    caption: req.body.caption
  });
});

// --- 5. Start ---
const PORT = process.env.PORT || 5000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { console.log(err); process.exit(1); }
  console.log(`✅ Backend listening on port ${PORT}`);
});