const express = require('express');
const router = express.Router();
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');

const ADMIN_SECRET_KEY = process.env.ADMIN_ANALYTICS_KEY || 'vox-owner-secret-2026';

// Middleware to verify secret admin access key or admin user
function verifyAdminAccess(req, res, next) {
  const providedKey = req.headers['x-admin-key'] || req.query.key;
  if (providedKey && providedKey === ADMIN_SECRET_KEY) {
    return next();
  }

  // Also allow if user is authenticated and has admin role
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied. A valid secret admin key is required to access this analytics dashboard.'
  });
}

// GET /api/admin/verify-key - Check if a key is valid
router.get('/verify-key', (req, res) => {
  const providedKey = req.headers['x-admin-key'] || req.query.key;
  if (providedKey && providedKey === ADMIN_SECRET_KEY) {
    return res.json({ valid: true });
  }
  return res.status(403).json({ valid: false, error: 'Invalid secret key.' });
});

// GET /api/admin/analytics - Full system analytics for owner
router.get('/analytics', optionalAuth, verifyAdminAccess, async (req, res) => {
  try {
    const [users, forms, allResponses] = await Promise.all([
      db.getAllUsers(),
      db.getAllForms(),
      db.getAllResponses()
    ]);

    // Map responses by formId for fast lookups
    const responsesByFormId = {};
    let totalVoiceResponses = 0;
    let totalVoiceFields = 0;

    allResponses.forEach(r => {
      const fId = r.formId;
      if (!responsesByFormId[fId]) {
        responsesByFormId[fId] = [];
      }
      responsesByFormId[fId].push(r);

      const hasVoice = r.voiceFieldStats && Object.values(r.voiceFieldStats).some(Boolean);
      if (hasVoice) {
        totalVoiceResponses++;
      }

      if (r.voiceFieldStats && typeof r.voiceFieldStats === 'object') {
        Object.values(r.voiceFieldStats).forEach(v => {
          if (v) totalVoiceFields++;
        });
      }
    });

    // Map forms by creator (by creatorId or creatorEmail)
    const formsByCreatorId = {};
    const formsByCreatorEmail = {};
    const assignedFormIds = new Set();

    forms.forEach(f => {
      if (f.creatorId) {
        if (!formsByCreatorId[f.creatorId]) formsByCreatorId[f.creatorId] = [];
        formsByCreatorId[f.creatorId].push(f);
      }
      if (f.creatorEmail) {
        const cleanEmail = f.creatorEmail.trim().toLowerCase();
        if (!formsByCreatorEmail[cleanEmail]) formsByCreatorEmail[cleanEmail] = [];
        formsByCreatorEmail[cleanEmail].push(f);
      }
    });

    // Build privacy-preserving per-user metrics (counts and voice usage rates only — no form titles or links)
    const userBreakdowns = users.map(u => {
      const cleanEmail = (u.email || '').trim().toLowerCase();
      const matchedFormsMap = new Map();

      (formsByCreatorId[u.id] || []).forEach(f => matchedFormsMap.set(f.id, f));
      (formsByCreatorEmail[cleanEmail] || []).forEach(f => matchedFormsMap.set(f.id, f));

      const userForms = Array.from(matchedFormsMap.values());
      userForms.forEach(f => assignedFormIds.add(f.id));

      let totalResponsesForRate = 0;
      let voiceResponsesReceived = 0;
      let voiceFieldsOnUserForms = 0;

      userForms.forEach(f => {
        const responses = responsesByFormId[f.id] || [];
        totalResponsesForRate += responses.length;

        responses.forEach(r => {
          const hasVoice = r.voiceFieldStats && Object.values(r.voiceFieldStats).some(Boolean);
          if (hasVoice) {
            voiceResponsesReceived++;
          }
          if (r.voiceFieldStats) {
            Object.values(r.voiceFieldStats).forEach(v => {
              if (v) voiceFieldsOnUserForms++;
            });
          }
        });
      });

      const overallUserVoiceRate = totalResponsesForRate > 0
        ? Math.round((voiceResponsesReceived / totalResponsesForRate) * 100)
        : 0;

      return {
        id: u.id,
        name: u.name || 'Anonymous User',
        email: u.email,
        avatarUrl: u.avatarUrl || null,
        provider: u.provider || 'email',
        role: u.role || 'creator',
        createdAt: u.createdAt,
        formsCount: userForms.length,
        voiceResponsesReceived,
        voiceFieldsOnUserForms,
        voiceAdoptionRate: overallUserVoiceRate
      };
    });

    // Sort users by formsCount desc, then createdAt desc
    userBreakdowns.sort((a, b) => (b.formsCount - a.formsCount) || (new Date(b.createdAt) - new Date(a.createdAt)));

    const totalResponses = allResponses.length;
    const overallVoiceRate = totalResponses > 0
      ? Math.round((totalVoiceResponses / totalResponses) * 100)
      : 0;

    // Voice & Signup timeline (last 7 days activity)
    const now = new Date();
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      past7Days.push(dateKey);
    }

    const activityByDate = {};
    past7Days.forEach(date => {
      activityByDate[date] = { date, voice: 0, formsCreated: 0, signups: 0, voiceRate: 0, _totalForRate: 0 };
    });

    allResponses.forEach(r => {
      const dateKey = (r.submittedAt || '').slice(0, 10);
      if (activityByDate[dateKey]) {
        activityByDate[dateKey]._totalForRate++;
        if (r.voiceFieldStats && Object.values(r.voiceFieldStats).some(Boolean)) {
          activityByDate[dateKey].voice++;
        }
      }
    });

    Object.values(activityByDate).forEach(day => {
      day.voiceRate = day._totalForRate > 0 ? Math.round((day.voice / day._totalForRate) * 100) : 0;
      delete day._totalForRate;
    });

    forms.forEach(f => {
      const dateKey = (f.createdAt || '').slice(0, 10);
      if (activityByDate[dateKey]) {
        activityByDate[dateKey].formsCreated++;
      }
    });

    users.forEach(u => {
      const dateKey = (u.createdAt || '').slice(0, 10);
      if (activityByDate[dateKey]) {
        activityByDate[dateKey].signups++;
      }
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      overview: {
        totalUsers: users.length,
        totalForms: forms.length,
        totalVoiceResponses,
        totalVoiceFields,
        overallVoiceAdoptionRate: overallVoiceRate,
        averageFormsPerUser: users.length > 0 ? (forms.length / users.length).toFixed(1) : 0
      },
      users: userBreakdowns,
      activityTimeline: Object.values(activityByDate)
    });
  } catch (err) {
    console.error('[Admin Analytics] Error:', err);
    res.status(500).json({ error: 'Failed to generate admin analytics report.' });
  }
});

module.exports = router;
