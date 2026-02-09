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

// --- 3. Database Connection ---
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.pbadlee.mongodb.net/publicSpace?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => console.log('🚀 DATABASE CONNECTED SUCCESSFULLY'))
  .catch(err => console.error('❌ CONNECTION ERROR:', err.message));

// --- 4. API Routes ---

// ✅ FIX FOR THE 404: Adding the root route
fastify.get('/', async () => {
  return { 
    message: "Public Space API is Live!", 
    database: mongoose.connection.readyState === 1 ? "Connected" : "Connecting..." 
  };
});

// Seed Route
fastify.get('/seed', async (req, reply) => {
  try {
    await User.deleteMany({});
    const user = await User.create({ name: "Soham Patil", friends: [new mongoose.Types.ObjectId()] });
    return { status: "Seeded!", userId: user._id };
  } catch (e) { return reply.status(500).send({ error: e.message }); }
});

fastify.get('/api/posts', async () => await Post.find().populate('authorId', 'name'));

fastify.post('/api/posts', async (req) => {
  return await Post.create({
    authorId: req.body.userId,
    mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
    caption: req.body.caption
  });
});

// --- 5. Start Server ---
const PORT = process.env.PORT || 5000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { console.log(err); process.exit(1); }
  console.log(`✅ Backend listening on port ${PORT}`);
});