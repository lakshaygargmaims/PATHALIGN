import { prisma } from '@/lib/db';
import { findDistrictPoint, haversineKm, type DistrictPoint } from '@/lib/geo';
import type { OpportunitySearchInput } from '@/lib/validation/schemas';

// ------------------------------------------------------------
// Local Opportunity Radar — real records from the database.
// Training centres and employer vacancies are kept separate.
// ------------------------------------------------------------

export interface RadarResult {
  origin: DistrictPoint | null;
  originLabel: string;
  providerCount: number;
  courseCount: number;
  vacancyCount: number;
  apprenticeshipCount: number;
  providers: Array<{
    id: string;
    name: string;
    type: string;
    state: string;
    district: string;
    city: string | null;
    pinCode: string | null;
    lat: number | null;
    lng: number | null;
    verificationStatus: string;
    isSynthetic: boolean;
    distanceKm: number | null;
    affiliation: string | null;
    courses: Array<{
      tradeId: string;
      tradeName: string;
      durationMonths: number;
      feeMin: number | null;
      feeMax: number | null;
      eligibility: string | null;
      nsqfLevel: number | null;
    }>;
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    kind: 'VACANCY' | 'APPRENTICESHIP' | 'OPPORTUNITY';
    sector: string;
    employmentType: string;
    employerName: string | null;
    state: string | null;
    district: string | null;
    description: string;
    openPositions: number | null;
    sourceUrl: string | null;
    verificationStatus: string;
    isSynthetic: boolean;
    distanceKm: number | null;
  }>;
  notes: string[];
}

export async function searchOpportunities(input: OpportunitySearchInput): Promise<RadarResult> {
  const origin = findDistrictPoint(input.state, input.district);

  const providers = await prisma.trainingProvider.findMany({
    where: {
      state: { equals: input.state, mode: 'insensitive' },
      ...(input.district
        ? { district: { contains: input.district, mode: 'insensitive' } }
        : {}),
      ...(input.providerType ? { type: input.providerType } : {}),
    },
    include: {
      courses: {
        include: { trade: { select: { id: true, name: true, nsqfLevel: true } } },
      },
    },
    take: 200,
  });

  const filteredProviders = providers.filter((p) => {
    const courses = p.courses.filter((c) => {
      if (input.tradeId && c.tradeId !== input.tradeId) return false;
      if (input.maxDurationMonths && c.durationMonths > input.maxDurationMonths) return false;
      if (input.maxFee != null && (c.feeMax ?? c.feeMin ?? 0) > input.maxFee) return false;
      return true;
    });
    if (input.tradeId || input.maxDurationMonths || input.maxFee != null) return courses.length > 0;
    return true;
  });

  const withDistance = filteredProviders
    .map((p) => {
      const point = p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null;
      const distanceKm = origin && point ? haversineKm(origin, point) : null;
      const courses = p.courses
        .filter((c) => {
          if (input.tradeId && c.tradeId !== input.tradeId) return false;
          if (input.maxDurationMonths && c.durationMonths > input.maxDurationMonths) return false;
          if (input.maxFee != null && (c.feeMax ?? c.feeMin ?? 0) > input.maxFee) return false;
          return true;
        })
        .map((c) => ({
          tradeId: c.trade.id,
          tradeName: c.trade.name,
          durationMonths: c.durationMonths,
          feeMin: c.feeMin,
          feeMax: c.feeMax,
          eligibility: c.eligibility,
          nsqfLevel: c.trade.nsqfLevel,
        }));
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        state: p.state,
        district: p.district,
        city: p.city,
        pinCode: p.pinCode,
        lat: p.lat,
        lng: p.lng,
        verificationStatus: p.verificationStatus,
        isSynthetic: p.isSynthetic,
        distanceKm,
        affiliation: p.affiliation,
        courses,
      };
    })
    .filter((p) => p.courses.length > 0 || (!input.tradeId && !input.maxDurationMonths && input.maxFee == null))
    .filter((p) => p.distanceKm == null || p.distanceKm <= input.radiusKm)
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

  const oppWhere = {
    state: { equals: input.state, mode: 'insensitive' as const },
    ...(input.district ? { district: { contains: input.district, mode: 'insensitive' as const } } : {}),
    ...(input.tradeId ? { tradeId: input.tradeId } : {}),
    ...(input.includeVacancies ? {} : { isVacancy: false }),
  };

  const opportunities = await prisma.employmentOpportunity.findMany({
    where: oppWhere,
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

  const oppWithDistance = opportunities
    .map((o) => {
      const point =
        o.state && o.district ? findDistrictPoint(o.state, o.district) : null;
      const distanceKm = origin && point ? haversineKm(origin, point) : null;
      return {
        id: o.id,
        title: o.title,
        kind: (o.isVacancy ? 'VACANCY' : o.employmentType === 'APPRENTICESHIP' ? 'APPRENTICESHIP' : 'OPPORTUNITY') as
          | 'VACANCY'
          | 'APPRENTICESHIP'
          | 'OPPORTUNITY',
        sector: o.sector,
        employmentType: o.employmentType,
        employerName: o.employerName,
        state: o.state,
        district: o.district,
        description: o.description,
        openPositions: o.openPositions,
        sourceUrl: o.sourceUrl,
        verificationStatus: o.verificationStatus,
        isSynthetic: o.isSynthetic,
        distanceKm,
      };
    })
    .filter((o) => o.distanceKm == null || o.distanceKm <= input.radiusKm);

  const courseCount = withDistance.reduce((s, p) => s + p.courses.length, 0);
  const notes = [
    'Training centres (ITIs, skill centres) are educational institutions — they are NOT employers.',
    'Items marked "Vacancy" come from employer records and each shows its verification status.',
    origin
      ? `Distances are approximate, measured from the ${origin.district} district headquarter.`
      : 'Coordinates for this district are not available yet, so distances are not shown.',
    'Demo deployment: institution and opportunity records are clearly marked synthetic until an administrator imports and verifies official datasets.',
  ];

  return {
    origin,
    originLabel: origin ? `${origin.district}, ${origin.state}` : input.district ? `${input.district}, ${input.state}` : input.state,
    providerCount: withDistance.length,
    courseCount,
    vacancyCount: withDistance ? oppWithDistance.filter((o) => o.kind === 'VACANCY').length : 0,
    apprenticeshipCount: oppWithDistance.filter((o) => o.kind === 'APPRENTICESHIP').length,
    providers: withDistance,
    opportunities: oppWithDistance,
    notes,
  };
}
