#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const COMMANDS = ['migrate'];
function printUsage() {
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
function migrate(args) {
    const forceIdx = args.indexOf('--force');
    const force = forceIdx !== -1;
    if (force)
        args.splice(forceIdx, 1);
    const dest = path_1.default.resolve(process.cwd(), args[0] ?? 'migrations');
    const src = path_1.default.join(__dirname, '..', 'migrations');
    if (!fs_1.default.existsSync(dest)) {
        fs_1.default.mkdirSync(dest, { recursive: true });
        console.log(`Created ${dest}`);
    }
    const files = fs_1.default.readdirSync(src).filter(f => f.endsWith('.sql'));
    let copied = 0;
    let skipped = 0;
    for (const file of files) {
        const destFile = path_1.default.join(dest, file);
        if (fs_1.default.existsSync(destFile) && !force) {
            console.log(`  skip    ${file}  (already exists — use --force to overwrite)`);
            skipped++;
        }
        else {
            fs_1.default.copyFileSync(path_1.default.join(src, file), destFile);
            console.log(`  copied  ${file}`);
            copied++;
        }
    }
    console.log(`\nDone. ${copied} copied, ${skipped} skipped.`);
}
function main() {
    const [, , command, ...rest] = process.argv;
    if (!command || command === '--help' || command === '-h') {
        printUsage();
        process.exit(0);
    }
    if (!COMMANDS.includes(command)) {
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
    if (command === 'migrate')
        migrate(rest);
}
main();
//# sourceMappingURL=cli.js.map