const jwt = require('jsonwebtoken');
  const protect = (req, res, next) => {
  try {
    let token;

    // 1. Try Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to query string (needed for <video> tag streaming)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    // 3. No token found anywhere
    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

// ── NEW: Optional auth — attaches user if token exists
// but does NOT block if no token
const optionalProtect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    // Invalid or expired token — treat as guest
    req.user = null;
    next();
  }
};

module.exports = { protect, authorize, optionalProtect };