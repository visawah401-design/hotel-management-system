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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // Add user from payload - handle both old format (decoded.user) and new format (decoded.userId)
    req.user = decoded.user || { id: decoded.userId, role: decoded.role };
    next();
  } catch (e) {
    res.status(400).json({ message: 'Token is not valid' });
  }
}

module.exports = auth;