#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const isWin = process.platform === 'win32';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q, def) => new Promise(r => rl.question(`${q}${def ? ` (${def})` : ''}: `, a => r(a.trim() || def || '')));

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(msg, color = '') { console.log(`${color}${msg}${colors.reset}`); }
function step(n, msg) { log(`\n[${'='.repeat(n)}${'·'.repeat(6-n)}] Schritt ${n}/6: ${msg}`, colors.bold + colors.blue); }
function ok(msg) { log(`  ✓ ${msg}`, colors.green); }
function warn(msg) { log(`  ! ${msg}`, colors.yellow); }
function fail(msg) { log(`  ✗ ${msg}`, colors.red); }

function commandExists(cmd) {
  try {
    execSync(isWin ? `where ${cmd}` : `which ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch { return false; }
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
  } catch (e) {
    if (!opts.ignoreError) throw e;
    return e.stdout || '';
  }
}

async function main() {
  console.clear();
  log('╔══════════════════════════════════════════════════════╗', colors.blue);
  log('║      🛡️  Datenschutz-Tool - Installation            ║', colors.blue);
  log('║      DSGVO Compliance Manager                       ║', colors.blue);
  log('╚══════════════════════════════════════════════════════╝', colors.blue);
  log('');

  const isDemo = process.argv.includes('--demo');
  const skipPrompts = process.argv.includes('--yes') || process.argv.includes('-y');

  // ─── Schritt 1: Voraussetzungen ─────────────────────────────
  step(1, 'Voraussetzungen prüfen');

  // Node.js
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1));
  if (nodeMajor < 18) {
    fail(`Node.js ${nodeVersion} ist zu alt. Mindestens v18 erforderlich.`);
    process.exit(1);
  }
  ok(`Node.js ${nodeVersion}`);

  // npm
  if (!commandExists('npm')) {
    fail('npm nicht gefunden. Bitte Node.js neu installieren.');
    process.exit(1);
  }
  const npmVersion = run('npm --version', { silent: true }).trim();
  ok(`npm ${npmVersion}`);

  // ─── Schritt 2: Abhängigkeiten installieren ──────────────────
  step(2, 'Abhängigkeiten installieren');
  log('  Installiere npm-Pakete...', colors.dim);
  run('npm install', { cwd: __dirname });
  ok('npm install abgeschlossen');

  // ─── Schritt 3: Konfiguration ───────────────────────────────
  step(3, 'Konfiguration');

  let port = '3000';
  let appUrl = 'http://localhost:3000';

  if (!skipPrompts) {
    port = await ask('  Port für die Anwendung', '3000');
    appUrl = await ask('  URL der Anwendung', `http://localhost:${port}`);
  }

  const envContent = [
    '# Datenschutz-Tool Konfiguration',
    `# Generiert am ${new Date().toISOString().split('T')[0]}`,
    '',
    '# Datenbank (SQLite - keine weitere Konfiguration nötig)',
    'DATABASE_URL="file:./dev.db"',
    '',
    '# Anwendung',
    `APP_PORT=${port}`,
    `APP_URL=${appUrl}`,
    '',
  ].join('\n');

  fs.writeFileSync(path.join(__dirname, '.env'), envContent, 'utf-8');
  ok(`.env Datei erstellt (Port: ${port})`);

  // ─── Schritt 4: Datenbank einrichten ────────────────────────
  step(4, 'Datenbank einrichten');

  log('  Generiere Prisma Client...', colors.dim);
  run('npx prisma generate', { cwd: __dirname });
  ok('Prisma Client generiert');

  log('  Führe Datenbankmigrationen aus...', colors.dim);
  const dbPath = path.join(__dirname, 'dev.db');
  const dbExists = fs.existsSync(dbPath);

  if (dbExists) {
    warn('Datenbank existiert bereits. Migrationen werden angewendet.');
  }

  run('npx prisma migrate deploy', { cwd: __dirname, ignoreError: true });
  // Falls migrate deploy fehlschlägt (keine migrations), versuche migrate dev
  if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
    try {
      run('npx prisma db push --accept-data-loss', { cwd: __dirname });
    } catch {
      warn('Migration fehlgeschlagen. Versuche Schema-Push...');
      run('npx prisma db push', { cwd: __dirname });
    }
  }
  ok('Datenbank eingerichtet');

  // ─── Schritt 5: Stammdaten laden ────────────────────────────
  step(5, 'Stammdaten laden');

  let loadSeed = isDemo || skipPrompts;
  if (!loadSeed && !skipPrompts) {
    const seedAnswer = await ask('  DSGVO-Stammdaten laden (Rechtsgrundlagen, Datenkategorien, TOMs)? (j/n)', 'j');
    loadSeed = seedAnswer.toLowerCase().startsWith('j');
  }

  if (loadSeed) {
    log('  Lade DSGVO-Stammdaten...', colors.dim);
    try {
      run('npx tsx prisma/seed.ts', { cwd: __dirname });
      ok('Stammdaten geladen (Rechtsgrundlagen, Datenkategorien, Betroffenengruppen, TOMs)');
    } catch {
      warn('Seed fehlgeschlagen. Stammdaten können manuell über die Oberfläche angelegt werden.');
    }
  } else {
    warn('Stammdaten übersprungen. Sie können später über die Oberfläche angelegt werden.');
  }

  // ─── Schritt 6: Build & Startskripte ───────────────────────
  step(6, 'Anwendung bauen & Startskripte erstellen');

  log('  Baue Produktions-Build...', colors.dim);
  run('npx next build', { cwd: __dirname });
  ok('Produktions-Build erstellt');

  // START.bat (Windows)
  const startBat = [
    '@echo off',
    'chcp 65001 >nul',
    'title Datenschutz-Tool',
    `cd /d "%~dp0"`,
    'echo.',
    'echo   ========================================',
    'echo     Datenschutz-Tool - DSGVO Compliance',
    'echo   ========================================',
    'echo.',
    `echo   Anwendung laeuft auf: ${appUrl}`,
    'echo   Beenden mit Strg+C',
    'echo.',
    ':loop',
    `npx next start -p ${port}`,
    'echo.',
    'echo   Neustart in 3 Sekunden...',
    'timeout /t 3 /nobreak >nul',
    'goto loop',
  ].join('\r\n');
  fs.writeFileSync(path.join(__dirname, 'START.bat'), startBat);
  ok('START.bat erstellt');

  // start.sh (Linux/macOS)
  const startSh = [
    '#!/bin/bash',
    `cd "$(dirname "$0")"`,
    'echo ""',
    'echo "  ========================================"',
    'echo "    Datenschutz-Tool - DSGVO Compliance"',
    'echo "  ========================================"',
    'echo ""',
    `echo "  Anwendung läuft auf: ${appUrl}"`,
    'echo "  Beenden mit Strg+C"',
    'echo ""',
    'while true; do',
    `  npx next start -p ${port}`,
    '  echo "  Neustart in 3 Sekunden..."',
    '  sleep 3',
    'done',
  ].join('\n');
  fs.writeFileSync(path.join(__dirname, 'start.sh'), startSh, { mode: 0o755 });
  ok('start.sh erstellt');

  // ─── Fertig ─────────────────────────────────────────────────
  log('');
  log('╔══════════════════════════════════════════════════════╗', colors.green);
  log('║  ✓ Installation erfolgreich abgeschlossen!          ║', colors.green);
  log('╚══════════════════════════════════════════════════════╝', colors.green);
  log('');
  log('  Anwendung starten:', colors.bold);
  if (isWin) {
    log(`    Doppelklick auf START.bat`, colors.dim);
    log(`    oder: npm start`, colors.dim);
  } else {
    log(`    ./start.sh`, colors.dim);
    log(`    oder: npm start`, colors.dim);
  }
  log('');
  log(`  Dann im Browser öffnen: ${appUrl}`, colors.bold);
  log('');

  rl.close();
}

main().catch(e => {
  fail(`Installation fehlgeschlagen: ${e.message}`);
  rl.close();
  process.exit(1);
});
