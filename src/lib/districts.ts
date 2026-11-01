/** The 64 districts of Bangladesh, for address forms. */
export const DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla", "Dhaka", "Dinajpur", "Faridpur",
  "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokathi", "Jhenaidah", "Joypurhat", "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur",
  "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali",
  "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon",
];

/** Picks the matching delivery area for a district, when the areas are named like "Inside Dhaka" and "Outside Dhaka". */
export function zoneForDistrict(zones: { id: string; name: string }[], district: string) {
  const want = district === "Dhaka" ? /inside/i : /outside/i;
  return zones.find((z) => want.test(z.name))?.id;
}

/** City or thana goes at the start of the address, so it shows on invoices, labels and the courier booking without extra steps. */
export function fullAddress(f: FormData) {
  const city = String(f.get("city") ?? "").trim();
  const address = String(f.get("address") ?? "").trim();
  return (city ? `${city}, ${address}` : address).slice(0, 300);
}
