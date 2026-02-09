const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// --- 1. Middleware ---
fastify.register(cors, { origin: "*" });

// --- 2. Schemas (Full Logic Preserved) ---
const User = mongoose.model('User', new mongoose.Schema({ name: String, friends: [mongoose.Schema.Types.ObjectId] }));
const Post = mongoose.model('Post', new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaUrl: String,
  caption: String,
  likes: { type: [mongoose.Schema.Types.ObjectId], default: [] }
}));

// --- 3. THE CORRECTED CONNECTION STRING ---
// ✅ Using your verified hostname: r3hqnt8
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.r3hqnt8.mongodb.net/publicSpace?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  family: 4 
})
  .then(() => console.log('🚀 DATABASE CONNECTED SUCCESSFULLY!'))
  .catch(err => console.error('❌ MONGODB ERROR:', err.message));

// --- 4. API Routes ---

// Health Check
fastify.get('/', async () => ({ 
  message: "Soham Patil's Public Space API is Live!", 
  dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Error" 
}));

// Seed Route (Initializes the app)
fastify.get('/seed', async (request, reply) => {
  if (mongoose.connection.readyState !== 1) {
    return reply.status(503).send({ error: "Database not connected yet. Please refresh." });
  }
  try {
    await User.deleteMany({});
    await Post.deleteMany({});
    const user = await User.create({ name: "Soham Patil", friends: [new mongoose.Types.ObjectId()] });
    return { status: "Seeded!", userId: user._id };
  } catch (e) { return reply.status(500).send({ error: e.message }); }
});

// Post Logic
fastify.post('/api/posts', async (request) => {
  const { userId, caption } = request.body;
  return await Post.create({
    authorId: userId,
    mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
    caption
  });
});

// Feed Logic
fastify.get('/api/posts', async () => await Post.find().populate('authorId', 'name'));

// --- 5. Start Server ---
const PORT = process.env.PORT || 10000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { console.log(err); process.exit(1); }
});