const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Add user from payload
    req.user = decoded.user;
    next();
  } catch (e) {
    res.status(400).json({ message: 'Token is not valid' });
  }
}

module.exports = auth;