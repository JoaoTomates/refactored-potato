import crypto from 'crypto';

const DISPOSABLE_DOMAINS = new Set([
    '10minutemail.com',
    '10minutemail.net',
    'burnermail.io',
    'dispostable.com',
    'dropmail.me',
    'emailondeck.com',
    'fakeinbox.com',
    'getairmail.com',
    'getnada.com',
    'guerrillamail.biz',
    'guerrillamail.com',
    'guerrillamail.de',
    'guerrillamail.info',
    'guerrillamail.net',
    'guerrillamail.org',
    'harakirimail.com',
    'inboxbear.com',
    'mailcatch.com',
    'maildrop.cc',
    'mailinator.com',
    'mailnesia.com',
    'mintemail.com',
    'mohmal.com',
    'mytemp.email',
    'sharklasers.com',
    'spamgourmet.com',
    'temp-mail.io',
    'temp-mail.org',
    'tempmail.com',
    'tempmail.net',
    'tempr.email',
    'throwawaymail.com',
    'trashmail.com',
    'trashmail.net',
    'yopmail.com',
    'yopmail.fr',
    'yopmail.net',
]);

const PLUS_ALIAS_DOMAINS = new Set([
    'gmail.com',
    'googlemail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'yahoo.com',
    'proton.me',
    'protonmail.com',
    'icloud.com',
]);

/**
 * Normaliza o e-mail para detectar variações como pontos no Gmail e sufixos +alias.
 */
export function canonicalizeEmail(rawEmail: string): string {
    const trimmed = rawEmail.trim().toLowerCase();
    const atIndex = trimmed.lastIndexOf('@');
    if (atIndex === -1) return trimmed;

    let local = trimmed.slice(0, atIndex);
    let domain = trimmed.slice(atIndex + 1);

    if (domain === 'googlemail.com') {
        domain = 'gmail.com';
    }

    if (PLUS_ALIAS_DOMAINS.has(domain)) {
        const plusIdx = local.indexOf('+');
        if (plusIdx !== -1) {
            local = local.slice(0, plusIdx);
        }
    }

    if (domain === 'gmail.com') {
        local = local.replace(/\./g, '');
    }

    return `${local}@${domain}`;
}

/**
 * Verifica se o domínio do e-mail pertence a provedores temporários/descartáveis conhecidos.
 */
export function isDisposableEmail(rawEmail: string): boolean {
    const trimmed = rawEmail.trim().toLowerCase();
    const atIndex = trimmed.lastIndexOf('@');
    if (atIndex === -1) return false;
    const domain = trimmed.slice(atIndex + 1);
    return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Gera HMAC-SHA256 irreversível para armazenar sinais (IP, telefone, dispositivo, e-mail pós-exclusão)
 * sem expor PII em texto claro.
 */
export function hashSignal(value: string): string {
    if (process.env.NODE_ENV === 'production' && !process.env.ANTI_SYBIL_SECRET && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('[SECURITY] ANTI_SYBIL_SECRET ou SUPABASE_SERVICE_ROLE_KEY ausente em produção.');
    }
    const secret =
        process.env.ANTI_SYBIL_SECRET ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'ts1-local-dev-signal-salt';
    return crypto.createHmac('sha256', secret).update(value.trim().toLowerCase()).digest('hex');
}

/**
 * Extrai o IP do cliente considerando headers da Netlify, Vercel e proxies padrão.
 */
export function extractClientIp(request: Request): string {
    const nfIp = request.headers.get('x-nf-client-connection-ip');
    if (nfIp) return nfIp.trim();

    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();

    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim();
        if (first) return first;
    }

    return 'unknown';
}

/**
 * Modo de testes locais liberado APENAS fora de produção e quando explicitamente habilitado.
 */
export function isAuthTestMode(): boolean {
    return process.env.NODE_ENV !== 'production' && process.env.AUTH_TEST_MODE === 'true';
}

/**
 * Valida token Turnstile quando TURNSTILE_SECRET_KEY estiver configurada em produção.
 */
export async function verifyTurnstileIfConfigured(
    token: string | undefined,
    remoteIp: string
): Promise<{ ok: boolean; error?: string }> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret || isAuthTestMode()) {
        return { ok: true };
    }

    if (!token) {
        return { ok: false, error: 'Verificação anti-bot obrigatória não preenchida.' };
    }

    try {
        const body = new URLSearchParams({
            secret,
            response: token,
        });
        if (remoteIp && remoteIp !== 'unknown') {
            body.set('remoteip', remoteIp);
        }

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        const data = (await res.json()) as { success?: boolean };
        if (!data.success) {
            return { ok: false, error: 'Falha na verificação anti-bot. Recarregue a página e tente novamente.' };
        }
        return { ok: true };
    } catch {
        return { ok: false, error: 'Não foi possível validar a verificação anti-bot no momento.' };
    }
}
