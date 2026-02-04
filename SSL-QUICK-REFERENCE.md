# SSL Quick Reference

## Quick SSL Setup Examples

### 1. Basic SSL (No Certificates)

```typescript
import { Client } from 'que-ts';

const client = new Client({
  host: 'db.example.com',
  port: 5432,
  database: 'mydb',
  user: 'myuser',
  password: 'mypass',
  ssl: { rejectUnauthorized: true }
});
```

### 2. SSL with Client Certificates

```typescript
import * as fs from 'fs';

const client = new Client({
  host: 'db.example.com',
  port: 5432,
  database: 'mydb',
  user: 'myuser',
  password: 'mypass',
  ssl: {
    rejectUnauthorized: true,
    cert: fs.readFileSync('./client-cert.pem'),
    key: fs.readFileSync('./client-key.pem'),
    ca: fs.readFileSync('./ca-cert.pem'),
  }
});
```

### 3. Using Environment Variables

```typescript
// .env file:
// DB_SSL_CERT=/path/to/client-cert.pem
// DB_SSL_KEY=/path/to/client-key.pem
// DB_SSL_CA=/path/to/ca-cert.pem

import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    cert: fs.readFileSync(process.env.DB_SSL_CERT!),
    key: fs.readFileSync(process.env.DB_SSL_KEY!),
    ca: fs.readFileSync(process.env.DB_SSL_CA!),
  }
});
```

## Cloud Providers

### AWS RDS

```typescript
// Download CA bundle: https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
const client = new Client({
  host: 'instance.region.rds.amazonaws.com',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./rds-ca-bundle.pem'),
  }
});
```

### Google Cloud SQL

```typescript
const client = new Client({
  host: 'instance-ip',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./server-ca.pem'),
    cert: fs.readFileSync('./client-cert.pem'),
    key: fs.readFileSync('./client-key.pem'),
  }
});
```

### Azure PostgreSQL

```typescript
// Download cert: https://learn.microsoft.com/en-us/azure/postgresql/
const client = new Client({
  host: 'server.postgres.database.azure.com',
  user: 'user@server',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('./BaltimoreCyberTrustRoot.crt.pem'),
  }
});
```

### Heroku Postgres

```typescript
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Heroku uses self-signed
});
```

## Certificate File Permissions

```bash
chmod 600 client-key.pem      # Private key (read/write owner only)
chmod 644 client-cert.pem     # Certificate (readable by all)
chmod 644 ca-cert.pem          # CA certificate (readable by all)
```

## Generate Self-Signed Certificates (Dev/Testing)

```bash
# CA certificate
openssl req -new -x509 -days 365 -nodes -text \
  -out ca-cert.pem -keyout ca-key.pem

# Client certificate and key
openssl req -new -nodes -text \
  -out client.csr -keyout client-key.pem

openssl x509 -req -in client.csr -text -days 365 \
  -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial \
  -out client-cert.pem
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| "self signed certificate" | Add `ca` certificate or set `rejectUnauthorized: false` (dev only) |
| "unable to verify first certificate" | Include complete certificate chain in `ca` |
| "certificate has expired" | Renew certificates |
| "ENOENT: no such file" | Check file paths are correct and files exist |

## Test SSL Connection

```typescript
async function testConnection() {
  const client = new Client({
    host: 'your-host',
    ssl: {
      rejectUnauthorized: true,
      cert: fs.readFileSync('./client-cert.pem'),
      key: fs.readFileSync('./client-key.pem'),
      ca: fs.readFileSync('./ca-cert.pem'),
    }
  });

  try {
    const job = await client.enqueue('Test', []);
    console.log('✓ Connected! Job ID:', job.id);
    await client.close();
  } catch (err) {
    console.error('✗ Failed:', err.message);
  }
}
```

## Security Checklist

- [ ] Use `rejectUnauthorized: true` in production
- [ ] Never commit certificates to git
- [ ] Use environment variables for paths/secrets
- [ ] Set correct file permissions (600 for keys)
- [ ] Rotate certificates regularly
- [ ] Use strong key passphrases
- [ ] Add `*.pem`, `*.key`, `*.crt` to `.gitignore`

## Complete Example

```typescript
// config.ts
import { Client, SSLConfig } from 'que-ts';
import * as fs from 'fs';

export function createSecureClient(): Client {
  const sslConfig: SSLConfig = {
    rejectUnauthorized: true,
    cert: fs.readFileSync(process.env.DB_SSL_CERT || './certs/client-cert.pem'),
    key: fs.readFileSync(process.env.DB_SSL_KEY || './certs/client-key.pem'),
    ca: fs.readFileSync(process.env.DB_SSL_CA || './certs/ca-cert.pem'),
  };

  return new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'mydb',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? sslConfig : false,
    maxConnections: 10,
  });
}

// usage.ts
import { createSecureClient } from './config';

const client = createSecureClient();

async function main() {
  await client.enqueue('SendEmail', ['user@example.com']);
  await client.close();
}
```

---

For full documentation, see [SSL.md](SSL.md)
