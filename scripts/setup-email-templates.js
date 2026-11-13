/**
 * Script para gerar os templates de e-mail com a identidade visual VoltGrid
 * e atualizá-los diretamente na API de gerenciamento do Supabase Auth.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const LOGO_URL = 'https://fivzbbqzgvvwgtlhietx.supabase.co/storage/v1/object/public/avatars/voltgrid-logo.png';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_90eb61ed9d08d723537719c5f60b8ce839221f1f';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'fivzbbqzgvvwgtlhietx';

function generateTemplate({ tag, title, message, buttonText, isRecovery = false }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VoltGrid</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080809; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #080809; margin: 0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #121316; border: 1px solid #23252c; border-top: 4px solid #fbaa19; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);">
          
          <!-- Header with VoltGrid Logo -->
          <tr>
            <td align="center" style="padding: 36px 32px 24px 32px; background-color: #121316; border-bottom: 1px solid #1e2026;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="vertical-align: middle;">
                    <img src="${LOGO_URL}" alt="VoltGrid Logo" width="64" height="64" style="display: block; width: 64px; height: 64px; margin-bottom: 14px; border: 0;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="font-size: 24px; font-weight: 900; letter-spacing: 5px; color: #fbaa19; text-transform: uppercase; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">VOLTGRID</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 5px;">
                    <span style="font-size: 10px; font-weight: 600; letter-spacing: 3px; color: #717684; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">F1 TELEMETRY &amp; STRATEGY // BAEFF1</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px; background-color: #121316;">
              <!-- Badge Tag -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: rgba(251, 170, 25, 0.12); border: 1px solid rgba(251, 170, 25, 0.35); border-radius: 3px; padding: 4px 10px;">
                    <span style="font-size: 10px; font-weight: 700; color: #fbaa19; letter-spacing: 2px; text-transform: uppercase; font-family: monospace;">${tag}</span>
                  </td>
                </tr>
              </table>

              <!-- Main Title -->
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; line-height: 1.3;">
                ${title}
              </h1>

              <!-- Description -->
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #a1a5b0;">
                ${message}
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; background-color: #fbaa19; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 14px 36px; border-radius: 4px; border: 1px solid #fbaa19;">
                      ${buttonText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Direct Link Fallback Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0b0c0e; border: 1px solid #1f2127; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #717684; text-transform: uppercase; letter-spacing: 1px;">
                      Ou utilize o link direto no navegador:
                    </p>
                    <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #fbaa19; word-break: break-all; font-family: monospace;">
                      <a href="{{ .ConfirmationURL }}" style="color: #fbaa19; text-decoration: underline;">{{ .ConfirmationURL }}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Warning -->
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #626672;">
                🔒 Este link de confirmação é pessoal e expira por segurança. Se você não solicitou esta ação no ecossistema VoltGrid, ${isRecovery ? 'nenhuma alteração foi efetuada e sua conta permanece em segurança.' : 'desconsidere esta mensagem com segurança.'}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 32px; background-color: #0b0c0e; border-top: 1px solid #1a1c22;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #8e929e; letter-spacing: 1px; text-transform: uppercase;">
                VOLTGRID &bull; BAEFF1 TELEMETRY SYSTEM
              </p>
              <p style="margin: 0; font-size: 10px; color: #51545e; letter-spacing: 0.5px;">
                Pitwall Command &bull; Gestão Estratégica de Pilotos e Escuderias
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// 1. Salvar os templates localmente
const templatesDir = path.join(__dirname, '..', 'supabase', 'templates');
fs.mkdirSync(templatesDir, { recursive: true });

const confirmationHtml = generateTemplate({
  tag: 'SUPERLICENÇA // ATIVAÇÃO',
  title: 'Confirme sua Superlicença de Piloto',
  message: 'Bem-vindo ao centro de operações da VoltGrid. Para habilitar seu acesso à telemetria ao vivo, decisões de estratégia e ao terminal de pitwall da temporada 2026, confirme seu e-mail através do link abaixo.',
  buttonText: 'CONFIRMAR SUPERLICENÇA'
});

const magicLinkHtml = generateTemplate({
  tag: 'ACESSO // LOGIN INSTANTÂNEO',
  title: 'Acesso Rápido ao Terminal de Pitwall',
  message: 'Recebemos uma solicitação de autenticação instantânea para o seu terminal de estrategista. Clique no botão abaixo para ingressar imediatamente sem necessidade de senha.',
  buttonText: 'ACESSAR PITWALL'
});

const inviteHtml = generateTemplate({
  tag: 'CONVITE // ESQUADRÃO DE TELEMETRIA',
  title: 'Você foi convocado para o Pitwall',
  message: 'Você recebeu um convite oficial para ingressar na plataforma VoltGrid e assumir a estratégia da sua escuderia na temporada 2026. Clique no botão abaixo para aceitar o convite e ativar sua conta.',
  buttonText: 'ACEITAR CONVITE E ENTRAR'
});

const emailChangeHtml = generateTemplate({
  tag: 'SEGURANÇA // ATUALIZAÇÃO CADASTRO',
  title: 'Confirme seu novo endereço de e-mail',
  message: 'Uma solicitação foi iniciada para transferir sua conta VoltGrid para o endereço <strong>{{ .NewEmail }}</strong>. Para validar a alteração e proteger sua Superlicença, confirme através do botão abaixo.',
  buttonText: 'CONFIRMAR NOVO E-MAIL'
});

const recoveryHtml = generateTemplate({
  tag: 'RECUPERAÇÃO // SEGURANÇA',
  title: 'Redefinição de Credenciais de Acesso',
  message: 'Uma solicitação de redefinição de senha foi registrada para a conta <strong>{{ .Email }}</strong>. Clique no botão abaixo para escolher uma nova senha e restabelecer seu acesso ao cockpit.',
  buttonText: 'REDEFINIR SENHA',
  isRecovery: true
});

fs.writeFileSync(path.join(templatesDir, 'confirmation.html'), confirmationHtml);
fs.writeFileSync(path.join(templatesDir, 'magic_link.html'), magicLinkHtml);
fs.writeFileSync(path.join(templatesDir, 'invite.html'), inviteHtml);
fs.writeFileSync(path.join(templatesDir, 'email_change.html'), emailChangeHtml);
fs.writeFileSync(path.join(templatesDir, 'recovery.html'), recoveryHtml);

console.log('✅ Arquivos de template salvos com sucesso em supabase/templates/:');
console.log('   - confirmation.html');
console.log('   - magic_link.html');
console.log('   - invite.html');
console.log('   - email_change.html');
console.log('   - recovery.html');

// 2. Montar payload para a API do Supabase Auth
const payload = {
  mailer_subjects_confirmation: '⚡ VoltGrid | Confirme seu e-mail para ativar sua Superlicença',
  mailer_templates_confirmation_content: confirmationHtml,

  mailer_subjects_magic_link: '⚡ VoltGrid | Seu link de acesso ao Pitwall',
  mailer_templates_magic_link_content: magicLinkHtml,

  mailer_subjects_invite: '⚡ VoltGrid | Você foi convocado para o Pitwall',
  mailer_templates_invite_content: inviteHtml,

  mailer_subjects_email_change: '⚡ VoltGrid | Confirmação de alteração de e-mail',
  mailer_templates_email_change_content: emailChangeHtml,

  mailer_subjects_recovery: '⚡ VoltGrid | Redefinição de senha do estrategista',
  mailer_templates_recovery_content: recoveryHtml
};

// Se variáveis SMTP estiverem presentes no ambiente, inclui no payload:
if (process.env.SMTP_HOST) {
  payload.smtp_host = process.env.SMTP_HOST;
  payload.smtp_port = process.env.SMTP_PORT || '587';
  payload.smtp_user = process.env.SMTP_USER || '';
  payload.smtp_pass = process.env.SMTP_PASS || '';
  payload.smtp_admin_email = process.env.SMTP_ADMIN_EMAIL || 'noreply@voltgrid.app';
  payload.smtp_sender_name = process.env.SMTP_SENDER_NAME || 'VoltGrid Telemetry';
  console.log('📧 Dados SMTP customizados detectados, enviando junto com os templates...');
}

const dataString = JSON.stringify(payload);

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/config/auth`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(dataString)
  }
};

const req = https.request(options, (res) => {
  let responseBody = '';
  res.on('data', (d) => { responseBody += d; });
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('🚀 Sucesso! Templates do Supabase Auth atualizados com sucesso (HTTP ' + res.statusCode + ')');
    } else {
      const err = JSON.parse(responseBody || '{}');
      if (err?.error?.code === 'entitlement_required') {
        console.log('\n⚠️  [SUPABASE FREE TIER NOTA]:');
        console.log('O Supabase exige configuração de um SMTP personalizado (gratuito via Resend, Brevo ou Gmail) ou plano Pro para salvar templates via API/Dashboard.');
        console.log('Todos os templates HTML estão prontos em: supabase/templates/\n');
      } else {
        console.error('❌ Erro na API do Supabase (HTTP ' + res.statusCode + '):', responseBody);
      }
    }
  });
});

req.on('error', (e) => {
  console.error('Erro na requisição:', e);
});

req.write(dataString);
req.end();
