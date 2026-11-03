import { courierStatuses } from "@/lib/courier-config";
import { CourierSettings } from "@/components/admin/CourierSettings";

export const metadata = { title: "Delivery partners" };

export default async function CouriersPage() {
  const statuses = await courierStatuses();
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Delivery partners</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Connect the couriers you use. Enter the keys each one gives you, then turn it on. Keys are stored scrambled and never shown again. Turn a courier off any time without losing its keys.</p>
      <div className="mt-6"><CourierSettings statuses={statuses} /></div>
    </>
  );
}
