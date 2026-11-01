"use client";

import { DISTRICTS, zoneForDistrict } from "@/lib/districts";

type Props = { className: string; zones: { id: string; name: string }[]; setZoneId: (id: string) => void; defaultDistrict?: string; labelClass?: string };

/** District list and city box, used by every order form. Choosing a district also sets the delivery area. */
export function DistrictFields({ className, zones, setZoneId, defaultDistrict = "", labelClass }: Props) {
  const known = !defaultDistrict || DISTRICTS.includes(defaultDistrict);
  const district = (
    <select id="district" name="district" required aria-label="District" defaultValue={defaultDistrict} autoComplete="address-level1" className={className} onChange={(e) => { const z = zoneForDistrict(zones, e.target.value); if (z) setZoneId(z); }}>
      <option value="" disabled>Choose district</option>
      {!known && <option value={defaultDistrict}>{defaultDistrict}</option>}
      {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
    </select>
  );
  const city = <input id="city" name="city" required maxLength={60} placeholder={labelClass ? "" : "City or thana"} aria-label="City or thana" autoComplete="address-level2" className={className} />;
  if (labelClass) return <><div><label className={labelClass} htmlFor="district">District</label>{district}</div><div><label className={labelClass} htmlFor="city">City or thana</label>{city}</div></>;
  return <>{district}{city}</>;
}
