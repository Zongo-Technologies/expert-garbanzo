# SSL/TLS Configuration Guide

This guide explains how to configure SSL/TLS connections to PostgreSQL with client certificates.

## Table of Contents

- [Basic SSL Connection](#basic-ssl-connection)
- [SSL with Client Certificates](#ssl-with-client-certificates)
- [Certificate File Formats](#certificate-file-formats)
- [Environment Variables](#environment-variables)
- [Common SSL Modes](#common-ssl-modes)
- [Troubleshooting](#troubleshooting)

## Basic SSL Connection

### Simple SSL (sslmode=require)

```typescript
import { Client } from 'que-ts';

const client = new Client({
  host: 'your-database-host.com',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  ssl: {
    rejectUnauthorized: true, // Verify server certificate
  }
});
```

### SSL without Certificate Verification (Development Only)

⚠️ **WARNING:** Only use this in development environments!

```typescript
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'test_db',
  user: 'test_user',
  password: 'test_password',
  ssl: {
    rejectUnauthorized: false, // Skip certificate verification
  }
});
```

## SSL with Client Certificates

### Using Certificate Files

```typescript
import { Client } from 'que-ts';
import * as fs from 'fs';
import * as path from 'path';

const client = new Client({
  host: 'your-database-host.com',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  ssl: {
    // Verify the server's certificate
    rejectUnauthorized: true,
    
    // Client certificate (.crt or .pem)
    cert: fs.readFileSync(path.join(__dirname, 'certs/client-cert.pem')),
    
    // Client private key (.key)
    key: fs.readFileSync(path.join(__dirname, 'certs/client-key.pem')),
    
    // CA certificate to verify server
    ca: fs.readFileSync(path.join(__dirname, 'certs/ca-cert.pem')),
  }
});
```

### Using Certificate Paths (Alternative)

You can also pass file paths directly if using string buffers:

```typescript
import * as fs from 'fs';

const client = new Client({
  host: 'your-database-host.com',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  ssl: {
    rejectUnauthorized: true,
    cert: fs.readFileSync('/path/to/client-cert.pem'),
    key: fs.readFileSync('/path/to/client-key.pem'),
    ca: fs.readFileSync('/path/to/ca-cert.pem'),
  }
});
```

### Encrypted Private Key

If your private key is password-protected:

```typescript
const client = new Client({
  host: 'your-database-host.com',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  ssl: {
    rejectUnauthorized: true,
    cert: fs.readFileSync('./certs/client-cert.pem'),
    key: fs.readFileSync('./certs/client-key-encrypted.pem'),
    ca: fs.readFileSync('./certs/ca-cert.pem'),
    passphrase: 'your-private-key-passphrase', // Passphrase for the key
  }
});
```

### Multiple CA Certificates

If you need to trust multiple certificate authorities:

```typescript
const client = new Client({
  host: 'your-database-host.com',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  ssl: {
    rejectUnauthorized: true,
    cert: fs.readFileSync('./certs/client-cert.pem'),
    key: fs.readFileSync('./certs/client-key.pem'),
    ca: [
      fs.readFileSync('./certs/ca-cert-1.pem'),
      fs.readFileSync('./certs/ca-cert-2.pem'),
    ],
  }
});
```

## Certificate File Formats

### Supported Formats

- **PEM** (`.pem`, `.crt`, `.cer`, `.key`) - Most common, text-based format
- **DER** (`.der`) - Binary format (less common)

### PEM File Structure

A PEM file looks like this:

```
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKZ...
...
-----END CERTIFICATE-----
```

### Typical Certificate Files

| File | Description | Example Name |
|------|-------------|--------------|
| CA Certificate | Certificate Authority (verifies server) | `ca-cert.pem`, `root.crt` |
| Client Certificate | Your client certificate | `client-cert.pem`, `postgresql.crt` |
| Client Key | Your private key | `client-key.pem`, `postgresql.key` |

### Obtaining Certificates

**From PostgreSQL Server:**
```bash
# Server certificates are usually in:
/var/lib/postgresql/data/
# Or
/etc/postgresql/<version>/main/
```

**Generate Self-Signed Certificates (Development):**
```bash
# Generate CA key and certificate
openssl req -new -x509 -days 365 -nodes -text \
  -out ca-cert.pem -keyout ca-key.pem

# Generate server key and certificate request
openssl req -new -nodes -text -out server.csr -keyout server-key.pem

# Sign server certificate with CA
openssl x509 -req -in server.csr -text -days 365 \
  -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial \
  -out server-cert.pem

# Generate client key and certificate request
openssl req -new -nodes -text -out client.csr -keyout client-key.pem

# Sign client certificate with CA
openssl x509 -req -in client.csr -text -days 365 \
  -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial \
  -out client-cert.pem
```

## Environment Variables

### Recommended Production Setup

Create a `.env` file:

```bash
# Database connection
DB_HOST=your-database-host.com
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password

# SSL Configuration
DB_SSL_ENABLED=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CERT=/path/to/certs/client-cert.pem
DB_SSL_KEY=/path/to/certs/client-key.pem
DB_SSL_CA=/path/to/certs/ca-cert.pem
DB_SSL_PASSPHRASE=your-key-passphrase  # Optional
```

### Using Environment Variables in Code

```typescript
import { Client } from 'que-ts';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

function createClient() {
  const sslConfig = process.env.DB_SSL_ENABLED === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    cert: process.env.DB_SSL_CERT ? fs.readFileSync(process.env.DB_SSL_CERT) : undefined,
    key: process.env.DB_SSL_KEY ? fs.readFileSync(process.env.DB_SSL_KEY) : undefined,
    ca: process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA) : undefined,
    passphrase: process.env.DB_SSL_PASSPHRASE,
  } : false;

  return new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: sslConfig,
  });
}

const client = createClient();
```

## Common SSL Modes

PostgreSQL supports different SSL modes. Here's how to configure them:

| SSL Mode | Description | Configuration |
|----------|-------------|---------------|
| `disable` | No SSL | `ssl: false` |
| `prefer` | Try SSL, fallback to non-SSL | Not directly supported (use `require`) |
| `require` | SSL required, no cert verification | `ssl: { rejectUnauthorized: false }` |
| `verify-ca` | SSL with CA verification | `ssl: { rejectUnauthorized: true, ca: ... }` |
| `verify-full` | SSL with full verification | `ssl: { rejectUnauthorized: true, ca: ..., checkServerIdentity: ... }` |

### Example: verify-ca Mode

```typescript
const client = new Client({
  host: 'your-database-host.com',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./certs/ca-cert.pem'),
  }
});
```

### Example: verify-full Mode

```typescript
const client = new Client({
  host: 'your-database-host.com',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./certs/ca-cert.pem'),
    // Optional: custom server identity check
    checkServerIdentity: (hostname, cert) => {
      // Custom validation logic
      if (hostname !== 'expected-hostname.com') {
        throw new Error('Hostname mismatch');
      }
    },
  }
});
```

## Cloud Provider Examples

### AWS RDS

```typescript
import { Client } from 'que-ts';
import * as https from 'https';

// Download RDS CA bundle from:
// https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

const client = new Client({
  host: 'your-instance.region.rds.amazonaws.com',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./rds-ca-bundle.pem'),
  }
});
```

### Google Cloud SQL

```typescript
const client = new Client({
  host: '/cloudsql/project:region:instance', // Unix socket
  // Or use IP with SSL:
  // host: 'your-instance-ip',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./server-ca.pem'),
    cert: fs.readFileSync('./client-cert.pem'),
    key: fs.readFileSync('./client-key.pem'),
  }
});
```

### Azure Database for PostgreSQL

```typescript
const client = new Client({
  host: 'your-server.postgres.database.azure.com',
  port: 5432,
  database: 'your_database',
  user: 'your_user@your-server',
  password: 'your_password',
  ssl: {
    rejectUnauthorized: true,
    // Azure root certificate
    ca: fs.readFileSync('./BaltimoreCyberTrustRoot.crt.pem'),
  }
});
```

### Heroku Postgres

```typescript
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Heroku uses self-signed certificates
  }
});
```

## Troubleshooting

### Error: "self signed certificate"

```
Error: self signed certificate
```

**Solution:** Set `rejectUnauthorized: false` (development only) or add the CA certificate:

```typescript
ssl: {
  rejectUnauthorized: true,
  ca: fs.readFileSync('./ca-cert.pem'),
}
```

### Error: "unable to verify the first certificate"

```
Error: unable to verify the first certificate
```

**Solution:** Add the complete certificate chain:

```typescript
ssl: {
  rejectUnauthorized: true,
  ca: [
    fs.readFileSync('./root-ca.pem'),
    fs.readFileSync('./intermediate-ca.pem'),
  ],
}
```

### Error: "certificate has expired"

```
Error: certificate has expired
```

**Solution:** Renew your certificates. For development, generate new self-signed certificates.

### Error: "ENOENT: no such file or directory"

```
Error: ENOENT: no such file or directory, open './certs/client-cert.pem'
```

**Solution:** Check that certificate file paths are correct:

```typescript
import * as path from 'path';

// Use absolute path
const certPath = path.join(__dirname, 'certs', 'client-cert.pem');
console.log('Certificate path:', certPath);
const cert = fs.readFileSync(certPath);
```

### Error: "sslmode value 'require' invalid"

If using a connection string, SSL configuration must be in the config object:

```typescript
// ✗ Wrong - sslmode in connection string doesn't configure node-postgres properly
const client = new Client({
  connectionString: 'postgresql://user:pass@host/db?sslmode=require'
});

// ✓ Correct - use ssl config object
const client = new Client({
  connectionString: 'postgresql://user:pass@host/db',
  ssl: {
    rejectUnauthorized: true,
  }
});
```

### Testing SSL Connection

```typescript
import { Client } from 'que-ts';

async function testSSLConnection() {
  const client = new Client({
    host: 'your-host.com',
    port: 5432,
    database: 'your_database',
    user: 'your_user',
    password: 'your_password',
    ssl: {
      rejectUnauthorized: true,
      cert: fs.readFileSync('./client-cert.pem'),
      key: fs.readFileSync('./client-key.pem'),
      ca: fs.readFileSync('./ca-cert.pem'),
    }
  });

  try {
    const job = await client.enqueue('TestJob', []);
    console.log('✓ SSL connection successful! Job ID:', job.id);
    await client.close();
  } catch (error) {
    console.error('✗ SSL connection failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testSSLConnection();
```

## Security Best Practices

1. **Always use `rejectUnauthorized: true` in production**
2. **Never commit certificates or private keys to version control**
3. **Use environment variables for sensitive data**
4. **Rotate certificates regularly**
5. **Use strong passphrases for encrypted keys**
6. **Restrict file permissions on certificate files:**
   ```bash
   chmod 600 client-key.pem
   chmod 644 client-cert.pem
   chmod 644 ca-cert.pem
   ```
7. **Store certificates securely** (e.g., AWS Secrets Manager, HashiCorp Vault)

## Additional Resources

- [PostgreSQL SSL Documentation](https://www.postgresql.org/docs/current/ssl-tcp.html)
- [Node.js TLS Documentation](https://nodejs.org/api/tls.html)
- [node-postgres SSL Guide](https://node-postgres.com/features/ssl)
