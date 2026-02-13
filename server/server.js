const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// ✅ CORS FIX: Explicitly allow your React Frontend
fastify.register(cors, { 
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"], 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
});

// ✅ DATABASE (Keep this same)
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.r3hqnt8.mongodb.net/publicSpace?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => console.log('🚀 LOCAL DATABASE CONNECTED'))
  .catch(err => console.error('❌ DB ERROR:', err.message));

// --- SCHEMAS ---
const User = mongoose.model('User', new mongoose.Schema({ 
  name: String, 
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  password: { type: String, required: true }, 
  friends: [mongoose.Schema.Types.ObjectId],
  lastPasswordResetRequest: { type: Date }
}));

const Post = mongoose.model('Post', new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaUrl: String, 
  caption: String,
  likes: { type: [String], default: [] }, // Stores User IDs
  comments: [{ text: String, author: String }], // ✅ Added Comments
  createdAt: { type: Date, default: Date.now }
}));

// --- HELPER: Letters-Only Generator (Task 2) ---
const generateLetterPassword = (length = 10) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

// --- ROUTES ---

// 1. REGISTER
fastify.post('/api/register', async (req, reply) => {
  const { name, email, phoneNumber, password } = req.body;
  try {
    const user = await User.create({ 
      name, email, phoneNumber, password, 
      friends: [new mongoose.Types.ObjectId()] // Default 1 friend
    });
    return { userId: user._id, name: user.name };
  } catch (err) { return reply.status(400).send({ error: "Email already exists" }); }
});

// 2. LOGIN
fastify.post('/api/login', async (req, reply) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) return reply.status(401).send({ error: "Invalid credentials" });
  return { userId: user._id, name: user.name };
});

// 3. FORGOT PASSWORD (TASK 2)
fastify.post('/api/forgot-password', async (req, reply) => {
  const { identifier } = req.body;
  const user = await User.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });

  if (!user) return reply.status(404).send({ error: "User not found" });

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  if (user.lastPasswordResetRequest && (now - user.lastPasswordResetRequest < oneDay)) {
    return reply.status(429).send({ error: "You can use this option only once per day." });
  }

  const newPass = generateLetterPassword(12);
  user.password = newPass;
  user.lastPasswordResetRequest = now;
  await user.save();

  return { message: "Success", newPassword: newPass };
});

// 4. USER STATUS (Task 1)
fastify.get('/api/user-status/:userId', async (req) => {
  const user = await User.findById(req.params.userId);
  const postsToday = await Post.countDocuments({
    authorId: user._id, createdAt: { $gte: new Date().setHours(0,0,0,0) }
  });
  let limit = user.friends.length > 10 ? 9999 : user.friends.length;
  return { name: user.name, remaining: Math.max(0, limit - postsToday) };
});

// 5. POST ACTIONS (RESTORED ALL FEATURES)
fastify.get('/api/posts', async () => await Post.find().populate('authorId', 'name').sort({ createdAt: -1 }));

fastify.post('/api/posts', async (req) => {
  await Post.create({ 
    authorId: req.body.userId, 
    mediaUrl: `https://picsum.photos/seed/${Math.random()}/400/200`, // Random Image
    caption: req.body.caption 
  });
  return { success: true };
});

// ✅ LIKE POST
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

// ✅ COMMENT ON POST
fastify.post('/api/posts/:id/comment', async (req) => {
  const post = await Post.findById(req.params.id);
  post.comments.push({ text: req.body.text, author: req.body.userName });
  await post.save();
  return { success: true };
});

// ✅ DELETE POST
fastify.delete('/api/posts/:id', async (req) => {
  await Post.findByIdAndDelete(req.params.id);
  return { success: true };
});

const PORT = 10000;
fastify.listen({ port: PORT, host: '0.0.0.0' }, () => console.log(`✅ Server running locally on port ${PORT}`));