import { DISTRICT_POINTS } from '@/lib/geo';

export const STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export function districtsFor(state: string): string[] {
  return DISTRICT_POINTS.filter((p) => p.state === state).map((p) => p.district);
}

export const AREA_TYPES = [
  { value: 'URBAN', label: 'Urban' },
  { value: 'SEMI_URBAN', label: 'Semi-urban' },
  { value: 'RURAL', label: 'Rural' },
] as const;

export const INCOME_BRACKETS = [
  'Under ₹15,000 per month',
  '₹15,000 – ₹25,000 per month',
  '₹25,000 – ₹50,000 per month',
  '₹50,000 – ₹1,00,000 per month',
  'Above ₹1,00,000 per month',
  'Prefer not to say',
] as const;
