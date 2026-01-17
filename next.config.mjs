import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

// Load .env.local file explicitly for Turbopack compatibility
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  // Try dotenv first
  const dotenvResult = config({ path: envPath });
  
  // Fallback: manually parse if dotenv fails
  if (!dotenvResult.parsed || Object.keys(dotenvResult.parsed || {}).length === 0) {
    try {
      const content = readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length > 0) {
            const value = values.join('=').trim();
            if (value && !process.env[key.trim()]) {
              process.env[key.trim()] = value;
            }
          }
        }
      });
      console.log('✅ Manually loaded .env.local file');
    } catch (error) {
      console.warn('⚠️ Error loading .env.local:', error.message);
    }
  } else {
    console.log('✅ Loaded .env.local via dotenv');
  }
} else {
  console.warn('⚠️ .env.local file not found at:', envPath);
}

// Debug: Check what env vars are available
const firebaseEnvVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug logging
console.log('🔍 Env vars in next.config.mjs:');
Object.entries(firebaseEnvVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value ? '✓ ' + (typeof value === 'string' ? value.substring(0, 30) + '...' : 'Set') : '✗ Missing'}`);
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly expose NEXT_PUBLIC_* env vars for Turbopack compatibility
  env: firebaseEnvVars,
};

export default nextConfig;
