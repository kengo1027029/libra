import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。");
  }
  return { url, key };
}

/** Route Handler / Server Component 用（next/headers はクライアントから import しない） */
export async function createServerSupabaseClient() {
  const { url, key } = getSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component など set 不可な場合は middleware 側で更新される想定
        }
      },
    },
  });
}
