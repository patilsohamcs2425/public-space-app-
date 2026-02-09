const Post = require('../models/Post');

const checkPostLimits = async (user) => {
  const friendCount = user.friends.length;

  // Rule 1: No friends = No posting
  if (friendCount === 0) {
    return { allowed: false, message: "Community rule: You need at least 1 friend to post." };
  }

  // Rule 2: More than 10 friends = Unlimited
  if (friendCount > 10) return { allowed: true };

  // Rule 3: 1 to 10 friends = N posts per day
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const postsToday = await Post.countDocuments({
    authorId: user._id,
    createdAt: { $gte: startOfToday }
  });

  if (postsToday >= friendCount) {
    return { 
      allowed: false, 
      message: `You've reached your limit of ${friendCount} posts for today!` 
    };
  }

  return { allowed: true };
};

module.exports = checkPostLimits;