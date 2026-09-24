const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { optionalAuth } = require('../middleware/auth');

// GET /api/forms - List forms (optionally filtered by creatorId)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const creatorFilter = req.query.creatorId ? { creatorId: req.query.creatorId } : {};
    const forms = await db.getAllForms(creatorFilter);
    // Return summary data for forms list
    const formSummaries = await Promise.all(
      forms.map(async (form) => {
        const responses = await db.getResponsesByFormId(form.id);
        return {
          id: form.id,
          title: form.title,
          description: form.description,
          theme: form.theme,
          creatorId: form.creatorId || null,
          creatorName: form.creatorName || null,
          creatorEmail: form.creatorEmail || null,
          questionCount: form.questions ? form.questions.length : 0,
          responseCount: responses.length,
          updatedAt: form.updatedAt,
          createdAt: form.createdAt
        };
      })
    );
    res.json(formSummaries);
  } catch (err) {
    console.error('[Forms GET] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve forms.' });
  }
});

// POST /api/forms - Create a new form
router.post('/', optionalAuth, async (req, res) => {
  try {
    const newForm = {
      id: uuidv4(),
      title: req.body.title || 'Untitled Form',
      description: req.body.description || '',
      creatorId: req.user ? req.user.id : (req.body.creatorId || null),
      creatorName: req.user ? req.user.name : (req.body.creatorName || null),
      creatorEmail: req.user ? req.user.email : (req.body.creatorEmail || null),
      theme: req.body.theme || {
        themeId: 'modern-minimalist',
        accentColor: '#3b82f6',
        headerColor: '#2563eb',
        backgroundColor: '#f8fafc',
        fontHeader: 'Inter',
        fontBody: 'Inter',
        headerBannerUrl: '',
        cardRoundness: 'rounded-2xl',
        buttonStyle: 'rounded-xl'
      },
      questions: req.body.questions || [
        {
          id: uuidv4(),
          title: 'Untitled Question',
          description: '',
          type: 'short_answer',
          required: false,
          voiceEnabled: true,
          placeholder: ''
        }
      ],
      settings: req.body.settings || {
        allowMultipleSubmissions: true,
        showProgressBar: true,
        confirmationMessage: 'Your response has been recorded.'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await db.saveForm(newForm);
    res.status(201).json(saved);
  } catch (err) {
    console.error('[Forms POST] Error:', err);
    res.status(500).json({ error: 'Failed to create form.' });
  }
});

// GET /api/forms/:id - Get form by ID
router.get('/:id', async (req, res) => {
  try {
    const form = await db.getFormById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }
    res.json(form);
  } catch (err) {
    console.error('[Form GET :id] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve form.' });
  }
});

// PUT /api/forms/:id - Update form (autosave & manual save)
router.put('/:id', async (req, res) => {
  try {
    const existing = await db.getFormById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const updated = {
      ...existing,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    const saved = await db.saveForm(updated);
    res.json(saved);
  } catch (err) {
    console.error('[Form PUT :id] Error:', err);
    res.status(500).json({ error: 'Failed to update form.' });
  }
});

// DELETE /api/forms/:id - Delete form
router.delete('/:id', async (req, res) => {
  try {
    await db.deleteForm(req.params.id);
    res.json({ success: true, message: 'Form deleted successfully.' });
  } catch (err) {
    console.error('[Form DELETE :id] Error:', err);
    res.status(500).json({ error: 'Failed to delete form.' });
  }
});

// POST /api/forms/:id/duplicate - Duplicate form
router.post('/:id/duplicate', optionalAuth, async (req, res) => {
  try {
    const original = await db.getFormById(req.params.id);
    if (!original) {
      return res.status(404).json({ error: 'Original form not found.' });
    }

    const duplicateForm = {
      ...original,
      id: uuidv4(),
      title: `${original.title} (Copy)`,
      creatorId: req.user ? req.user.id : original.creatorId,
      creatorName: req.user ? req.user.name : original.creatorName,
      creatorEmail: req.user ? req.user.email : original.creatorEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await db.saveForm(duplicateForm);
    res.status(201).json(saved);
  } catch (err) {
    console.error('[Form DUPLICATE] Error:', err);
    res.status(500).json({ error: 'Failed to duplicate form.' });
  }
});

// POST /api/forms/:id/responses - Submit a response
router.post('/:id/responses', async (req, res) => {
  try {
    const form = await db.getFormById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const { answers, voiceFieldStats } = req.body;

    // Validate required fields
    const missingFields = [];
    if (form.questions) {
      for (const q of form.questions) {
        if (q.required) {
          const ans = answers ? answers[q.id] : undefined;
          if (ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
            missingFields.push(q.title || `Question (${q.id})`);
          }
        }
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Please fill in all required questions.',
        missingFields
      });
    }

    const responseRecord = {
      id: uuidv4(),
      formId: req.params.id,
      answers: answers || {},
      voiceFieldStats: voiceFieldStats || {},
      submittedAt: new Date().toISOString()
    };

    const saved = await db.saveResponse(responseRecord);
    res.status(201).json({
      success: true,
      responseId: saved.id,
      confirmationMessage: form.settings?.confirmationMessage || 'Your response has been recorded.'
    });
  } catch (err) {
    console.error('[Response POST] Error:', err);
    res.status(500).json({ error: 'Failed to submit response.' });
  }
});

// GET /api/forms/:id/responses - Get all responses for a form
router.get('/:id/responses', async (req, res) => {
  try {
    const responses = await db.getResponsesByFormId(req.params.id);
    res.json(responses);
  } catch (err) {
    console.error('[Responses GET] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve responses.' });
  }
});

// GET /api/forms/:id/analytics - Aggregated analytics dashboard data
router.get('/:id/analytics', async (req, res) => {
  try {
    const form = await db.getFormById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const responses = await db.getResponsesByFormId(req.params.id);
    const totalSubmissions = responses.length;

    // Calculate voice dictation usage stats
    let totalTextAnswers = 0;
    let voiceUsedCount = 0;

    responses.forEach(r => {
      if (r.voiceFieldStats) {
        Object.values(r.voiceFieldStats).forEach(wasVoice => {
          totalTextAnswers++;
          if (wasVoice) voiceUsedCount++;
        });
      }
    });

    const voiceUsagePercentage = totalTextAnswers > 0
      ? Math.round((voiceUsedCount / totalTextAnswers) * 100)
      : 0;

    // Build question analytics
    const questionAnalytics = (form.questions || []).map(q => {
      const answersForQ = responses
        .map(r => r.answers?.[q.id])
        .filter(a => a !== undefined && a !== null && a !== '');

      const responseCount = answersForQ.length;

      if (q.type === 'multiple_choice' || q.type === 'dropdown') {
        const counts = {};
        (q.options || []).forEach(opt => { counts[opt] = 0; });
        counts['Other'] = 0;

        answersForQ.forEach(ans => {
          if (counts[ans] !== undefined) {
            counts[ans]++;
          } else {
            counts['Other'] = (counts['Other'] || 0) + 1;
          }
        });

        // Filter out options with 0 if Other is 0
        if (counts['Other'] === 0) delete counts['Other'];

        return {
          questionId: q.id,
          title: q.title,
          type: q.type,
          responseCount,
          data: Object.entries(counts).map(([option, count]) => ({
            label: option,
            count,
            percentage: responseCount > 0 ? Math.round((count / responseCount) * 100) : 0
          }))
        };
      }

      if (q.type === 'checkboxes') {
        const counts = {};
        (q.options || []).forEach(opt => { counts[opt] = 0; });

        answersForQ.forEach(ansList => {
          if (Array.isArray(ansList)) {
            ansList.forEach(opt => {
              counts[opt] = (counts[opt] || 0) + 1;
            });
          } else if (typeof ansList === 'string') {
            counts[ansList] = (counts[ansList] || 0) + 1;
          }
        });

        return {
          questionId: q.id,
          title: q.title,
          type: q.type,
          responseCount,
          data: Object.entries(counts).map(([option, count]) => ({
            label: option,
            count,
            percentage: responseCount > 0 ? Math.round((count / responseCount) * 100) : 0
          }))
        };
      }

      if (q.type === 'linear_scale') {
        const min = q.scaleConfig?.min || 1;
        const max = q.scaleConfig?.max || 5;
        const distribution = {};
        for (let i = min; i <= max; i++) {
          distribution[i] = 0;
        }

        let sum = 0;
        let validNumCount = 0;

        answersForQ.forEach(val => {
          const num = Number(val);
          if (!isNaN(num)) {
            distribution[num] = (distribution[num] || 0) + 1;
            sum += num;
            validNumCount++;
          }
        });

        const average = validNumCount > 0 ? (sum / validNumCount).toFixed(2) : null;

        return {
          questionId: q.id,
          title: q.title,
          type: q.type,
          scaleConfig: q.scaleConfig,
          responseCount,
          average,
          distribution: Object.entries(distribution).map(([score, count]) => ({
            score: Number(score),
            count,
            percentage: responseCount > 0 ? Math.round((count / responseCount) * 100) : 0
          }))
        };
      }

      // Short Answer & Paragraph types
      const textResponses = responses.map(r => ({
        id: r.id,
        text: r.answers?.[q.id] || '',
        submittedAt: r.submittedAt,
        usedVoice: Boolean(r.voiceFieldStats?.[q.id])
      })).filter(item => item.text.trim().length > 0);

      const voiceCount = textResponses.filter(item => item.usedVoice).length;
      const voiceRate = textResponses.length > 0 ? Math.round((voiceCount / textResponses.length) * 100) : 0;

      return {
        questionId: q.id,
        title: q.title,
        type: q.type,
        responseCount: textResponses.length,
        voiceRate,
        voiceCount,
        responses: textResponses.slice(0, 50) // top 50 recent responses
      };
    });

    res.json({
      formId: form.id,
      formTitle: form.title,
      totalSubmissions,
      voiceUsagePercentage,
      totalTextAnswers,
      voiceUsedCount,
      lastSubmissionAt: responses.length > 0 ? responses[0].submittedAt : null,
      questionAnalytics
    });
  } catch (err) {
    console.error('[Analytics GET] Error:', err);
    res.status(500).json({ error: 'Failed to compute analytics.' });
  }
});

// GET /api/forms/:id/export/csv - Export responses as CSV
router.get('/:id/export/csv', async (req, res) => {
  try {
    const form = await db.getFormById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found.' });

    const responses = await db.getResponsesByFormId(req.params.id);
    const questions = form.questions || [];

    // Header row
    const headers = ['Response ID', 'Timestamp', ...questions.map(q => `"${(q.title || 'Untitled').replace(/"/g, '""')}"`)];
    const rows = [headers.join(',')];

    responses.forEach(r => {
      const row = [
        `"${r.id}"`,
        `"${new Date(r.submittedAt).toLocaleString()}"`
      ];

      questions.forEach(q => {
        let val = r.answers?.[q.id];
        if (Array.isArray(val)) {
          val = val.join('; ');
        } else if (val === undefined || val === null) {
          val = '';
        } else {
          val = String(val);
        }
        row.push(`"${val.replace(/"/g, '""')}"`);
      });

      rows.push(row.join(','));
    });

    const csvContent = rows.join('\r\n');
    const safeFilename = (form.title || 'form').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_responses.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('[CSV Export] Error:', err);
    res.status(500).json({ error: 'Failed to export CSV.' });
  }
});

// GET /api/forms/:id/export/json - Export responses as JSON
router.get('/:id/export/json', async (req, res) => {
  try {
    const form = await db.getFormById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found.' });

    const responses = await db.getResponsesByFormId(req.params.id);
    const exportData = {
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        questions: form.questions
      },
      exportTimestamp: new Date().toISOString(),
      totalResponses: responses.length,
      responses
    };

    const safeFilename = (form.title || 'form').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_responses.json"`);
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error('[JSON Export] Error:', err);
    res.status(500).json({ error: 'Failed to export JSON.' });
  }
});

module.exports = router;
