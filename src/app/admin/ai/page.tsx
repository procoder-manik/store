import { requireAdmin } from "@/lib/admin";
import { providerViews } from "@/lib/ai-config";
import { getPublicSettings } from "@/lib/settings";
import { AiProviders } from "@/components/admin/AiProviders";

export const metadata = { title: "AI services" };
export const dynamic = "force-dynamic";

export default async function AiServices() {
  await requireAdmin();
  const [providers, settings] = await Promise.all([providerViews(), getPublicSettings()]);
  const live = providers.filter((p) => p.source !== "none" && p.enabled);
  const alertTo = settings.contact.email?.trim();
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">AI services</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        The chat assistant and the writing helpers in Admin use these. They are tried by Order, lowest number first. When one runs out of its free requests or stops answering, the next one takes over, and customers see the same assistant either way.
      </p>
      <p className="mt-3 max-w-2xl rounded-xl border border-line bg-surface p-4 text-sm">
        {live.length
          ? <>Working now: {live.map((p) => p.name).join(", then ")}.</>
          : <>No service is connected yet, so the chat assistant cannot answer. Add a key below. Google Gemini has a free one.</>}
        {" "}Keys you save here are stored scrambled and are never shown again. A key in the .env file switches a service on by itself, and a key saved here replaces it.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        {alertTo
          ? <>We email <span className="font-medium text-ink">{alertTo}</span> when a service runs out of free requests or every service fails, so you can add a new key before customers notice. Change this address in Settings, Contact.</>
          : <>Add a store email in Settings, Contact to get a warning when a service runs out of free requests or every service fails.</>}
      </p>
      <div className="mt-6 max-w-3xl">
        <AiProviders providers={providers} />
      </div>
    </>
  );
}
