#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const COMMANDS = ['migrate'] as const;
type Command = typeof COMMANDS[number];

function printUsage(): void {
  console.log(`
Usage: worker-que <command> [options]

Commands:
  migrate [dest]   Copy SQL migration files into your project.
                   dest defaults to ./migrations

Options:
  --force          Overwrite files that already exist
  --help           Show this help message
`.trim());
}

function migrate(args: string[]): void {
  const forceIdx = args.indexOf('--force');
  const force = forceIdx !== -1;
  if (force) args.splice(forceIdx, 1);

  const dest = path.resolve(process.cwd(), args[0] ?? 'migrations');
  const src  = path.join(__dirname, '..', 'migrations');

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
    console.log(`Created ${dest}`);
  }

  const files = fs.readdirSync(src).filter(f => f.endsWith('.sql'));
  let copied = 0;
  let skipped = 0;

  for (const file of files) {
    const destFile = path.join(dest, file);
    if (fs.existsSync(destFile) && !force) {
      console.log(`  skip    ${file}  (already exists — use --force to overwrite)`);
      skipped++;
    } else {
      fs.copyFileSync(path.join(src, file), destFile);
      console.log(`  copied  ${file}`);
      copied++;
    }
  }

  console.log(`\nDone. ${copied} copied, ${skipped} skipped.`);
}

function main(): void {
  const [, , command, ...rest] = process.argv;

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  if (!COMMANDS.includes(command as Command)) {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }

  if (command === 'migrate') migrate(rest);
}

main();
