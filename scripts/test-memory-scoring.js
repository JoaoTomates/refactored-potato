const assert = require('assert');
const { evaluatePredictionAccuracy } = require('../src/lib/memory-scoring');
const { validateBriefingPayload, buildFallbackBriefing } = require('../src/lib/war-room-briefing');

console.log('--- TESTE 1: Motor Determinístico de Avaliação de Predições ---');
const pred = {
    poletime: '1:12.350',
    top10: ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'],
    evo: ['HAM', 'SAI', 'ALO', 'TSU', 'ALB'],
    h2h: { m1: '04', m2: '16', m3: '63' },
    misc: { q1: '3', q2: '5', q3: '8' }
};

const actual = {
    round: '19',
    circuitName: 'Austin (COTA)',
    poleTime: '1:12.200', // delta 150ms
    top10Finishers: ['NOR', 'VER', 'LEC', 'HAM', 'RUS', 'PIA', 'SAI', 'ALO', 'GAS', 'TSU'],
    h2hWinners: { m1: '04', m2: '44', m3: '63' }
};

const result = evaluatePredictionAccuracy(pred, actual);
assert(result.poleDeltaMs !== null);
assert.strictEqual(result.poleDeltaMs, 150);
assert.strictEqual(result.top10ExactMatches, 7); // NOR, VER, LEC, RUS, SAI, ALO, GAS exatos
assert.strictEqual(result.top10PresenceMatches, 2); // PIA e HAM presentes em posições alternadas
assert.strictEqual(result.h2hMatches, 2); // m1 e m3
assert(result.accuracyRate > 60);
assert(result.summaryLine.includes('0.150s'));
console.log('✓ PASSOU: Avaliação determinística calculou scores e summary perfeitamente: ' + result.summaryLine);

console.log('--- TESTE 2: Validador de Payload de Briefing de Sessão ---');
const fallback = buildFallbackBriefing({
    seniorPole: '1:12.209',
    techPole: '1:12.164',
    seniorTop10: ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'],
    techTop10: ['VER', 'NOR', 'LEC', 'PIA', 'RUS', 'HAM', 'SAI', 'ALO', 'GAS', 'ALB'],
});
const validation = validateBriefingPayload(fallback, 72209);
assert(validation !== null, 'briefing deve ser validado com sucesso');
assert.strictEqual(validation.poletime.senior.value, '1:12.209');
assert.strictEqual(validation.top10.senior.value.length, 10);
assert.strictEqual(validation.evo.senior.value.length, 5);
assert.strictEqual(Object.keys(validation.h2h.senior.value).length, 11);
console.log('✓ PASSOU: Briefing payload atende rigorosamente a todos os contratos do TS1.');

console.log('TODOS OS TESTES DE PONTUAÇÃO E BRIEFING PASSARAM COM SUCESSO!');
