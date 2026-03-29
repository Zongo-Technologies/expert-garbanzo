# Changelog

All notable changes to worker-que will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-12

### Added

#### Core Features
- **Job Queue System** - PostgreSQL-backed job queue with advisory locks
- **Client API** - Enqueue jobs with priority, scheduling, and queue support
- **Worker API** - Process jobs with configurable polling and retry logic
- **Transaction Support** - Enqueue jobs within database transactions
- **Multiple Queues** - Support for named queues and priorities
- **Automatic Retries** - Exponential backoff for failed jobs
- **TypeScript Support** - Full type safety with comprehensive type definitions

#### Dashboard
- **Real-time Web UI** - Monitor and manage jobs through web interface
- **Statistics Dashboard** - View total, ready, scheduled, and failed jobs
- **Visual Analytics** - Charts showing distribution by queue and job class
- **Job Management** - Filter, search, retry, and delete jobs
- **Recent Failures** - View and manage recently failed jobs
- **Authentication Support** - Flexible authentication with custom auth functions
- **Responsive Design** - Mobile-friendly interface

#### Security
- **SSL/TLS Support** - Secure connections with client certificates
- **Client Certificate Auth** - Support for mutual TLS authentication
- **CA Verification** - Verify server certificates against CA bundle
- **Encrypted Keys** - Support for passphrase-protected private keys
- **Cloud Provider Support** - Pre-configured for AWS RDS, Google Cloud SQL, Azure

#### Documentation
- **Complete README** - Comprehensive getting started guide
- **Dashboard Guide** - Full dashboard documentation with examples
- **SSL Configuration** - Detailed SSL/TLS setup instructions
- **Contributing Guide** - Guidelines for contributors
- **Docker Setup** - Container deployment instructions
- **TypeScript Examples** - Working code examples

### Features in Detail

#### Client
- `enqueue()` - Add jobs to queue
- `enqueueInTx()` - Add jobs in transaction
- `lockJob()` - Lock next available job
- `close()` - Graceful shutdown
- Connection pooling with configurable pool size

#### Worker
- `register()` - Register job handlers
- `work()` - Continuous job processing
- `workOne()` - Process single job
- `shutdown()` - Graceful shutdown
- Configurable polling interval
- Queue-specific workers

#### Job Instance
- `done()` - Mark job as completed
- `error()` - Mark job as failed with retry
- `delete()` - Remove job from queue
- Full job metadata access

#### Dashboard API
- `GET /api/stats` - Queue statistics
- `GET /api/jobs` - Paginated job list with filters
- `GET /api/jobs/:id` - Job details
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/retry` - Retry failed job
- `GET /api/queues` - List all queues
- `GET /api/job-classes` - List all job classes

### Technical Details

- **Node.js**: >=16.0.0
- **PostgreSQL**: >=10
- **TypeScript**: 5.2
- **Dependencies**: pg, typescript
- **Peer Dependencies**: express (optional, for dashboard)

### Cross-Language Compatibility

- Compatible with Ruby Que
- Compatible with que-go
- Shared PostgreSQL schema

---

## Future Releases

See [GitHub Issues](https://github.com/your-username/worker-que/issues) for planned features and improvements.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute.

## License

[MIT](./LICENSE)
