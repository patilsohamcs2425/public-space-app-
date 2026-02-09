const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

fastify.register(cors, { origin: "*" });

// --- Schemas ---
const User = mongoose.model('User', new mongoose.Schema({ name: String }));

// ✅ CLEANEST CONNECTION STRING
// Using your credentials: soham_admin / soham_admin123
const MONGO_URI = 'mongodb+srv://soham_admin:soham_admin123@cluster0.pbadlee.mongodb.net/publicSpace?retryWrites=true&w=majority';

// Modern Mongoose doesn't need useNewUrlParser or useUnifiedTopology
mongoose.connect(MONGO_URI, {
  family: 4 // 🚀 FORCES IPv4: This usually solves the "IP Whitelist" error on local networks
})
  .then(() => console.log('🚀 100% SUCCESS: CONNECTED TO MONGODB ATLAS!'))
  .catch(err => {
    console.error('❌ MONGODB ERROR:', err.message);
  });

// Test Route
fastify.get('/seed', async () => {
  try {
    const user = await User.create({ name: "Soham Patil" });
    return { status: "Connected!", userId: user._id };
  } catch (e) { return { error: e.message }; }
});

fastify.listen({ port: 5000, host: '0.0.0.0' }, (err) => {
  if (err) { console.log(err); process.exit(1); }
  console.log('✅ Server listening on port 5000');
});