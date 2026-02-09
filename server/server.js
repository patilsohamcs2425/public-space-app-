const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

fastify.register(cors, { origin: "*" });

// --- 1. Schemas (Ensuring Likes are tracked) ---
const User = mongoose.model('User', new mongoose.Schema({ 
  name: String, 
  friends: [mongoose.Schema.Types.ObjectId] 
}));

const Post = mongoose.model('Post', new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaUrl: String,
  caption: String,
  likes: { type: [mongoose.Schema.Types.ObjectId], default: [] }, // ✅ Tracks like count
  createdAt: { type: Date, default: Date.now }
}));

// --- 2. Database Connection (Your Verified String) ---
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.r3hqnt8.mongodb.net/publicSpace?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => console.log('🚀 DATABASE CONNECTED'))
  .catch(err => console.error('❌ MONGODB ERROR:', err.message));

// --- 3. Fixed Routes ---

// Seed Route (Now creates a test post!)
fastify.get('/seed', async (req, reply) => {
  try {
    await User.deleteMany({});
    await Post.deleteMany({});
    const user = await User.create({ name: "Soham Patil", friends: [new mongoose.Types.ObjectId()] });
    
    // ✅ Create one post so the website isn't empty
    await Post.create({
      authorId: user._id,
      mediaUrl: "https://picsum.photos/seed/soham/600/400",
      caption: "First post on the live platform!"
    });

    return { status: "Project Reset & Seeded!", userId: user._id };
  } catch (e) { return reply.status(500).send({ error: e.message }); }
});

// GET POSTS (Shows author name and like count)
fastify.get('/api/posts', async () => {
  return await Post.find().populate('authorId', 'name').sort({ createdAt: -1 });
});

// LIKE LOGIC
fastify.post('/api/posts/:id/like', async (req) => {
  const post = await Post.findById(req.params.id);
  const { userId } = req.body;
  // If user already liked, unlike it. Otherwise, add like.
  post.likes.includes(userId) ? post.likes.pull(userId) : post.likes.push(userId);
  await post.save();
  return { success: true, likes: post.likes.length };
});

// DELETE LOGIC
fastify.delete('/api/posts/:id', async (req) => {
  await Post.findByIdAndDelete(req.params.id);
  return { success: true };
});

// User Status (Shows Remaining Post Count)
fastify.get('/api/user-status/:userId', async (req) => {
  const user = await User.findById(req.params.userId);
  const postsToday = await Post.countDocuments({ 
    authorId: user._id, 
    createdAt: { $gte: new Date().setHours(0,0,0,0) } 
  });
  return { 
    name: user.name, 
    remaining: Math.max(0, user.friends.length - postsToday) 
  };
});

const PORT = process.env.PORT || 10000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { console.log(err); process.exit(1); }
});