// pg_notify_listener.js
// Listens to Postgres NOTIFY events on 'send-scheduled-notifications' and delivers notifications.
// Usage: node scripts/pg_notify_listener.js
//
// Requirements:
// - .env with DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL
// - pg and dotenv installed
//
// This script should be run as a separate process (e.g., pm2, systemd, or manually).

import dotenv from 'dotenv';
import pkg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch'; // npm install node-fetch

const { Client } = pkg;
dotenv.config();

const CHANNEL = 'send-scheduled-notifications';
const RETRY_DELAY_MS = 5000;

// Prefer DIRECT_URL for LISTEN/NOTIFY, fallback to DATABASE_URL
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || null;
if (!connectionString) {
  console.error('DIRECT_URL or DATABASE_URL is required in .env');
  process.exit(1);
}
console.log('[pg_notify_listener] Using connection string from', process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL');

let client;

async function connectAndListen() {
  console.log('[pg_notify_listener] Attempting to connect to Postgres...');
  client = new Client({ connectionString });
  client.on('error', err => {
    console.error('[pg_notify_listener] Client error:', err);
    reconnect();
  });

  try {
    await client.connect();
    console.log(`[pg_notify_listener] Connected to Postgres, listening on channel '${CHANNEL}'`);
    await client.query(`LISTEN "${CHANNEL}"`);
    console.log(`[pg_notify_listener] LISTEN query sent for channel '${CHANNEL}'`);
    client.on('notification', async msg => {
      console.log('[pg_notify_listener] Raw notification received:', msg);
      if (msg.channel !== CHANNEL) {
        console.log(`[pg_notify_listener] Ignored notification for channel: ${msg.channel}`);
        return;
      }
      try {
        const payload = JSON.parse(msg.payload);
        console.log('[pg_notify_listener] Notification received:', payload);
        await handleNotification(payload);
      } catch (err) {
        console.error('[pg_notify_listener] Failed to process notification payload:', err, msg.payload);
      }
    });
  } catch (err) {
    console.error('[pg_notify_listener] Connection error:', err);
    reconnect();
  }
}

async function reconnect() {
  if (client) {
    try { await client.end(); } catch {}
    client = null;
  }
  console.log(`[pg_notify_listener] Reconnecting in ${RETRY_DELAY_MS / 1000}s...`);
  setTimeout(connectAndListen, RETRY_DELAY_MS);
}

async function handleNotification(payload) {
  // Call Edge Function instead of direct DB insert
  const EDGE_FUNCTION_URL = process.env.EDGE_FUNCTION_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!EDGE_FUNCTION_URL || !SERVICE_ROLE_KEY) {
    console.error('[pg_notify_listener] EDGE_FUNCTION_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment. Skipping notification.');
    return;
  }

  console.log('[pg_notify_listener] Sending payload to Edge Function:', EDGE_FUNCTION_URL, payload);
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    console.log('[pg_notify_listener] Edge Function response:', response.status, data);
  } catch (err) {
    console.error('[pg_notify_listener] Failed to call Edge Function:', err, payload);
  }
}

// Start the listener
console.log('[pg_notify_listener] Starting listener...');
connectAndListen();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[pg_notify_listener] Shutting down...');
  if (client) await client.end();
  process.exit(0);
}); 