import { createBrowserClient } from "@supabase/ssr";

export function hasSupabaseBrowserConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。");
  }
  return { url, key };
}

/** クライアントコンポーネント用（Cookie ベースのセッション） */
export function createClient() {
  if (!hasSupabaseBrowserConfig()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。");
  }
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
}
