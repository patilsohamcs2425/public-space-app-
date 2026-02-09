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

// --- 2. Setup ---
fastify.register(cors, { 
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
});

// ✅ UPDATED WITH YOUR CREDENTIALS
// Using soham_admin and soham_admin123
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.pbadlee.mongodb.net/publicSpace?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('🚀 Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Atlas Connection Error:', err.message);
  });

// --- 3. API Routes ---

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

fastify.get('/api/posts', async () => {
  return await Post.find().populate('authorId', 'name').sort({ createdAt: -1 });
});

fastify.post('/api/posts', async (request, reply) => {
  try {
    const { userId, caption } = request.body;
    const user = await User.findById(userId);
    if (!user) return reply.status(404).send({ error: "User not found" });

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

fastify.post('/api/posts/:id/like', async (request) => {
  const post = await Post.findById(request.params.id);
  const { userId } = request.body;
  post.likes.includes(userId) ? post.likes.pull(userId) : post.likes.push(userId);
  await post.save();
  return { success: true };
});

fastify.post('/api/posts/:id/comment', async (request) => {
  const post = await Post.findById(request.params.id);
  post.comments.push(request.body); 
  await post.save();
  return { success: true };
});

fastify.delete('/api/posts/:id', async (request, reply) => {
  try {
    await Post.findByIdAndDelete(request.params.id);
    return { success: true };
  } catch (err) {
    return reply.status(500).send({ error: "Could not delete" });
  }
});

fastify.get('/seed', async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  const user = await User.create({ name: "Soham Patil", friends: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()] });
  return { userId: user._id };
});

fastify.listen({ port: 5000, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log('✅ Server listening on port 5000');
});