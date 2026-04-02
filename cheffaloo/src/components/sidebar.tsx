import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "./sidebar-nav";

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return <SidebarNav userEmail={user.email ?? ""} />;
}
