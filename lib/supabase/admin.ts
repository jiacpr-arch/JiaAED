// The service-role key bypasses RLS on every table (leads, chats, customers).
// "server-only" makes any import of this module from a Client Component a
// build error, so the key can never be bundled into browser JavaScript.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
