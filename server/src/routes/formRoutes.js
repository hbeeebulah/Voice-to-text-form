const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authenticate, optionalAuth, requireFormAccess } = require('../middleware/auth');
const googleFormsIntegrationService = require('../services/googleFormsIntegrationService');

// Multer storage for document attachments
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${safeBase}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max limit
});

// POST /api/forms/upload - Upload an attached document/file
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided for upload.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      fileUrl,
      storedName: req.file.filename
    });
  } catch (err) {
    console.error('[Upload] Error:', err);
    res.status(500).json({ error: 'File upload failed.' });
  }
});

// GET /api/forms - List forms (optionally filtered by creatorId)
router.get('/', optionalAuth, async (req, res) => {
  try {
    let creatorFilter = {};
    if (req.user && req.user.id) {
      creatorFilter = { creatorId: req.user.id, userId: req.user.id, email: req.user.email };
    } else if (req.query.creatorId) {
      creatorFilter = { creatorId: req.query.creatorId, userId: req.query.creatorId };
    }
    const forms = await db.getAllForms(creatorFilter);
    // Return summary data for forms list
    const formSummaries = await Promise.all(
      forms.map(async (form) => {
        const responses = await db.getResponsesByFormId(form.id);
        const isOwner = req.user ? form.creatorId === req.user.id : true;
        const myCollabRecord = req.user && Array.isArray(form.collaborators)
          ? form.collaborators.find(c => 
              c.userId === req.user.id || 
              (c.email && req.user.email && c.email.toLowerCase() === req.user.email.toLowerCase())
            )
          : null;

        return {
          id: form.id,
          title: form.title,
          description: form.description,
          theme: form.theme,
          customSlug: form.customSlug || null,
          creatorId: form.creatorId || null,
          creatorName: form.creatorName || null,
          creatorEmail: form.creatorEmail || null,
          collaborators: form.collaborators || [],
          isOwner,
          userRole: isOwner ? 'owner' : (myCollabRecord?.role || 'collaborator'),
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

// POST /api/forms/google-addon/sync - Create or update a voice-enabled VoxForm from Google Forms Add-on
router.post('/google-addon/sync', optionalAuth, async (req, res) => {
  try {
    const {
      googleFormId,
      title,
      description,
      publishedUrl,
      editUrl,
      creatorEmail,
      creatorName,
      questions = []
    } = req.body;

    if (!googleFormId && !publishedUrl) {
      return res.status(400).json({ error: 'googleFormId or publishedUrl is required.' });
    }

    // Check if this Google Form was already synced to VoxForm
    const allForms = await db.getAllForms();
    const existingForm = allForms.find(
      f =>
        (googleFormId && f.googleFormConfig?.googleFormId === googleFormId) ||
        (publishedUrl && f.googleFormConfig?.publishedUrl === publishedUrl)
    );

    // Enrich questions with Google Form entry.<id> mappings if publishedUrl is provided
    const { questions: enrichedQuestions, formResponseUrl } =
      await googleFormsIntegrationService.enrichAddonQuestionsWithEntryIds(publishedUrl, questions);

    const formId = existingForm ? existingForm.id : uuidv4();
    const cleanTitleSlug = (title || 'voice-form')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24);
    const defaultSlug = existingForm?.customSlug || `${cleanTitleSlug || 'voice-form'}-${formId.slice(0, 6)}`;

    // Match creator user by email if not authenticated via bearer token
    let resolvedCreatorId = req.user ? req.user.id : (existingForm?.creatorId || null);
    let resolvedCreatorName = req.user ? req.user.name : (creatorName || existingForm?.creatorName || null);
    const resolvedCreatorEmail = req.user ? req.user.email : (creatorEmail || existingForm?.creatorEmail || null);

    if (!resolvedCreatorId && resolvedCreatorEmail) {
      const matchedUser = await db.getUserByEmail(resolvedCreatorEmail);
      if (matchedUser) {
        resolvedCreatorId = matchedUser.id;
        resolvedCreatorName = matchedUser.name || resolvedCreatorName;
      }
    }

    const syncedForm = {
      ...(existingForm || {}),
      id: formId,
      customSlug: defaultSlug,
      title: title || existingForm?.title || 'Untitled Form',
      description: description !== undefined ? description : (existingForm?.description || ''),
      creatorId: resolvedCreatorId,
      creatorName: resolvedCreatorName,
      creatorEmail: resolvedCreatorEmail,
      googleFormConfig: {
        googleFormId: googleFormId || existingForm?.googleFormConfig?.googleFormId || null,
        publishedUrl: publishedUrl || existingForm?.googleFormConfig?.publishedUrl || null,
        editUrl: editUrl || existingForm?.googleFormConfig?.editUrl || null,
        formResponseUrl: formResponseUrl || existingForm?.googleFormConfig?.formResponseUrl || null,
        syncedResponseIds: existingForm?.googleFormConfig?.syncedResponseIds || [],
        lastSyncedAt: new Date().toISOString()
      },
      theme: existingForm?.theme || {
        themeId: 'modern-minimalist',
        accentColor: '#6366f1',
        headerColor: '#4f46e5',
        backgroundColor: '#f8fafc',
        fontHeader: 'Inter',
        fontBody: 'Inter',
        headerBannerUrl: '',
        cardRoundness: 'rounded-2xl',
        buttonStyle: 'rounded-xl'
      },
      questions: enrichedQuestions.map(q => ({
        id: q.id || (q.googleItemId ? `gf-${q.googleItemId}` : uuidv4()),
        googleItemId: q.googleItemId ? String(q.googleItemId) : null,
        googleEntryId: q.googleEntryId || null,
        title: q.title || 'Untitled Question',
        description: q.description || '',
        type: q.type || 'short_answer',
        required: Boolean(q.required),
        voiceEnabled: q.voiceEnabled !== undefined
          ? Boolean(q.voiceEnabled)
          : (q.type === 'short_answer' || q.type === 'paragraph' || !q.type),
        ...(q.options ? { options: q.options } : {}),
        ...(q.scaleConfig ? { scaleConfig: q.scaleConfig } : {})
      })),
      settings: existingForm?.settings || {
        allowMultipleSubmissions: true,
        showProgressBar: true,
        confirmationMessage: 'Your voice response has been recorded and synced.'
      },
      createdAt: existingForm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await db.saveForm(syncedForm);
    return res.status(existingForm ? 200 : 201).json({
      success: true,
      isUpdate: Boolean(existingForm),
      form: saved,
      responderPath: `/#form/${saved.id}`,
      shortPath: `/s/${saved.customSlug}`
    });
  } catch (err) {
    console.error('[Google Add-on Sync] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to sync Google Form with VoxForm.' });
  }
});

// POST /api/forms/google-addon/import-url - Import any public Google Form URL and enable Voice-to-Text
router.post('/google-addon/import-url', authenticate, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid public Google Form responder URL.' });
    }

    const parsed = await googleFormsIntegrationService.fetchPublicGoogleFormStructure(url);
    const formId = uuidv4();
    const cleanTitleSlug = (parsed.title || 'voice-form')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24);
    const defaultSlug = `${cleanTitleSlug || 'voice-form'}-${formId.slice(0, 6)}`;

    const newForm = {
      id: formId,
      customSlug: defaultSlug,
      title: parsed.title,
      description: parsed.description,
      creatorId: req.user.id,
      creatorName: req.user.name || null,
      creatorEmail: req.user.email || null,
      googleFormConfig: {
        googleFormId: null,
        publishedUrl: parsed.publishedUrl,
        formResponseUrl: parsed.formResponseUrl,
        syncedResponseIds: [],
        lastSyncedAt: new Date().toISOString()
      },
      theme: {
        themeId: 'modern-minimalist',
        accentColor: '#6366f1',
        headerColor: '#4f46e5',
        backgroundColor: '#f8fafc',
        fontHeader: 'Inter',
        fontBody: 'Inter',
        headerBannerUrl: '',
        cardRoundness: 'rounded-2xl',
        buttonStyle: 'rounded-xl'
      },
      questions: parsed.questions,
      settings: {
        allowMultipleSubmissions: true,
        showProgressBar: true,
        confirmationMessage: 'Your response has been recorded and synced.'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await db.saveForm(newForm);
    return res.status(201).json({
      success: true,
      form: saved,
      responderPath: `/#form/${saved.id}`,
      shortPath: `/s/${saved.customSlug}`
    });
  } catch (err) {
    console.error('[Google Form URL Import] Error:', err);
    return res.status(400).json({ error: err.message || 'Could not import Google Form from URL.' });
  }
});

// GET /api/forms/:id/google-addon/status - Status & voice stats for the Google Forms Add-on sidebar
router.get('/:id/google-addon/status', async (req, res) => {
  try {
    const form = await db.getFormById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }
    const responses = await db.getResponsesByFormId(req.params.id);
    const syncedSet = new Set(form.googleFormConfig?.syncedResponseIds || []);

    let voiceResponsesCount = 0;
    let unsyncedCount = 0;

    responses.forEach(r => {
      if (r.voiceFieldStats && Object.values(r.voiceFieldStats).some(Boolean)) {
        voiceResponsesCount++;
      }
      if (!r.syncedToGoogleForm && !syncedSet.has(r.id)) {
        unsyncedCount++;
      }
    });

    const voiceRate = responses.length > 0 ? Math.round((voiceResponsesCount / responses.length) * 100) : 0;

    return res.json({
      success: true,
      formId: form.id,
      title: form.title,
      customSlug: form.customSlug,
      totalResponses: responses.length,
      voiceResponsesCount,
      voiceAdoptionRate: voiceRate,
      unsyncedCount
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load add-on status.' });
  }
});

// GET /api/forms/:id/google-addon/unsynced-responses - Fetch unsynced responses for native FormApp insertion
router.get('/:id/google-addon/unsynced-responses', async (req, res) => {
  try {
    const form = await db.getFormById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }
    const responses = await db.getResponsesByFormId(req.params.id);
    const syncedSet = new Set(form.googleFormConfig?.syncedResponseIds || []);

    const unsynced = responses
      .filter(r => !r.syncedToGoogleForm && !syncedSet.has(r.id))
      .map(r => {
        // Map question.id answers to googleItemId so Code.gs can match FormApp items by ID or title
        const itemAnswers = [];
        (form.questions || []).forEach(q => {
          const val = r.answers?.[q.id];
          if (val !== undefined && val !== null && val !== '') {
            itemAnswers.push({
              questionId: q.id,
              googleItemId: q.googleItemId || null,
              title: q.title,
              type: q.type,
              value: val
            });
          }
        });
        return {
          responseId: r.id,
          submittedAt: r.submittedAt,
          itemAnswers
        };
      });

    return res.json({
      success: true,
      unsynced
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve unsynced responses.' });
  }
});

// POST /api/forms/:id/google-addon/mark-synced - Mark response IDs as synced to Google Form
router.post('/:id/google-addon/mark-synced', async (req, res) => {
  try {
    const form = await db.getFormById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }
    const { responseIds = [] } = req.body;
    const existingIds = form.googleFormConfig?.syncedResponseIds || [];
    const mergedIds = Array.from(new Set([...existingIds, ...responseIds]));

    form.googleFormConfig = {
      ...(form.googleFormConfig || {}),
      syncedResponseIds: mergedIds,
      lastSyncedAt: new Date().toISOString()
    };
    await db.saveForm(form);

    return res.json({
      success: true,
      syncedCount: responseIds.length
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark responses as synced.' });
  }
});

// POST /api/forms - Create a new form
router.post('/', optionalAuth, async (req, res) => {
  try {
    const formId = uuidv4();
    const cleanTitleSlug = req.body.title
      ? req.body.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
      : 'form';
    const defaultSlug = `${cleanTitleSlug || 'form'}-${formId.slice(0, 6)}`;

    const newForm = {
      id: formId,
      customSlug: req.body.customSlug || defaultSlug,
      title: req.body.title || 'Untitled Form',
      description: req.body.description || '',
      creatorId: req.user ? req.user.id : (req.body.creatorId || null),
      creatorName: req.user ? req.user.name : (req.body.creatorName || null),
      creatorEmail: req.user ? req.user.email : (req.body.creatorEmail || null),
      collaborators: req.body.collaborators || [],
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
      isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : false,
      status: req.body.status || (req.body.isPublished ? 'published' : 'draft'),
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

function canUserViewDraft(form, user) {
  if (!form) return false;
  const isPublished = form.isPublished !== undefined
    ? Boolean(form.isPublished)
    : form.status !== undefined
      ? form.status === 'published'
      : true;
  if (isPublished) return true;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (form.creatorId && form.creatorId === user.id) return true;
  if (form.creatorEmail && user.email && form.creatorEmail.toLowerCase() === user.email.toLowerCase()) return true;
  if (Array.isArray(form.collaborators)) {
    return form.collaborators.some(
      c => (c.userId && c.userId === user.id) || (c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase())
    );
  }
  return false;
}

// GET /api/forms/by-slug/:slug - Get form by custom short link slug
router.get('/by-slug/:slug', optionalAuth, async (req, res) => {
  try {
    const form = await db.getFormBySlug(req.params.slug);
    if (!form) {
      return res.status(404).json({ error: 'Form not found for this short link.' });
    }
    if (!canUserViewDraft(form, req.user)) {
      return res.json({
        id: form.id,
        title: form.title,
        description: form.description,
        isPublished: false,
        status: 'draft',
        theme: form.theme,
        settings: form.settings,
        questions: []
      });
    }
    res.json(form);
  } catch (err) {
    console.error('[Form GET by-slug] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve form.' });
  }
});

// GET /api/forms/check-slug/:slug - Check if short link name is available
router.get('/check-slug/:slug', async (req, res) => {
  try {
    const rawSlug = req.params.slug;
    const cleanSlug = rawSlug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    if (cleanSlug.length < 2 || cleanSlug.length > 60) {
      return res.status(400).json({
        available: false,
        error: 'Short link must be between 2 and 60 characters.'
      });
    }

    const reserved = ['api', 'admin', 'auth', 'uploads', 'dashboard', 'settings', 'form', 'edit', 'landing', 'null', 'undefined'];
    if (reserved.includes(cleanSlug)) {
      return res.status(400).json({
        available: false,
        error: `"${cleanSlug}" is reserved. Please pick another unique name.`
      });
    }

    const formId = req.query.formId;
    const existing = await db.getFormBySlug(cleanSlug);
    if (existing && existing.id !== formId) {
      return res.json({
        available: false,
        error: 'This short link is already taken by another form.'
      });
    }

    return res.json({ available: true, slug: cleanSlug });
  } catch (err) {
    console.error('[Check Slug] Error:', err);
    res.status(500).json({ error: 'Failed to check short link availability.' });
  }
});

// POST /api/forms/:id/slug - Set, update, or remove custom short link slug
router.post('/:id/slug', authenticate, requireFormAccess('editor'), async (req, res) => {
  try {
    const form = req.form || (await db.getFormById(req.params.id));
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const { slug } = req.body;

    // If slug is empty/null, remove short link
    if (!slug || !String(slug).trim()) {
      form.customSlug = null;
      form.updatedAt = new Date().toISOString();
      await db.saveForm(form);
      return res.json({ success: true, customSlug: null });
    }

    const cleanSlug = String(slug).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');

    if (cleanSlug.length < 2 || cleanSlug.length > 60) {
      return res.status(400).json({ error: 'Short link must be between 2 and 60 characters.' });
    }

    const reserved = ['api', 'admin', 'auth', 'uploads', 'dashboard', 'settings', 'form', 'edit', 'landing', 'null', 'undefined'];
    if (reserved.includes(cleanSlug)) {
      return res.status(400).json({ error: `"${cleanSlug}" is a reserved name. Please pick another unique name.` });
    }

    // Check if another form is using this slug
    const existing = await db.getFormBySlug(cleanSlug);
    if (existing && existing.id !== req.params.id) {
      return res.status(409).json({ error: 'This short link name is already in use by another form. Please choose another unique name.' });
    }

    form.customSlug = cleanSlug;
    form.updatedAt = new Date().toISOString();
    await db.saveForm(form);

    return res.json({
      success: true,
      customSlug: cleanSlug,
      shortUrl: `/s/${cleanSlug}`
    });
  } catch (err) {
    console.error('[Set Slug] Error:', err);
    res.status(500).json({ error: 'Failed to save short link.' });
  }
});

// POST /api/forms/:id/publish - Publish or unpublish a form
router.post('/:id/publish', authenticate, requireFormAccess('editor'), async (req, res) => {
  try {
    const form = req.form || (await db.getFormById(req.params.id));
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const { customSlug, isPublished = true } = req.body;

    if (customSlug && String(customSlug).trim()) {
      const cleanSlug = String(customSlug).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
      const reserved = ['api', 'admin', 'auth', 'uploads', 'dashboard', 'settings', 'form', 'edit', 'landing', 'null', 'undefined'];
      if (!reserved.includes(cleanSlug)) {
        const existing = await db.getFormBySlug(cleanSlug);
        if (!existing || existing.id === form.id) {
          form.customSlug = cleanSlug;
        }
      }
    }

    form.isPublished = Boolean(isPublished);
    form.status = form.isPublished ? 'published' : 'draft';
    if (form.isPublished && !form.publishedAt) {
      form.publishedAt = new Date().toISOString();
    }
    form.updatedAt = new Date().toISOString();

    const saved = await db.saveForm(form);
    return res.json({
      success: true,
      form: saved,
      isPublished: saved.isPublished,
      status: saved.status,
      customSlug: saved.customSlug
    });
  } catch (err) {
    console.error('[Publish Form] Error:', err);
    return res.status(500).json({ error: 'Failed to update publication status.' });
  }
});

// GET /api/forms/check-user - Real-time lookup to verify if an email has a registered VoxForm account
router.get('/check-user', optionalAuth, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = await db.getUserByEmail(cleanEmail);
    if (!user) {
      return res.json({
        exists: false,
        message: `No VoxForm account found with email "${cleanEmail}". Users must have a VoxForm account to be added to a form.`
      });
    }
    return res.json({
      exists: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error('[Check User] Error:', err);
    res.status(500).json({ error: 'Failed to verify VoxForm user.' });
  }
});

// GET /api/forms/:id - Get form by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const form = await db.getFormById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }
    if (!canUserViewDraft(form, req.user)) {
      return res.json({
        id: form.id,
        title: form.title,
        description: form.description,
        isPublished: false,
        status: 'draft',
        theme: form.theme,
        settings: form.settings,
        questions: []
      });
    }
    res.json(form);
  } catch (err) {
    console.error('[Form GET :id] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve form.' });
  }
});

// PUT /api/forms/:id - Update form (autosave & manual save - requires editor role or owner)
router.put('/:id', authenticate, requireFormAccess('editor'), async (req, res) => {
  try {
    const existing = req.form || (await db.getFormById(req.params.id));
    if (!existing) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const updated = {
      ...existing,
      ...req.body,
      id: req.params.id,
      creatorId: existing.creatorId, // Protect original ownership
      collaborators: req.userFormRole === 'owner' && req.body.collaborators !== undefined
        ? req.body.collaborators
        : (existing.collaborators || []),
      updatedAt: new Date().toISOString()
    };

    const saved = await db.saveForm(updated);
    res.json(saved);
  } catch (err) {
    console.error('[Form PUT :id] Error:', err);
    res.status(500).json({ error: 'Failed to update form.' });
  }
});

// --- COLLABORATORS / ADD USERS API ---

// GET /api/forms/:id/collaborators - List all users added to a form
router.get('/:id/collaborators', authenticate, requireFormAccess('viewer'), async (req, res) => {
  try {
    const form = req.form || (await db.getFormById(req.params.id));
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    let creator = null;
    if (form.creatorId) {
      const creatorUser = await db.getUserById(form.creatorId);
      if (creatorUser) {
        creator = {
          id: creatorUser.id,
          name: creatorUser.name,
          email: creatorUser.email,
          avatarUrl: creatorUser.avatarUrl
        };
      }
    }
    if (!creator) {
      creator = {
        id: form.creatorId || 'creator',
        name: form.creatorName || 'Form Creator',
        email: form.creatorEmail || 'creator@voxform.ai',
        avatarUrl: null
      };
    }

    res.json({
      formId: form.id,
      title: form.title,
      creator,
      collaborators: form.collaborators || []
    });
  } catch (err) {
    console.error('[Collaborators GET] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve form collaborators.' });
  }
});

// POST /api/forms/:id/collaborators - Add a user with a VoxForm account to this form (owner only)
router.post('/:id/collaborators', authenticate, requireFormAccess('owner'), async (req, res) => {
  try {
    const form = req.form || (await db.getFormById(req.params.id));
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const { email, role = 'editor' } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please provide an email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify user has an existing VoxForm account
    const user = await db.getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json({
        error: `No VoxForm account found for "${cleanEmail}". Users must have a VoxForm account in order to be added to this form.`
      });
    }

    // Check if user is the form creator/owner
    if (form.creatorId && user.id === form.creatorId) {
      return res.status(400).json({
        error: `"${user.name || cleanEmail}" is already the creator of this form.`
      });
    }

    const currentCollaborators = Array.isArray(form.collaborators) ? form.collaborators : [];
    const alreadyAdded = currentCollaborators.find(c => 
      c.userId === user.id || (c.email && c.email.toLowerCase() === cleanEmail)
    );

    if (alreadyAdded) {
      return res.status(400).json({
        error: `"${user.name || cleanEmail}" is already added to this form.`
      });
    }

    const newCollaborator = {
      userId: user.id,
      name: user.name || cleanEmail.split('@')[0],
      email: user.email.toLowerCase(),
      avatarUrl: user.avatarUrl || null,
      role: role === 'viewer' ? 'viewer' : 'editor',
      addedAt: new Date().toISOString()
    };

    form.collaborators = [...currentCollaborators, newCollaborator];
    form.updatedAt = new Date().toISOString();
    await db.saveForm(form);

    res.status(201).json({
      success: true,
      collaborator: newCollaborator,
      collaborators: form.collaborators,
      message: `"${newCollaborator.name}" was successfully added to this form.`
    });
  } catch (err) {
    console.error('[Collaborators POST] Error:', err);
    res.status(500).json({ error: 'Failed to add user to form.' });
  }
});

// DELETE /api/forms/:id/collaborators/:userId - Remove a user from the form (owner only)
router.delete('/:id/collaborators/:userId', authenticate, requireFormAccess('owner'), async (req, res) => {
  try {
    const form = req.form || (await db.getFormById(req.params.id));
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const target = req.params.userId;
    const currentCollaborators = Array.isArray(form.collaborators) ? form.collaborators : [];
    form.collaborators = currentCollaborators.filter(c => 
      c.userId !== target && c.email?.toLowerCase() !== target.toLowerCase()
    );
    form.updatedAt = new Date().toISOString();
    await db.saveForm(form);

    res.json({
      success: true,
      collaborators: form.collaborators,
      message: 'User removed from form.'
    });
  } catch (err) {
    console.error('[Collaborators DELETE] Error:', err);
    res.status(500).json({ error: 'Failed to remove user from form.' });
  }
});

// PUT /api/forms/:id/collaborators/:userId - Update collaborator role (owner only)
router.put('/:id/collaborators/:userId', authenticate, requireFormAccess('owner'), async (req, res) => {
  try {
    const form = req.form || (await db.getFormById(req.params.id));
    if (!form) {
      return res.status(404).json({ error: 'Form not found.' });
    }

    const { role } = req.body;
    const target = req.params.userId;
    const currentCollaborators = Array.isArray(form.collaborators) ? form.collaborators : [];
    form.collaborators = currentCollaborators.map(c => {
      if (c.userId === target || c.email?.toLowerCase() === target.toLowerCase()) {
        return { ...c, role: role === 'viewer' ? 'viewer' : 'editor' };
      }
      return c;
    });
    form.updatedAt = new Date().toISOString();
    await db.saveForm(form);

    res.json({
      success: true,
      collaborators: form.collaborators
    });
  } catch (err) {
    console.error('[Collaborators PUT] Error:', err);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// DELETE /api/forms/:id - Delete form (owner only)
router.delete('/:id', authenticate, requireFormAccess('owner'), async (req, res) => {
  try {
    await db.deleteForm(req.params.id);
    res.json({ success: true, message: 'Form deleted successfully.' });
  } catch (err) {
    console.error('[Form DELETE :id] Error:', err);
    res.status(500).json({ error: 'Failed to delete form.' });
  }
});

// POST /api/forms/:id/duplicate - Duplicate form
router.post('/:id/duplicate', authenticate, requireFormAccess('viewer'), async (req, res) => {
  try {
    const original = req.form || (await db.getFormById(req.params.id));
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

    // Check if form is published
    const isPublished = form.isPublished !== undefined
      ? Boolean(form.isPublished)
      : form.status !== undefined
        ? form.status === 'published'
        : true;
    if (!isPublished) {
      return res.status(403).json({
        error: 'This form is currently in draft mode and not accepting public responses yet.'
      });
    }

    // Check if form has closed responses
    if (form.settings && form.settings.acceptingResponses === false) {
      return res.status(403).json({
        error: form.settings.closedMessage || 'This form is no longer accepting responses.'
      });
    }

    const { answers, voiceFieldStats } = req.body;

    // Normalize answers to map format whether client sends array or map
    let answersMap = {};
    if (Array.isArray(answers)) {
      answers.forEach(item => {
        if (item && item.questionId) {
          answersMap[item.questionId] = item.value;
        }
      });
    } else if (typeof answers === 'object' && answers !== null) {
      answersMap = { ...answers };
    }

    // Validate required fields
    const missingFields = [];
    if (form.questions) {
      for (const q of form.questions) {
        if (q.required) {
          const ans = answersMap[q.id];
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

    // If this VoxForm is linked to a Google Form, forward the response in real time
    let syncedToGoogleForm = false;
    if (form.googleFormConfig?.formResponseUrl) {
      const forwardResult = await googleFormsIntegrationService.forwardResponseToGoogleForm(form, answersMap);
      syncedToGoogleForm = Boolean(forwardResult.forwarded);
    }

    const responseRecord = {
      id: uuidv4(),
      formId: req.params.id,
      answers: answersMap,
      voiceFieldStats: voiceFieldStats || {},
      syncedToGoogleForm,
      submittedAt: new Date().toISOString()
    };

    const saved = await db.saveResponse(responseRecord);
    if (syncedToGoogleForm) {
      const syncedIds = form.googleFormConfig?.syncedResponseIds || [];
      form.googleFormConfig = {
        ...form.googleFormConfig,
        syncedResponseIds: Array.from(new Set([...syncedIds, saved.id]))
      };
      await db.saveForm(form);
    }

    res.status(201).json({
      success: true,
      responseId: saved.id,
      syncedToGoogleForm,
      confirmationMessage: form.settings?.confirmationMessage || 'Your response has been recorded.'
    });
  } catch (err) {
    console.error('[Response POST] Error:', err);
    res.status(500).json({ error: 'Failed to submit response.' });
  }
});

// GET /api/forms/:id/responses - Get all responses for a form (requires viewer permission or owner)
router.get('/:id/responses', authenticate, requireFormAccess('viewer'), async (req, res) => {
  try {
    const responses = await db.getResponsesByFormId(req.params.id);
    res.json(responses);
  } catch (err) {
    console.error('[Responses GET] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve responses.' });
  }
});

// GET /api/forms/:id/analytics - Aggregated analytics dashboard data (requires viewer permission or owner)
router.get('/:id/analytics', authenticate, requireFormAccess('viewer'), async (req, res) => {
  try {
    const form = req.form || (await db.getFormById(req.params.id));
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

      // File / Document Attachment type
      if (q.type === 'file_upload') {
        const fileResponses = responses
          .map(r => ({
            id: r.id,
            file: r.answers?.[q.id],
            submittedAt: r.submittedAt
          }))
          .filter(item => item.file !== undefined && item.file !== null && item.file !== '');

        return {
          questionId: q.id,
          title: q.title,
          type: q.type,
          fileConfig: q.fileConfig || {},
          responseCount: fileResponses.length,
          files: fileResponses.slice(0, 50)
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

// GET /api/forms/:id/export/csv - Export responses as CSV (requires viewer permission or owner)
router.get('/:id/export/csv', authenticate, requireFormAccess('viewer'), async (req, res) => {
  try {
    const form = req.form || (await db.getFormById(req.params.id));
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
        } else if (val && typeof val === 'object') {
          val = val.fileName || val.name || val.fileUrl || JSON.stringify(val);
        } else if (val === undefined || val === null) {
          val = '';
        } else {
          val = String(val);
        }

        // Neutralize CSV formula injection (=, +, -, @, \t, \r)
        let sanitized = val;
        if (/^[=+\-@\t\r]/.test(sanitized)) {
          sanitized = `'${sanitized}`;
        }
        row.push(`"${sanitized.replace(/"/g, '""')}"`);
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

// GET /api/forms/:id/export/json - Export responses as JSON (requires viewer permission or owner)
router.get('/:id/export/json', authenticate, requireFormAccess('viewer'), async (req, res) => {
  try {
    const form = req.form || (await db.getFormById(req.params.id));
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
