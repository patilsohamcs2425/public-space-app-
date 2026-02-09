const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// --- 1. Middleware ---
// Allows your Vercel frontend to communicate with this Render backend
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
  likes: { type: [String], default: [] }, // Stores User IDs of people who liked
  createdAt: { type: Date, default: Date.now }
}));

// --- 3. Database Connection ---
// Using your verified cluster URI
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.r3hqnt8.mongodb.net/publicSpace?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => console.log('🚀 DATABASE CONNECTED SUCCESSFULLY'))
  .catch(err => console.error('❌ MONGODB ERROR:', err.message));

// --- 4. API Routes ---

// Root route to verify server status
fastify.get('/', async () => {
  return { 
    message: "Soham Patil's Public Space API is Live!", 
    dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Connecting..." 
  };
});

fastify.get('/', async () => {
  return { 
    status: "Public Space API is Live", 
    message: "Soham Patil's Final Internship Project",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Error"
  };
});

// Seed Route: Resets the app and creates your user
fastify.get('/seed', async (request, reply) => {
  try {
    await User.deleteMany({});
    await Post.deleteMany({});
    const user = await User.create({ 
      name: "Soham Patil", 
      friends: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()] 
    });
    
    // Create an initial post so the feed isn't empty
    await Post.create({
      authorId: user._id,
      mediaUrl: "https://picsum.photos/seed/public/600/400",
      caption: "Welcome to the Public Space! Project Finalized."
    });

    return { userId: user._id };
  } catch (e) {
    return reply.status(500).send({ error: e.message });
  }
});

// User Status: Fixes the 404 error by providing name and limits
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

// Feed: Returns all posts with author names
fastify.get('/api/posts', async () => {
  return await Post.find().populate('authorId', 'name').sort({ createdAt: -1 });
});

// Create Post: Handles new image posts
fastify.post('/api/posts', async (request) => {
  const { userId, caption } = request.body;
  return await Post.create({
    authorId: userId,
    mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
    caption
  });
});

// Like/Unlike Logic: Toggles user ID in the likes array
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

// Delete Logic: Removes post from MongoDB
fastify.delete('/api/posts/:id', async (request) => {
  await Post.findByIdAndDelete(request.params.id);
  return { success: true };
});

// --- 5. Start Server ---
// Uses Render's default port or 10000
const PORT = process.env.PORT || 10000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`✅ Server listening on port ${PORT}`);
});