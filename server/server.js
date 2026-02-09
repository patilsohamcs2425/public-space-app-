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

// --- 3. THE "FORCE CONNECT" STRING ---
// Using your exact credentials and adding the database name 'publicSpace'
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.pbadlee.mongodb.net/publicSpace?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  dbName: 'publicSpace', // ✅ Specific DB name to prevent auto-selection errors
  connectTimeoutMS: 30000, // ✅ 30 seconds to survive Render's slow startup
  serverSelectionTimeoutMS: 30000,
  family: 4 
})
  .then(() => console.log('🚀 100% SUCCESS: DATABASE CONNECTED'))
  .catch(err => console.error('❌ MONGODB ERROR:', err.message));

// --- 4. API Routes ---

// Proof of life route
fastify.get('/', async () => ({ 
  message: "Soham Patil's Public Space API is Live!", 
  dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Error" 
}));

// Seed Route (Wait for DB)
fastify.get('/seed', async (req, reply) => {
  if (mongoose.connection.readyState !== 1) {
    return reply.status(503).send({ error: "DB Connecting... refresh in 10 seconds" });
  }
  try {
    await User.deleteMany({});
    const user = await User.create({ name: "Soham Patil", friends: [new mongoose.Types.ObjectId()] });
    return { status: "Seeded Successfully!", userId: user._id };
  } catch (e) { return reply.status(500).send({ error: e.message }); }
});

fastify.get('/api/posts', async () => Post.find().populate('authorId', 'name'));

// --- 5. Listen ---
const PORT = process.env.PORT || 10000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { console.log(err); process.exit(1); }
});