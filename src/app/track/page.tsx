import type { Metadata } from "next";
import { TrackForm } from "@/components/TrackForm";

export const metadata: Metadata = { title: "Track your order" };

export default function Track() {
  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-display text-3xl font-semibold">Track your order</h1>
      <p className="mt-2 text-sm text-muted">Enter the order number from your confirmation and the mobile number you ordered with.</p>
      <TrackForm />
    </main>
  );
}
