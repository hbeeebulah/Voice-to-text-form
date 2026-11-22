const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

// Helper to issue JWT
function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'creator'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Helper to sanitize user object for response
function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// POST /api/auth/register - Sign up with email & password
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, avatarUrl: customAvatar } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && name.trim()) || cleanEmail.split('@')[0];

    // Check if user already exists
    const existing = await db.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({
        error: 'An account with this email address already exists. Please sign in instead.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultHeadshot = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    const avatarUrl = (customAvatar && customAvatar.trim()) || defaultHeadshot;

    const newUser = {
      id: uuidv4(),
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      avatarUrl,
      provider: 'email',
      role: 'creator',
      createdAt: new Date().toISOString()
    };

    const saved = await db.saveUser(newUser);
    const token = createToken(saved);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: sanitizeUser(saved)
    });
  } catch (err) {
    console.error('[Auth Register] Error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login - Sign in with email & password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.getUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Please check or sign up.' });
    }

    if (!user.passwordHash) {
      if (user.provider === 'google') {
        return res.status(400).json({
          error: 'This account was created with Google Sign-In. Please click "Continue with Google".'
        });
      }
      return res.status(401).json({ error: 'Invalid authentication credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = createToken(user);

    res.json({
      message: 'Logged in successfully!',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('[Auth Login] Error:', err);
    res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// POST /api/auth/google - Authenticate with verified Google OAuth ID Token
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    // Strict validation: Reject any unverified client-supplied user payload
    if (!credential || typeof credential !== 'string' || !credential.trim()) {
      return res.status(400).json({
        error: 'A valid Google ID token credential is required. Unverified credentials are not accepted.'
      });
    }

    let googleUser = null;

    // Verify Google ID token against Google's official tokeninfo API
    try {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential.trim())}`
      );
      if (!verifyRes.ok) {
        return res.status(401).json({
          error: 'Google ID token verification failed or expired. Please sign in again.'
        });
      }

      const payload = await verifyRes.json();
      const isEmailVerified = payload.email_verified === 'true' || payload.email_verified === true;

      if (!isEmailVerified || !payload.email) {
        return res.status(401).json({
          error: 'Google email address is not verified by Google.'
        });
      }

      googleUser = {
        googleId: payload.sub,
        email: payload.email.trim().toLowerCase(),
        name: payload.name || payload.email.split('@')[0] || 'Google User',
        picture: payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name || 'G')}&backgroundColor=ea4335`
      };
    } catch (verifyErr) {
      console.warn('[Google Auth] Could not reach Google token verification service:', verifyErr.message);
      return res.status(503).json({
        error: 'Google authentication service is currently unreachable. Please try again.'
      });
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ error: 'Unable to verify Google credentials.' });
    }

    // Check if user exists by email or googleId
    let user = await db.getUserByEmail(googleUser.email);
    if (!user && googleUser.googleId) {
      user = await db.getUserByGoogleId(googleUser.googleId);
    }

    if (user) {
      // Existing user: Link Google ID and update avatar/provider
      const updates = {
        googleId: googleUser.googleId,
        avatarUrl: googleUser.picture || user.avatarUrl,
        provider: user.provider || 'google',
        lastLoginAt: new Date().toISOString()
      };
      user = await db.updateUser(user.id, updates);
    } else {
      // New user registration via Google
      const newUser = {
        id: uuidv4(),
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        avatarUrl: googleUser.picture,
        provider: 'google',
        role: 'creator',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      user = await db.saveUser(newUser);
    }

    const token = createToken(user);

    res.json({
      message: 'Signed in with Google successfully!',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('[Google Auth] Error:', err);
    res.status(500).json({ error: 'Failed to authenticate with Google. Please try again.' });
  }
});

// POST /api/auth/demo-login - 1-Click Login for immediate preview / testing
router.post('/demo-login', async (req, res) => {
  try {
    let demoUser = await db.getUserByEmail('creator@voxform.ai');
    if (!demoUser) {
      demoUser = {
        id: 'user-demo-creator',
        name: 'John Doe',
        email: 'creator@voxform.ai',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        provider: 'email',
        role: 'creator',
        createdAt: new Date().toISOString()
      };
      await db.saveUser(demoUser);
    }

    const token = createToken(demoUser);
    res.json({
      message: 'Logged in as Demo Creator!',
      token,
      user: sanitizeUser(demoUser)
    });
  } catch (err) {
    console.error('[Demo Login] Error:', err);
    res.status(500).json({ error: 'Failed to log in as demo creator.' });
  }
});

// GET /api/auth/me - Verify current session & return fresh profile
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: req.user
  });
});

// PUT /api/auth/profile - Update user profile (name, headshot avatar)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (req.body.name && req.body.name.trim()) {
      user.name = req.body.name.trim();
    }
    if (req.body.avatarUrl && req.body.avatarUrl.trim()) {
      user.avatarUrl = req.body.avatarUrl.trim();
    }
    user.updatedAt = new Date().toISOString();
    await db.saveUser(user);
    res.json({
      message: 'Profile updated successfully!',
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('[Auth Profile Update] Error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// GET /api/auth/config - Get public auth configuration (e.g. Google Client ID)
router.get('/config', async (req, res) => {
  try {
    const settings = await db.getSettings();
    const googleClientId = settings.googleClientId || process.env.GOOGLE_CLIENT_ID || '';
    res.json({
      googleClientId,
      hasGoogleClientId: Boolean(googleClientId && googleClientId.length > 5)
    });
  } catch (err) {
    res.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID)
    });
  }
});

// POST /api/auth/config - Update Google Client ID in runtime settings
router.post('/config', async (req, res) => {
  try {
    const { googleClientId } = req.body;
    const settings = await db.updateSettings({
      googleClientId: (googleClientId || '').trim()
    });
    res.json({
      success: true,
      googleClientId: settings.googleClientId,
      hasGoogleClientId: Boolean(settings.googleClientId && settings.googleClientId.length > 5)
    });
  } catch (err) {
    console.error('[Auth Config Update] Error:', err);
    res.status(500).json({ error: 'Failed to update authentication settings.' });
  }
});

module.exports = router;
