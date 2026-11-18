/**
 * Teste unitário e de integração para resiliência e tratamento de erro da LLM.
 * Simula respostas mockadas de 404, 429 e 500.
 */

const assert = require('assert');

// Simulação de servidor mock para testar fetchWithRetry e fallback
const http = require('http');

let mockStatusCode = 200;
let mockResponseText = '';
let requestedModels = [];

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      requestedModels.push(parsed.model);
    } catch (_) {}

    res.writeHead(mockStatusCode, { 'Content-Type': 'application/json' });
    res.end(mockResponseText);
  });
});

async function runTests() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const mockBaseUrl = `http://127.0.0.1:${port}/v1`;

  process.env.LLM_BASE_URL = mockBaseUrl;
  process.env.LLM_MODEL = 'gemini-model-primary';
  process.env.LLM_FALLBACK_MODEL = 'gemini-model-contingency';
  process.env.LLM_API_KEY = 'mock-super-secret-key-12345678901234567890';

  // Importa cliente após setar envs
  const { chatCompletion, LLMError } = require('../src/lib/llm');

  console.log('--- TESTE 1: Status 404 (Modelo descontinuado) com Fallback ---');
  requestedModels = [];
  let attempt = 0;
  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const parsed = JSON.parse(body);
      requestedModels.push(parsed.model);
      attempt++;
      if (attempt === 1) {
        // Modelo primário dá 404
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { code: 404, message: 'Primary model retired' } }));
      } else {
        // Modelo de contingência tem sucesso
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ choices: [{ message: { content: 'Fallback response ok' } }] }));
      }
    });
  });

  const res1 = await chatCompletion({
    messages: [{ role: 'user', content: 'test' }]
  });
  assert.strictEqual(res1, 'Fallback response ok', 'Deveria retornar a resposta do modelo de contingência');
  assert.deepStrictEqual(requestedModels, ['gemini-model-primary', 'gemini-model-contingency'], 'Deveria tentar o primário e depois o fallback');
  console.log('✓ PASSOU: 404 ativou modelo de contingência e completou com sucesso.');

  console.log('\n--- TESTE 2: Status 429 (Rate Limit / Cota) sem expor mensagem do provedor ---');
  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 429, message: 'Quota exceeded for user token AIzaSy1234567890' } }));
  });

  try {
    await chatCompletion({
      messages: [{ role: 'user', content: 'test' }]
    });
    assert.fail('Deveria ter lançado LLMError');
  } catch (err) {
    assert(err instanceof LLMError, 'Deve ser instância de LLMError');
    assert.strictEqual(err.message, 'ai_unavailable', 'A mensagem nunca deve expor o erro do provedor');
    assert.strictEqual(err.code, 'RATE_LIMIT', 'O código deve ser RATE_LIMIT');
    assert.strictEqual(err.status, 429, 'O status HTTP deve ser 429');
    assert(!err.message.includes('Quota exceeded'), 'Não deve vazar o texto cru');
  }
  console.log('✓ PASSOU: 429 tratado de forma limpa como { error: "ai_unavailable", code: "RATE_LIMIT" }.');

  console.log('\n--- TESTE 3: Status 500 (Erro de Servidor) com Retry e Sanitização ---');
  let calls500 = 0;
  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    calls500++;
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal failure' }));
  });

  try {
    await chatCompletion({
      messages: [{ role: 'user', content: 'test' }]
    });
    assert.fail('Deveria ter lançado LLMError');
  } catch (err) {
    assert(err instanceof LLMError, 'Deve ser instância de LLMError');
    assert.strictEqual(err.message, 'ai_unavailable', 'Mensagem limpa');
    assert.strictEqual(err.code, 'API_ERROR');
    assert.strictEqual(err.status, 500);
    // Verifica que fez 1 tentativa inicial + 1 retry com backoff no primário e contingência
    assert(calls500 >= 2, 'Deveria ter feito retry');
  }
  console.log('✓ PASSOU: 500 realizou retry e retornou ai_unavailable.');

  server.close();
  console.log('\nTODOS OS 3 TESTES DE RESILIÊNCIA PASSARAM COM SUCESSO!');
}

runTests().catch(err => {
  console.error('Falha no teste:', err);
  process.exit(1);
});
