import { createClient } from "@/lib/supabase/server";
import { LandingForm } from "@/components/admin/LandingForm";

export default async function NewLanding() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id, name, base_price").eq("status", "active").order("name");
  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-semibold">New landing page</h1>
      <LandingForm products={(data ?? []).map((p) => ({ id: p.id as string, name: p.name as string, price: Number(p.base_price) }))} />
    </>
  );
}
