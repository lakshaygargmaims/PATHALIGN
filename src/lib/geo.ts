// Approximate administrative-headquarter coordinates (public geographic
// knowledge, ±5 km). Used only to order/rank nearby training centres —
// not presented as survey-grade locations.

export interface DistrictPoint {
  state: string;
  district: string;
  lat: number;
  lng: number;
}

export const DISTRICT_POINTS: DistrictPoint[] = [
  { state: 'Maharashtra', district: 'Pune', lat: 18.5204, lng: 73.8567 },
  { state: 'Maharashtra', district: 'Mumbai Suburban', lat: 19.076, lng: 72.8777 },
  { state: 'Maharashtra', district: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { state: 'Maharashtra', district: 'Nashik', lat: 19.9975, lng: 73.7898 },
  { state: 'Uttar Pradesh', district: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { state: 'Uttar Pradesh', district: 'Kanpur Nagar', lat: 26.4499, lng: 80.3319 },
  { state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3176, lng: 82.9739 },
  { state: 'Uttar Pradesh', district: 'Agra', lat: 27.1767, lng: 78.0081 },
  { state: 'Uttar Pradesh', district: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
  { state: 'Bihar', district: 'Patna', lat: 25.5941, lng: 85.1376 },
  { state: 'Bihar', district: 'Gaya', lat: 24.7955, lng: 85.0002 },
  { state: 'Bihar', district: 'Muzaffarpur', lat: 26.1209, lng: 85.3647 },
  { state: 'Rajasthan', district: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { state: 'Rajasthan', district: 'Jodhpur', lat: 26.2389, lng: 73.0243 },
  { state: 'Rajasthan', district: 'Kota', lat: 25.2138, lng: 75.8648 },
  { state: 'Madhya Pradesh', district: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { state: 'Madhya Pradesh', district: 'Indore', lat: 22.7196, lng: 75.8577 },
  { state: 'Madhya Pradesh', district: 'Jabalpur', lat: 23.1815, lng: 79.9864 },
  { state: 'Gujarat', district: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { state: 'Gujarat', district: 'Surat', lat: 21.1702, lng: 72.8311 },
  { state: 'Gujarat', district: 'Vadodara', lat: 22.3072, lng: 73.1812 },
  { state: 'West Bengal', district: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { state: 'West Bengal', district: 'Howrah', lat: 22.5958, lng: 88.2636 },
  { state: 'West Bengal', district: 'Asansol', lat: 23.6739, lng: 86.9524 },
  { state: 'Tamil Nadu', district: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { state: 'Tamil Nadu', district: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { state: 'Tamil Nadu', district: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { state: 'Karnataka', district: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946 },
  { state: 'Karnataka', district: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { state: 'Karnataka', district: 'Belagavi', lat: 15.8497, lng: 74.4977 },
  { state: 'Telangana', district: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { state: 'Telangana', district: 'Warangal', lat: 17.9689, lng: 79.5941 },
  { state: 'Andhra Pradesh', district: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { state: 'Andhra Pradesh', district: 'Vijayawada', lat: 16.5062, lng: 80.648 },
  { state: 'Kerala', district: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
  { state: 'Kerala', district: 'Ernakulam', lat: 9.9816, lng: 76.2999 },
  { state: 'Punjab', district: 'Ludhiana', lat: 30.901, lng: 75.8573 },
  { state: 'Punjab', district: 'Amritsar', lat: 31.634, lng: 74.8723 },
  { state: 'Haryana', district: 'Faridabad', lat: 28.4089, lng: 77.3178 },
  { state: 'Haryana', district: 'Gurugram', lat: 28.4595, lng: 77.0266 },
  { state: 'Odisha', district: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { state: 'Odisha', district: 'Cuttack', lat: 20.4625, lng: 85.8828 },
  { state: 'Jharkhand', district: 'Ranchi', lat: 23.3441, lng: 85.3096 },
  { state: 'Jharkhand', district: 'Dhanbad', lat: 23.7957, lng: 86.4304 },
  { state: 'Chhattisgarh', district: 'Raipur', lat: 21.2514, lng: 81.6296 },
  { state: 'Assam', district: 'Kamrup Metropolitan', lat: 26.1445, lng: 91.7362 },
  { state: 'Delhi', district: 'Central Delhi', lat: 28.6395, lng: 77.2266 },
  { state: 'Uttarakhand', district: 'Dehradun', lat: 30.3165, lng: 78.0322 },
];

export function findDistrictPoint(state?: string | null, district?: string | null): DistrictPoint | null {
  if (!state) return null;
  const s = state.trim().toLowerCase();
  if (district) {
    const d = district.trim().toLowerCase();
    const exact = DISTRICT_POINTS.find((p) => p.state.toLowerCase() === s && p.district.toLowerCase() === d);
    if (exact) return exact;
    const partial = DISTRICT_POINTS.find(
      (p) => p.state.toLowerCase() === s && (p.district.toLowerCase().includes(d) || d.includes(p.district.toLowerCase())),
    );
    if (partial) return partial;
  }
  return DISTRICT_POINTS.find((p) => p.state.toLowerCase() === s) ?? null;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}
