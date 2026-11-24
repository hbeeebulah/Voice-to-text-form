/**
 * Migration Script: Local JSON Store -> Cloud PostgreSQL (Supabase / Neon)
 * Run with: node server/src/db/migrateToPostgres.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATA_DIR = path.join(__dirname, '../../data');
const FORMS_FILE = path.join(DATA_DIR, 'forms.json');
const RESPONSES_FILE = path.join(DATA_DIR, 'responses.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is not set in server/.env.');
    console.error('Please add your Supabase URI (e.g. postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres) to server/.env');
    process.exit(1);
  }

  console.log('Connecting to cloud PostgreSQL...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query('SELECT NOW()');
    console.log('Connected successfully to cloud PostgreSQL!');

    console.log('Provisioning database tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS responses (
        id VARCHAR(255) PRIMARY KEY,
        form_id VARCHAR(255) NOT NULL,
        data JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        data JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL
      );
    `);
    console.log('Tables initialized.');

    // Migrate forms
    if (fs.existsSync(FORMS_FILE)) {
      const forms = JSON.parse(fs.readFileSync(FORMS_FILE, 'utf8') || '[]');
      console.log(`Migrating ${forms.length} forms...`);
      for (const form of forms) {
        await pool.query(
          'INSERT INTO forms (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
          [form.id, JSON.stringify(form)]
        );
      }
      console.log(`Successfully migrated ${forms.length} forms to cloud.`);
    }

    // Migrate responses
    if (fs.existsSync(RESPONSES_FILE)) {
      const responses = JSON.parse(fs.readFileSync(RESPONSES_FILE, 'utf8') || '[]');
      console.log(`Migrating ${responses.length} responses...`);
      for (const resp of responses) {
        await pool.query(
          'INSERT INTO responses (id, form_id, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = $3',
          [resp.id, resp.formId, JSON.stringify(resp)]
        );
      }
      console.log(`Successfully migrated ${responses.length} responses to cloud.`);
    }

    // Migrate users
    if (fs.existsSync(USERS_FILE)) {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
      console.log(`Migrating ${users.length} users...`);
      for (const user of users) {
        await pool.query(
          'INSERT INTO users (id, email, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET email = $2, data = $3',
          [user.id, (user.email || '').toLowerCase().trim(), JSON.stringify(user)]
        );
      }
      console.log(`Successfully migrated ${users.length} users to cloud.`);
    }

    // Migrate settings
    if (fs.existsSync(SETTINGS_FILE)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8') || '{}');
      await pool.query(
        "INSERT INTO settings (key, data) VALUES ('app_settings', $1) ON CONFLICT (key) DO UPDATE SET data = $1",
        [JSON.stringify(settings)]
      );
      console.log('Successfully migrated settings to cloud.');
    }

    console.log('\nAll local data has been successfully migrated to your cloud Supabase database!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
