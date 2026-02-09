const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

fastify.register(cors, { origin: "*" });

const User = mongoose.model('User', new mongoose.Schema({ name: String, friends: [mongoose.Schema.Types.ObjectId] }));
const Post = mongoose.model('Post', new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaUrl: String,
  caption: String,
  likes: { type: [String], default: [] } //  Using Strings for easier ID matching
}));

const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.r3hqnt8.mongodb.net/publicSpace?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => console.log('🚀 DATABASE CONNECTED'))
  .catch(err => console.error('❌ MONGODB ERROR:', err.message));

// --- ROUTES ---

fastify.get('/seed', async (req, reply) => {
  await User.deleteMany({});
  await Post.deleteMany({});
  const user = await User.create({ name: "Soham Patil", friends: [new mongoose.Types.ObjectId()] });
  await Post.create({ authorId: user._id, mediaUrl: "https://picsum.photos/600/400", caption: "Live Demo Post!" });
  return { userId: user._id };
});

fastify.get('/api/posts', async () => await Post.find().populate('authorId', 'name'));

fastify.post('/api/posts', async (req) => {
  return await Post.create({
    authorId: req.body.userId,
    mediaUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
    caption: req.body.caption
  });
});

// ✅ FIXED LIKE LOGIC
fastify.post('/api/posts/:id/like', async (req) => {
  const post = await Post.findById(req.params.id);
  const { userId } = req.body;
  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(id => id !== userId);
  } else {
    post.likes.push(userId);
  }
  await post.save();
  return { success: true };
});

// ✅ FIXED DELETE LOGIC
fastify.delete('/api/posts/:id', async (req) => {
  await Post.findByIdAndDelete(req.params.id);
  return { success: true };
});

const PORT = process.env.PORT || 10000;
fastify.listen({ port: PORT, host: '0.0.0.0' });