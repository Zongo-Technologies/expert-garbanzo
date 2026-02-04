import { Client, Worker } from '../src';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Example 1: Basic SSL with rejectUnauthorized
 * Use this for production with valid SSL certificates
 */
function basicSSLConnection() {
  const client = new Client({
    host: 'your-database-host.com',
    port: 5432,
    database: 'your_database',
    user: 'your_user',
    password: 'your_password',
    ssl: {
      rejectUnauthorized: true, // Verify server certificate (recommended for production)
    }
  });

  return client;
}

/**
 * Example 2: SSL with client certificates
 * Use this when your PostgreSQL server requires client certificate authentication
 */
function sslWithClientCertificates() {
  const client = new Client({
    host: 'your-database-host.com',
    port: 5432,
    database: 'your_database',
    user: 'your_user',
    password: 'your_password',
    ssl: {
      // Verify the server's certificate
      rejectUnauthorized: true,
      
      // Client certificate (required by server)
      cert: fs.readFileSync(path.join(__dirname, '../certs/client-cert.pem')),
      
      // Client private key (required by server)
      key: fs.readFileSync(path.join(__dirname, '../certs/client-key.pem')),
      
      // CA certificate to verify server certificate
      ca: fs.readFileSync(path.join(__dirname, '../certs/ca-cert.pem')),
    }
  });

  return client;
}

/**
 * Example 3: SSL with encrypted private key
 * Use this when your private key is password-protected
 */
function sslWithEncryptedKey() {
  const client = new Client({
    host: 'your-database-host.com',
    port: 5432,
    database: 'your_database',
    user: 'your_user',
    password: 'your_password',
    ssl: {
      rejectUnauthorized: true,
      cert: fs.readFileSync(path.join(__dirname, '../certs/client-cert.pem')),
      key: fs.readFileSync(path.join(__dirname, '../certs/client-key-encrypted.pem')),
      ca: fs.readFileSync(path.join(__dirname, '../certs/ca-cert.pem')),
      passphrase: 'your-private-key-passphrase', // Passphrase for encrypted key
    }
  });

  return client;
}

/**
 * Example 4: SSL with multiple CA certificates
 * Use this when you need to trust multiple certificate authorities
 */
function sslWithMultipleCAs() {
  const client = new Client({
    host: 'your-database-host.com',
    port: 5432,
    database: 'your_database',
    user: 'your_user',
    password: 'your_password',
    ssl: {
      rejectUnauthorized: true,
      cert: fs.readFileSync(path.join(__dirname, '../certs/client-cert.pem')),
      key: fs.readFileSync(path.join(__dirname, '../certs/client-key.pem')),
      ca: [
        fs.readFileSync(path.join(__dirname, '../certs/ca-cert-1.pem')),
        fs.readFileSync(path.join(__dirname, '../certs/ca-cert-2.pem')),
      ],
    }
  });

  return client;
}

/**
 * Example 5: SSL with connection string
 * PostgreSQL connection string with SSL mode
 */
function sslWithConnectionString() {
  // For sslmode=require
  const client1 = new Client({
    connectionString: 'postgresql://user:password@host:5432/database?sslmode=require',
    ssl: {
      rejectUnauthorized: true,
    }
  });

  // With certificate paths (requires loading files separately)
  const client2 = new Client({
    connectionString: 'postgresql://user:password@host:5432/database?sslmode=require',
    ssl: {
      rejectUnauthorized: true,
      cert: fs.readFileSync('/path/to/client-cert.pem'),
      key: fs.readFileSync('/path/to/client-key.pem'),
      ca: fs.readFileSync('/path/to/ca-cert.pem'),
    }
  });

  return client2;
}

/**
 * Example 6: Development/Testing - SSL without certificate verification
 * WARNING: Only use this in development. Never in production!
 */
function sslDevelopmentMode() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'test_database',
    user: 'test_user',
    password: 'test_password',
    ssl: {
      rejectUnauthorized: false, // ⚠️ Not secure - only for development
    }
  });

  return client;
}

/**
 * Example 7: Using environment variables for configuration
 * Recommended approach for production
 */
function sslWithEnvironmentVariables() {
  const sslConfig = process.env.DB_SSL_ENABLED === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    cert: process.env.DB_SSL_CERT ? fs.readFileSync(process.env.DB_SSL_CERT) : undefined,
    key: process.env.DB_SSL_KEY ? fs.readFileSync(process.env.DB_SSL_KEY) : undefined,
    ca: process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA) : undefined,
    passphrase: process.env.DB_SSL_PASSPHRASE,
  } : false;

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: sslConfig,
  });

  return client;
}

/**
 * Example 8: Worker with SSL configuration
 */
function workerWithSSL() {
  const worker = new Worker({
    host: 'your-database-host.com',
    port: 5432,
    database: 'your_database',
    user: 'your_user',
    password: 'your_password',
    ssl: {
      rejectUnauthorized: true,
      cert: fs.readFileSync(path.join(__dirname, '../certs/client-cert.pem')),
      key: fs.readFileSync(path.join(__dirname, '../certs/client-key.pem')),
      ca: fs.readFileSync(path.join(__dirname, '../certs/ca-cert.pem')),
    }
  }, {
    queue: 'default',
    interval: 5000,
  });

  return worker;
}

// Usage example
async function main() {
  // Choose the appropriate connection method based on your setup
  const client = sslWithEnvironmentVariables();

  try {
    // Enqueue a job
    const job = await client.enqueue('SendEmail', [{ to: 'user@example.com' }]);
    console.log('Job enqueued:', job.id);
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await client.close();
  }
}

// Uncomment to run the example
// main().catch(console.error);

export {
  basicSSLConnection,
  sslWithClientCertificates,
  sslWithEncryptedKey,
  sslWithMultipleCAs,
  sslWithConnectionString,
  sslDevelopmentMode,
  sslWithEnvironmentVariables,
  workerWithSSL,
};
