const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'voxform-secret-key-2026-super-secure';

// Middleware for routes requiring authentication
async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. Please log in to continue.' });
    }

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
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (token) {
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

/**
 * Strict Form Authorization Middleware (Anti-IDOR)
 * Verifies that the authenticated user is the form owner or an approved collaborator with sufficient role.
 * @param {'viewer'|'editor'|'owner'} requiredRole
 */
function requireFormAccess(requiredRole = 'viewer') {
  return async (req, res, next) => {
    try {
      const formId = req.params.id;
      const form = await db.getFormById(formId);
      if (!form) {
        return res.status(404).json({ error: 'Form not found.' });
      }

      req.form = form;

      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required to access this form.' });
      }

      // System admins have full access
      if (req.user.role === 'admin') {
        req.userFormRole = 'owner';
        return next();
      }

      // Check if user is the form owner / creator
      const isOwner = (form.creatorId && form.creatorId === req.user.id) ||
                      (form.creatorEmail && form.creatorEmail.toLowerCase() === (req.user.email || '').toLowerCase()) ||
                      (!form.creatorId);

      if (isOwner) {
        req.userFormRole = 'owner';
        return next();
      }

      // Check if user is a designated collaborator
      const collaborators = Array.isArray(form.collaborators) ? form.collaborators : [];
      const userCollab = collaborators.find(c =>
        c.userId === req.user.id || (c.email && c.email.toLowerCase() === (req.user.email || '').toLowerCase())
      );

      if (!userCollab) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to access this form.' });
      }

      req.userFormRole = userCollab.role || 'viewer';

      // Check specific role requirements
      if (requiredRole === 'owner') {
        return res.status(403).json({ error: 'Access denied. Only the form owner can perform this action.' });
      }

      if (requiredRole === 'editor' && userCollab.role !== 'editor') {
        return res.status(403).json({ error: 'Access denied. Editor permissions are required for this action.' });
      }

      // Role check passed ('viewer' or matches role)
      next();
    } catch (err) {
      console.error('[requireFormAccess] Authorization check error:', err);
      return res.status(500).json({ error: 'Failed to verify form authorization.' });
    }
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireFormAccess,
  JWT_SECRET
};
