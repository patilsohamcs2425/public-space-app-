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

// --- 3. Database Connection (Standard Driver Format) ---
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.pbadlee.mongodb.net/publicSpace?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('🚀 DATABASE CONNECTED SUCCESSFULLY'))
  .catch(err => console.error('❌ CONNECTION ERROR:', err.message));

// --- 4. API Routes ---

// Root Route - Proves server is ALIVE
fastify.get('/', async () => {
  return { 
    message: "Public Space API is Live!", 
    dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Connecting..." 
  };
});

// Seed Route - Creates the first user
fastify.get('/seed', async (request, reply) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return reply.status(503).send({ error: "Database not ready. Wait 5 seconds and refresh." });
    }
    await User.deleteMany({});
    const user = await User.create({ 
      name: "Soham Patil", 
      friends: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()] 
    });
    return { status: "Seeded!", userId: user._id };
  } catch (e) { 
    return reply.status(500).send({ error: e.message }); 
  }
});

fastify.get('/api/posts', async () => await Post.find().populate('authorId', 'name').sort({ createdAt: -1 }));

fastify.post('/api/posts', async (request) => {
  const { userId, caption } = request.body;
  return await Post.create({
    authorId: userId,
    mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
    caption
  });
});

// --- 5. Start Server ---
const PORT = process.env.PORT || 5000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`✅ Backend listening on port ${PORT}`);
});