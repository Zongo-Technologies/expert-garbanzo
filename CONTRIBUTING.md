# Contributing to worker-que

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to worker-que.

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- PostgreSQL >= 10
- Docker (optional, for development)

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/worker-que.git
   cd worker-que
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL (using Docker)**
   ```bash
   npm run docker:up
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Build the project**
   ```bash
   npm run build
   ```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with debugging
npm run test:debug
```

### Building

```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Clean build artifacts
npm run clean
```

### Linting

```bash
# Run linter
npm run lint

# Fix linting errors
npm run lint:fix
```

## Project Structure

```
worker-que/
├── src/                    # Source code
│   ├── client.ts          # Client for enqueueing jobs
│   ├── worker.ts          # Worker for processing jobs
│   ├── job.ts             # Job instance class
│   ├── types.ts           # TypeScript type definitions
│   ├── utils.ts           # Utility functions
│   ├── sql.ts             # SQL queries
│   └── dashboard/         # Dashboard module
│       ├── index.ts       # Express router
│       ├── service.ts     # Business logic
│       └── views.ts       # HTML templates
├── tests/                 # Test files
├── examples/              # Example applications
├── migrations/            # SQL migrations
└── dist/                  # Compiled JavaScript
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new features
- Update documentation as needed

### 3. Run Tests

```bash
npm test
npm run lint
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat: add new retry strategy"

# Bug fixes
git commit -m "fix: resolve connection pool leak"

# Documentation
git commit -m "docs: update dashboard setup guide"

# Tests
git commit -m "test: add tests for worker shutdown"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Pull Request Guidelines

### Before Submitting

- [ ] Tests pass locally
- [ ] Code is linted
- [ ] Documentation is updated
- [ ] Examples are updated (if applicable)
- [ ] CHANGELOG is updated (for notable changes)

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How have you tested these changes?

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Examples updated
```

## Code Style

### TypeScript

- Use TypeScript for all source files
- Provide proper type annotations
- Avoid `any` types when possible
- Use interfaces for public APIs

### Naming Conventions

- **Classes**: PascalCase (`Client`, `Worker`)
- **Interfaces**: PascalCase (`ClientConfig`, `Job`)
- **Functions**: camelCase (`enqueue`, `lockJob`)
- **Constants**: UPPER_SNAKE_CASE (`SQL_QUERIES`)
- **Files**: kebab-case (`dashboard-service.ts`)

### Code Organization

- Keep functions small and focused
- Use async/await over promises
- Handle errors appropriately
- Add JSDoc comments for public APIs

### Example

```typescript
/**
 * Enqueues a new job to the queue
 * 
 * @param jobClass - The job class name
 * @param args - Job arguments as JSON array
 * @param options - Enqueue options (priority, queue, runAt)
 * @returns Promise resolving to the created job
 */
async enqueue(
  jobClass: string,
  args: JSONArray = [],
  options: EnqueueOptions = {}
): Promise<Job> {
  // Implementation
}
```

## Testing Guidelines

### Test Structure

```typescript
describe('Feature', () => {
  beforeEach(async () => {
    // Setup
  });

  afterEach(async () => {
    // Cleanup
  });

  it('should do something', async () => {
    // Arrange
    const input = createTestData();
    
    // Act
    const result = await doSomething(input);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

### Test Coverage

- Aim for >80% code coverage
- Test happy paths and error cases
- Test edge cases
- Test concurrent scenarios for workers

### Running Specific Tests

```bash
# Run specific file
npm test -- client.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should enqueue"
```

## Documentation

### README Updates

- Keep README concise and focused
- Include working code examples
- Update badges if needed

### API Documentation

- Document all public APIs with JSDoc
- Include parameter types and descriptions
- Provide usage examples
- Document return values and errors

### Examples

- Keep examples simple and focused
- Make examples runnable
- Include comments explaining key concepts

## Reporting Issues

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, PostgreSQL version)
- Error messages and stack traces

### Feature Requests

Include:
- Clear description of the feature
- Use cases and motivation
- Proposed API (if applicable)
- Alternatives considered

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Commit changes
4. Create git tag: `git tag v1.x.x`
5. Push with tags: `git push --tags`
6. Publish to npm: `npm publish`
7. Create GitHub release

## Questions?

- Open an issue for questions
- Join discussions on GitHub
- Check existing documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to worker-que! 🎉
