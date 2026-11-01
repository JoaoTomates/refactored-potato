import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof window !== 'undefined' && (!url || !anonKey || url.includes('placeholder'))) {
    console.error(
      '[BAEFF1 / Supabase] ERRO CRÍTICO DE CONFIGURAÇÃO: As variáveis NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY não foram definidas no painel da Netlify. Adicione-as em Site Configuration > Environment Variables e faça um novo deploy (Clear cache and deploy).'
    );
  }

  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    anonKey || 'placeholder'
  );
}

// Global instance for simple client components
export const supabase = createClient();
