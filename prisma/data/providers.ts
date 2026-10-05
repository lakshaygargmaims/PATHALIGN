export interface SeedCourse {
  slug: string;
  durationMonths: number;
  feeMin: number;
  feeMax: number;
  seats: number;
}

export interface SeedProvider {
  name: string;
  type: 'ITI' | 'PRIVATE_ITI' | 'POLYTECHNIC' | 'COMMUNITY_SKILL_CENTRE' | 'NSDC_PARTNER' | 'APPRENTICESHIP_TRAINING_PROVIDER' | 'ONLINE';
  state: string;
  district: string;
  city: string;
  pinCode: string;
  lat: number;
  lng: number;
  affiliation: string;
  courses: SeedCourse[];
}

/**
 * Synthetic demo training providers. Names are prefixed "Demo" and every
 * record is stored with isSynthetic=true + SYNTHETIC_DEMO status.
 * Coordinates are district-headquarter approximations, offset slightly.
 * Replace with verified institution records through the admin workflow.
 */

interface DistrictSeed {
  state: string;
  district: string;
  city: string;
  pinCode: string;
  lat: number;
  lng: number;
  slugs: string[]; // 4 trades offered in this district
}

const DISTRICTS: DistrictSeed[] = [
  { state: 'Maharashtra', district: 'Pune', city: 'Pune', pinCode: '411001', lat: 18.5204, lng: 73.8567, slugs: ['electrician', 'solar-pv-technician', 'refrigeration-ac-mechanic', 'computer-operator-programming-assistant'] },
  { state: 'Maharashtra', district: 'Nagpur', city: 'Nagpur', pinCode: '440001', lat: 21.1458, lng: 79.0882, slugs: ['mechanic-fitter', 'welder-gas-electric', 'electrician', 'mechanic-diesel'] },
  { state: 'Uttar Pradesh', district: 'Lucknow', city: 'Lucknow', pinCode: '226001', lat: 26.8467, lng: 80.9462, slugs: ['electrician', 'fashion-design-technology', 'beautician-skin-care', 'computer-operator-programming-assistant'] },
  { state: 'Uttar Pradesh', district: 'Kanpur Nagar', city: 'Kanpur', pinCode: '208001', lat: 26.4499, lng: 80.3319, slugs: ['mechanic-fitter', 'welder-gas-electric', 'electrician', 'mechanic-two-wheeler'] },
  { state: 'Bihar', district: 'Patna', city: 'Patna', pinCode: '800001', lat: 25.5941, lng: 85.1376, slugs: ['electrician', 'mobile-repair-maintenance', 'food-production-cook', 'hospital-housekeeping-hygiene'] },
  { state: 'Rajasthan', district: 'Jaipur', city: 'Jaipur', pinCode: '302001', lat: 26.9124, lng: 75.7873, slugs: ['electrician', 'fashion-design-technology', 'plumbing-sanitary-works', 'solar-pv-technician'] },
  { state: 'Madhya Pradesh', district: 'Bhopal', city: 'Bhopal', pinCode: '462001', lat: 23.2599, lng: 77.4126, slugs: ['mechanic-fitter', 'electrician', 'refrigeration-ac-mechanic', 'ev-repair-technician'] },
  { state: 'Gujarat', district: 'Ahmedabad', city: 'Ahmedabad', pinCode: '380001', lat: 23.0225, lng: 72.5714, slugs: ['mechanic-fitter', 'welder-gas-electric', 'electronics-mechanic', 'bakery-confectionery'] },
  { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', pinCode: '600001', lat: 13.0827, lng: 80.2707, slugs: ['electronics-mechanic', 'computer-operator-programming-assistant', 'ev-repair-technician', 'mechanic-diesel'] },
  { state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru', pinCode: '560001', lat: 12.9716, lng: 77.5946, slugs: ['computer-operator-programming-assistant', 'electronics-mechanic', 'solar-pv-technician', 'mobile-repair-maintenance'] },
  { state: 'West Bengal', district: 'Kolkata', city: 'Kolkata', pinCode: '700001', lat: 22.5726, lng: 88.3639, slugs: ['electrician', 'carpenter-furniture-interior', 'fashion-design-technology', 'hospital-housekeeping-hygiene'] },
  { state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', pinCode: '500001', lat: 17.385, lng: 78.4867, slugs: ['electronics-mechanic', 'ev-repair-technician', 'electrician', 'food-production-cook'] },
];

const TYPES: SeedProvider['type'][] = ['ITI', 'PRIVATE_ITI', 'NSDC_PARTNER'];

const AFFILIATIONS = [
  'Affiliation status to be verified against DGT/NCVET records',
  'Affiliation status to be verified against state skill mission records',
  'Affiliation status to be verified against NSDC partner directory',
];

/** Builds 3 synthetic demo providers per district with 4 courses each. */
export function buildSeedProviders(): SeedProvider[] {
  const out: SeedProvider[] = [];
  DISTRICTS.forEach((d, di) => {
    TYPES.forEach((type, ti) => {
      const suffix = type === 'ITI' ? 'Govt ITI' : type === 'PRIVATE_ITI' ? 'Pvt. ITI' : 'Skill Centre';
      const courses: SeedCourse[] = d.slugs.map((slug, i) => {
        const base = 6 + ((di + ti + i) % 5) * 6; // 6–30 months
        return {
          slug,
          durationMonths: base,
          feeMin: 5000 + ((di + i) % 4) * 3000,
          feeMax: 18000 + ((di + ti + i) % 5) * 9000,
          seats: 24 + ((di + i) % 4) * 12,
        };
      });
      out.push({
        name: `Demo ${suffix} – ${d.district}`,
        type,
        state: d.state,
        district: d.district,
        city: d.city,
        pinCode: d.pinCode,
        lat: Number((d.lat + (ti - 1) * 0.045).toFixed(4)),
        lng: Number((d.lng + (ti - 1) * 0.05).toFixed(4)),
        affiliation: AFFILIATIONS[ti]!,
        courses,
      });
    });
  });
  return out;
}
