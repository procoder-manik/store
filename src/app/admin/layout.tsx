import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mfaRequired } from "@/lib/admin";
import { getPublicSettings } from "@/lib/settings";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AiAssist } from "@/components/admin/AiAssist";

const STAFF = ["support", "staff", "manager", "super_admin"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !STAFF.includes(profile.role)) redirect("/");
  if (mfaRequired()) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") redirect(aal?.nextLevel === "aal2" ? "/mfa/verify" : "/mfa/setup");
  }
  const { brand } = await getPublicSettings();
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <AdminSidebar brand={brand.name} />
      <main data-admin-main className="min-w-0 px-4 py-6 md:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <AiAssist />
    </div>
  );
}
