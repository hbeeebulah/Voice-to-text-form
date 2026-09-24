const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'voxform-secret-key-2026-super-secure';

// Middleware for routes requiring authentication
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. Please log in to continue.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await db.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User session not found or expired. Please sign in again.' });
    }

    // Attach user (without passwordHash) to req
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}

// Middleware for routes where auth is optional (e.g. form creation/listing)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await db.getUserById(decoded.userId);
      if (user) {
        const { passwordHash, ...safeUser } = user;
        req.user = safeUser;
      }
    }
  } catch (err) {
    // Silently ignore auth failure for optional routes
    req.user = null;
  }
  next();
}

module.exports = {
  authenticate,
  optionalAuth,
  JWT_SECRET
};
