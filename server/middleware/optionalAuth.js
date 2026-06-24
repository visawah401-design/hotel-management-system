const jwt = require('jsonwebtoken');

function optionalAuth(req, res, next) {
  const authHeader = req.header('authorization');
  const token = req.header('x-auth-token') || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    req.user = decoded.user || decoded;
    next();
  } catch (e) {
    req.user = null;
    next();
  }
}

module.exports = optionalAuth;
