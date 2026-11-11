/**
 * Runner de desenvolvimento com sincronização em tempo real de DIALOGUES_SCRIPT_MASTER.md.
 * Sempre que DIALOGUES_SCRIPT_MASTER.md for salvo, regenera src/data/dialogues.ts e .json
 * para o Hot Reload do Next.js refletir imediatamente os textos atualizados.
 */

const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const syncScript = path.join(__dirname, 'sync-dialogues.js');
const markdownPath = path.join(rootDir, 'DIALOGUES_SCRIPT_MASTER.md');

function runSync() {
    try {
        execFileSync(process.execPath, [syncScript], { cwd: rootDir, stdio: 'inherit' });
    } catch (err) {
        console.error('[sync-dialogues] Erro ao sincronizar:', err.message);
    }
}

runSync();

let debounceTimer = null;
fs.watch(markdownPath, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        console.log('\n[sync-dialogues] Alteração detectada em DIALOGUES_SCRIPT_MASTER.md — atualizando diálogos...');
        runSync();
    }, 120);
});

const nextBin = require.resolve('next/dist/bin/next');
const nextProc = spawn(process.execPath, [nextBin, 'dev'], {
    cwd: rootDir,
    stdio: 'inherit',
});

nextProc.on('exit', (code) => {
    process.exit(code ?? 0);
});
