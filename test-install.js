#!/usr/bin/env node

// Simple installation test script
// Run with: node test-install.js

console.log('Testing worker-que installation...');

try {
  // Test basic import
  const { Client, Worker, JobInstance } = require('./dist/index.js');
  
  console.log('✅ Successfully imported worker-que modules');
  console.log('✅ Client class available:', typeof Client === 'function');
  console.log('✅ Worker class available:', typeof Worker === 'function');
  console.log('✅ JobInstance class available:', typeof JobInstance === 'function');
  
  // Test TypeScript definitions
  const fs = require('fs');
  const typeDefsExist = fs.existsSync('./dist/index.d.ts');
  console.log('✅ TypeScript definitions available:', typeDefsExist);
  
  console.log('\n🎉worker-que installation successful!');
  console.log('\nNext steps:');
  console.log('1. Set up PostgreSQL database');
  console.log('2. Run the schema from migrations/schema.sql');
  console.log('3. Check examples/basic-usage.ts for usage');
  
} catch (error) {
  console.error('❌ Installation test failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure you ran: npm run build');
  console.error('2. Check that dist/ directory exists');
  console.error('3. Verify all dependencies are installed');
  process.exit(1);
}