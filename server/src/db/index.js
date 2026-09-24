const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../../data');
const FORMS_FILE = path.join(DATA_DIR, 'forms.json');
const RESPONSES_FILE = path.join(DATA_DIR, 'responses.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Default sample user so creators can test immediately (password: password123)
const defaultSampleUsers = [
  {
    id: 'user-demo-creator',
    name: 'Atabivajikpola',
    email: 'creator@voxform.ai',
    passwordHash: '$2b$10$8ZBiAw4PQYdkN9pdwmFjkOBcpX4AcmkKfnolNBe1uBFzzQLpiLoqi',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    provider: 'email',
    role: 'creator',
    createdAt: new Date().toISOString()
  }
];

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default sample form to get users started immediately
const defaultSampleForm = {
  id: 'customer-feedback-demo',
  title: 'Product Experience & Audio Feedback Survey',
  description: 'Thank you for taking a few moments to share your thoughts with us. Feel free to use the microphone button to dictate your thoughts effortlessly!',
  theme: {
    themeId: 'vibrant-gradient',
    accentColor: '#6366f1', // Indigo
    headerColor: '#4f46e5',
    backgroundColor: '#f8fafc',
    fontHeader: 'Inter',
    fontBody: 'Inter',
    headerBannerUrl: '',
    cardRoundness: 'rounded-2xl',
    buttonStyle: 'rounded-xl'
  },
  questions: [
    {
      id: 'q-name',
      title: 'What is your full name?',
      description: 'Your name or organization',
      type: 'short_answer',
      required: true,
      voiceEnabled: true,
      placeholder: 'e.g. Alex Morgan (speak or type)'
    },
    {
      id: 'q-role',
      title: 'What best describes your current role?',
      description: 'Select the category that matches closest',
      type: 'multiple_choice',
      required: true,
      options: [
        'Software Engineer / Developer',
        'Product Manager / Designer',
        'Business Executive / Founder',
        'Researcher / Academic',
        'Other'
      ]
    },
    {
      id: 'q-satisfaction',
      title: 'Overall, how satisfied are you with our platform?',
      description: 'Rate on a scale from 1 (Needs Improvement) to 5 (Delighted)',
      type: 'linear_scale',
      required: true,
      scaleConfig: {
        min: 1,
        max: 5,
        minLabel: 'Needs Improvement',
        maxLabel: 'Delighted'
      }
    },
    {
      id: 'q-features',
      title: 'Which features do you find most valuable?',
      description: 'Select all that apply',
      type: 'checkboxes',
      required: false,
      options: [
        'Voice-to-Text Multimodal Dictation',
        'Real-time Audio Waveform Visualizer',
        'Customizable Themes & Typography',
        'Interactive Analytics Dashboard',
        'Instant CSV / JSON Data Exports'
      ]
    },
    {
      id: 'q-experience-detailed',
      title: 'Describe your favorite experience or any challenges you faced',
      description: 'Click the microphone button to dictate naturally! The AI speech engine will automatically remove filler words and format your response beautifully.',
      type: 'paragraph',
      required: true,
      voiceEnabled: true,
      placeholder: 'Share your detailed thoughts by speaking or typing...'
    },
    {
      id: 'q-recommend',
      title: 'How likely are you to recommend us to a colleague?',
      description: 'Choose a frequency tier',
      type: 'dropdown',
      required: false,
      options: [
        'Extremely likely (Definitely)',
        'Very likely',
        'Somewhat likely',
        'Not likely at this time'
      ]
    }
  ],
  settings: {
    allowMultipleSubmissions: true,
    showProgressBar: true,
    confirmationMessage: 'Thank you! Your response has been recorded successfully. Our team has received your feedback.'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Seed sample responses so analytics dashboard is immediately interesting
const sampleResponses = [
  {
    id: 'resp-1',
    formId: 'customer-feedback-demo',
    submittedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    answers: {
      'q-name': 'Dr. Sarah Jenkins',
      'q-role': 'Researcher / Academic',
      'q-satisfaction': 5,
      'q-features': [
        'Voice-to-Text Multimodal Dictation',
        'Real-time Audio Waveform Visualizer',
        'Interactive Analytics Dashboard'
      ],
      'q-experience-detailed': 'The voice dictation is an absolute game-changer for field studies. Usually, taking notes while examining data is tedious, but being able to speak naturally without worrying about filler words made documentation effortless.',
      'q-recommend': 'Extremely likely (Definitely)'
    },
    voiceFieldStats: {
      'q-name': false,
      'q-experience-detailed': true
    }
  },
  {
    id: 'resp-2',
    formId: 'customer-feedback-demo',
    submittedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    answers: {
      'q-name': 'Marcus Vance',
      'q-role': 'Software Engineer / Developer',
      'q-satisfaction': 4,
      'q-features': [
        'Voice-to-Text Multimodal Dictation',
        'Instant CSV / JSON Data Exports'
      ],
      'q-experience-detailed': 'Form creation was intuitive and clean. Drag-and-drop reordering felt snappy and the voice transcription was remarkably quick at formatting clean sentences.',
      'q-recommend': 'Very likely'
    },
    voiceFieldStats: {
      'q-name': false,
      'q-experience-detailed': true
    }
  },
  {
    id: 'resp-3',
    formId: 'customer-feedback-demo',
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    answers: {
      'q-name': 'Elena Rostova',
      'q-role': 'Product Manager / Designer',
      'q-satisfaction': 5,
      'q-features': [
        'Voice-to-Text Multimodal Dictation',
        'Customizable Themes & Typography',
        'Interactive Analytics Dashboard'
      ],
      'q-experience-detailed': 'I tested the voice dictation with several rapid paragraphs and it handled pauses, capitalization, and punctuation seamlessly. The custom themes like Warm Pastel and Dark Executive look stunning.',
      'q-recommend': 'Extremely likely (Definitely)'
    },
    voiceFieldStats: {
      'q-name': true,
      'q-experience-detailed': true
    }
  }
];

class Database {
  constructor() {
    this.mode = 'json'; // 'json' | 'mongo' | 'postgres'
    this.init();
  }

  async init() {
    // Check if MongoDB URI is provided
    if (process.env.MONGODB_URI) {
      try {
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGODB_URI);
        this.mode = 'mongo';
        console.log('[DB] Connected successfully to MongoDB');
        this.initMongoModels(mongoose);
        return;
      } catch (err) {
        console.warn('[DB] MongoDB connection failed, falling back to local JSON store:', err.message);
      }
    }

    // Check if Postgres DATABASE_URL is provided
    if (process.env.DATABASE_URL) {
      try {
        const { Pool } = require('pg');
        this.pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
        await this.pgPool.query('SELECT NOW()');
        this.mode = 'postgres';
        console.log('[DB] Connected successfully to PostgreSQL');
        await this.initPostgresTables();
        return;
      } catch (err) {
        console.warn('[DB] PostgreSQL connection failed, falling back to local JSON store:', err.message);
      }
    }

    // Default: Persistent JSON file store
    this.mode = 'json';
    this.ensureJsonFiles();
    console.log('[DB] Using persistent JSON storage at:', DATA_DIR);
  }

  ensureJsonFiles() {
    if (!fs.existsSync(FORMS_FILE)) {
      fs.writeFileSync(FORMS_FILE, JSON.stringify([defaultSampleForm], null, 2), 'utf8');
    }
    if (!fs.existsSync(RESPONSES_FILE)) {
      fs.writeFileSync(RESPONSES_FILE, JSON.stringify(sampleResponses, null, 2), 'utf8');
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultSampleUsers, null, 2), 'utf8');
    }
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}, null, 2), 'utf8');
    }
  }

  readForms() {
    this.ensureJsonFiles();
    try {
      const data = fs.readFileSync(FORMS_FILE, 'utf8');
      return JSON.parse(data || '[]');
    } catch {
      return [defaultSampleForm];
    }
  }

  writeForms(forms) {
    fs.writeFileSync(FORMS_FILE, JSON.stringify(forms, null, 2), 'utf8');
  }

  readResponses() {
    this.ensureJsonFiles();
    try {
      const data = fs.readFileSync(RESPONSES_FILE, 'utf8');
      return JSON.parse(data || '[]');
    } catch {
      return [];
    }
  }

  writeResponses(responses) {
    fs.writeFileSync(RESPONSES_FILE, JSON.stringify(responses, null, 2), 'utf8');
  }

  readUsers() {
    this.ensureJsonFiles();
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data || '[]');
    } catch {
      return defaultSampleUsers;
    }
  }

  writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  }

  readSettings() {
    this.ensureJsonFiles();
    try {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data || '{}');
    } catch {
      return {};
    }
  }

  writeSettings(settings) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  }

  // --- CRUD API METHODS ---

  async getAllForms(filter = {}) {
    let forms = [];
    if (this.mode === 'mongo' && this.FormModel) {
      forms = await this.FormModel.find().sort({ updatedAt: -1 }).lean();
    } else if (this.mode === 'postgres' && this.pgPool) {
      const res = await this.pgPool.query('SELECT data FROM forms ORDER BY (data->>\'updatedAt\') DESC');
      forms = res.rows.map(r => r.data);
    } else {
      forms = this.readForms().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    if (filter && filter.creatorId) {
      return forms.filter(f => !f.creatorId || f.creatorId === filter.creatorId);
    }
    return forms;
  }

  async getFormById(id) {
    if (this.mode === 'mongo' && this.FormModel) {
      return await this.FormModel.findOne({ id }).lean();
    }
    if (this.mode === 'postgres' && this.pgPool) {
      const res = await this.pgPool.query('SELECT data FROM forms WHERE id = $1', [id]);
      return res.rows[0] ? res.rows[0].data : null;
    }
    const forms = this.readForms();
    return forms.find(f => f.id === id) || null;
  }

  async saveForm(formData) {
    const now = new Date().toISOString();
    const id = formData.id || uuidv4();
    const formRecord = {
      ...formData,
      id,
      creatorId: formData.creatorId !== undefined ? formData.creatorId : (formData.creatorId || null),
      creatorName: formData.creatorName || null,
      creatorEmail: formData.creatorEmail || null,
      updatedAt: now,
      createdAt: formData.createdAt || now
    };

    if (this.mode === 'mongo' && this.FormModel) {
      await this.FormModel.findOneAndUpdate({ id }, formRecord, { upsert: true, new: true });
      return formRecord;
    }
    if (this.mode === 'postgres' && this.pgPool) {
      await this.pgPool.query(
        'INSERT INTO forms (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
        [id, JSON.stringify(formRecord)]
      );
      return formRecord;
    }

    const forms = this.readForms();
    const existingIndex = forms.findIndex(f => f.id === id);
    if (existingIndex >= 0) {
      forms[existingIndex] = formRecord;
    } else {
      forms.unshift(formRecord);
    }
    this.writeForms(forms);
    return formRecord;
  }

  async deleteForm(id) {
    if (this.mode === 'mongo' && this.FormModel) {
      await this.FormModel.deleteOne({ id });
      await this.ResponseModel.deleteMany({ formId: id });
      return true;
    }
    if (this.mode === 'postgres' && this.pgPool) {
      await this.pgPool.query('DELETE FROM forms WHERE id = $1', [id]);
      await this.pgPool.query('DELETE FROM responses WHERE form_id = $1', [id]);
      return true;
    }

    let forms = this.readForms();
    forms = forms.filter(f => f.id !== id);
    this.writeForms(forms);

    let responses = this.readResponses();
    responses = responses.filter(r => r.formId !== id);
    this.writeResponses(responses);
    return true;
  }

  async getResponsesByFormId(formId) {
    if (this.mode === 'mongo' && this.ResponseModel) {
      return await this.ResponseModel.find({ formId }).sort({ submittedAt: -1 }).lean();
    }
    if (this.mode === 'postgres' && this.pgPool) {
      const res = await this.pgPool.query(
        'SELECT data FROM responses WHERE form_id = $1 ORDER BY (data->>\'submittedAt\') DESC',
        [formId]
      );
      return res.rows.map(r => r.data);
    }

    const responses = this.readResponses();
    return responses
      .filter(r => r.formId === formId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  async saveResponse(responseData) {
    const id = responseData.id || uuidv4();
    const record = {
      ...responseData,
      id,
      submittedAt: responseData.submittedAt || new Date().toISOString()
    };

    if (this.mode === 'mongo' && this.ResponseModel) {
      await this.ResponseModel.create(record);
      return record;
    }
    if (this.mode === 'postgres' && this.pgPool) {
      await this.pgPool.query(
        'INSERT INTO responses (id, form_id, data) VALUES ($1, $2, $3)',
        [id, record.formId, JSON.stringify(record)]
      );
      return record;
    }

    const responses = this.readResponses();
    responses.unshift(record);
    this.writeResponses(responses);
    return record;
  }

  async deleteResponse(id) {
    if (this.mode === 'mongo' && this.ResponseModel) {
      await this.ResponseModel.deleteOne({ id });
      return true;
    }
    if (this.mode === 'postgres' && this.pgPool) {
      await this.pgPool.query('DELETE FROM responses WHERE id = $1', [id]);
      return true;
    }

    let responses = this.readResponses();
    responses = responses.filter(r => r.id !== id);
    this.writeResponses(responses);
    return true;
  }

  // --- USER AUTH CRUD METHODS ---

  async getAllUsers() {
    if (this.mode === 'mongo' && this.UserModel) {
      return await this.UserModel.find().lean();
    }
    return this.readUsers();
  }

  async getUserById(id) {
    if (this.mode === 'mongo' && this.UserModel) {
      return await this.UserModel.findOne({ id }).lean();
    }
    const users = this.readUsers();
    return users.find(u => u.id === id) || null;
  }

  async getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    if (this.mode === 'mongo' && this.UserModel) {
      return await this.UserModel.findOne({ email: cleanEmail }).lean();
    }
    const users = this.readUsers();
    return users.find(u => u.email && u.email.toLowerCase() === cleanEmail) || null;
  }

  async getUserByGoogleId(googleId) {
    if (!googleId) return null;
    if (this.mode === 'mongo' && this.UserModel) {
      return await this.UserModel.findOne({ googleId }).lean();
    }
    const users = this.readUsers();
    return users.find(u => u.googleId === googleId) || null;
  }

  async saveUser(userData) {
    const id = userData.id || uuidv4();
    const record = {
      ...userData,
      id,
      email: (userData.email || '').trim().toLowerCase(),
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.mode === 'mongo' && this.UserModel) {
      await this.UserModel.findOneAndUpdate({ id }, record, { upsert: true, new: true });
      return record;
    }

    const users = this.readUsers();
    const existingIndex = users.findIndex(u => u.id === id || (u.email && u.email.toLowerCase() === record.email));
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...record };
    } else {
      users.unshift(record);
    }
    this.writeUsers(users);
    return record;
  }

  async updateUser(id, updates) {
    const user = await this.getUserById(id);
    if (!user) return null;
    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return await this.saveUser(updated);
  }

  async getSettings() {
    return this.readSettings();
  }

  async updateSettings(updates) {
    const current = this.readSettings();
    const merged = { ...current, ...updates };
    this.writeSettings(merged);
    return merged;
  }

  // Postgres helper
  async initPostgresTables() {
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS responses (
        id VARCHAR(255) PRIMARY KEY,
        form_id VARCHAR(255) NOT NULL,
        data JSONB NOT NULL
      );
    `);
  }

  // Mongo helper
  initMongoModels(mongoose) {
    const FormSchema = new mongoose.Schema({
      id: { type: String, unique: true, index: true },
      title: String,
      description: String,
      theme: Object,
      questions: Array,
      settings: Object,
      createdAt: String,
      updatedAt: String
    }, { strict: false });

    const ResponseSchema = new mongoose.Schema({
      id: { type: String, unique: true, index: true },
      formId: { type: String, index: true },
      answers: Object,
      voiceFieldStats: Object,
      submittedAt: String
    }, { strict: false });

    this.FormModel = mongoose.models.Form || mongoose.model('Form', FormSchema);
    this.ResponseModel = mongoose.models.Response || mongoose.model('Response', ResponseSchema);
  }
}

const db = new Database();
module.exports = db;
