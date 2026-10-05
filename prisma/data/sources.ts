export interface SeedSource {
  key: string;
  name: string;
  url: string | null;
  publisher: string;
  category: 'GOVERNMENT' | 'OFFICIAL_BODY' | 'PSU' | 'NGO' | 'ACADEMIC' | 'COMMERCIAL' | 'INTERNAL_DEMO';
  description: string;
  geographicScope: string;
  isSynthetic: boolean;
  verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' | 'OUTDATED' | 'UNAVAILABLE' | 'SYNTHETIC_DEMO';
}

/**
 * Official reference sources. URLs point at the bodies' public portals.
 * verificationStatus stays PENDING_VERIFICATION until an administrator
 * confirms the record inside this deployment (Data Verification module).
 * No official statistic is asserted as verified just by being listed here.
 */
export const SEED_SOURCES: SeedSource[] = [
  {
    key: 'DEMO',
    name: 'PATHALIGN demo dataset (synthetic)',
    url: null,
    publisher: 'PATHALIGN AI',
    category: 'INTERNAL_DEMO',
    description:
      'Synthetic demonstration records for trades, salaries, providers and knowledge chunks. Clearly marked synthetic everywhere it is used. Replace via admin CSV import + verification workflow.',
    geographicScope: 'Demo (India-wide samples)',
    isSynthetic: true,
    verificationStatus: 'SYNTHETIC_DEMO',
  },
  {
    key: 'DGT',
    name: 'Directorate General of Training (DGT)',
    url: 'https://dgt.gov.in',
    publisher: 'Ministry of Skill Development and Entrepreneurship',
    category: 'GOVERNMENT',
    description: 'Official DGT portal — Craftsman Training Scheme, ITI information, apprenticeship guidance.',
    geographicScope: 'India',
    isSynthetic: false,
    verificationStatus: 'PENDING_VERIFICATION',
  },
  {
    key: 'MSDE',
    name: 'Ministry of Skill Development and Entrepreneurship',
    url: 'https://www.msde.gov.in',
    publisher: 'Government of India',
    category: 'GOVERNMENT',
    description: 'Ministry portal covering skill development policy, schemes and programme information.',
    geographicScope: 'India',
    isSynthetic: false,
    verificationStatus: 'PENDING_VERIFICATION',
  },
  {
    key: 'NCS',
    name: 'National Career Service (NCS)',
    url: 'https://www.ncs.gov.in',
    publisher: 'Ministry of Labour & Employment',
    category: 'GOVERNMENT',
    description: 'Career service portal with job listings, career information and counselling resources.',
    geographicScope: 'India',
    isSynthetic: false,
    verificationStatus: 'PENDING_VERIFICATION',
  },
  {
    key: 'SIDH',
    name: 'Skill India Digital Hub',
    url: 'https://skillindiadigital.gov.in',
    publisher: 'NSDC / MSDE',
    category: 'GOVERNMENT',
    description: 'Digital platform for skill training, courses and learner records under Skill India programmes.',
    geographicScope: 'India',
    isSynthetic: false,
    verificationStatus: 'PENDING_VERIFICATION',
  },
  {
    key: 'NCVET',
    name: 'National Council for Vocational Education and Training (NCVET)',
    url: 'https://ncvet.gov.in',
    publisher: 'NCVET',
    category: 'OFFICIAL_BODY',
    description: 'Regulatory body for vocational education and training — awarding body and recognition information.',
    geographicScope: 'India',
    isSynthetic: false,
    verificationStatus: 'PENDING_VERIFICATION',
  },
  {
    key: 'NSQF',
    name: 'National Skills Qualifications Framework (NSQF)',
    url: null,
    publisher: 'NSQF India',
    category: 'OFFICIAL_BODY',
    description:
      'NSQF defines competency levels for qualifications. Official portal URL to be confirmed during verification — do not treat level mappings here as verified until an administrator records the source URL.',
    geographicScope: 'India',
    isSynthetic: false,
    verificationStatus: 'PENDING_VERIFICATION',
  },
  {
    key: 'APPRENTICESHIP',
    name: 'Apprenticeship India portal',
    url: 'https://www.apprenticeshipindia.gov.in',
    publisher: 'DGT / MSDE',
    category: 'GOVERNMENT',
    description: 'Apprenticeship training opportunities, contract guidance and establishment information.',
    geographicScope: 'India',
    isSynthetic: false,
    verificationStatus: 'PENDING_VERIFICATION',
  },
  {
    key: 'NSDC',
    name: 'National Skill Development Corporation (NSDC)',
    url: 'https://www.nsdcindia.org',
    publisher: 'NSDC',
    category: 'OFFICIAL_BODY',
    description: 'Skill training ecosystem information, partner institutions and sector skill councils.',
    geographicScope: 'India',
    isSynthetic: false,
    verificationStatus: 'PENDING_VERIFICATION',
  },
  {
    key: 'PMKVY',
    name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',
    url: 'https://www.pmkvyofficial.org',
    publisher: 'NSDC / MSDE',
    category: 'GOVERNMENT',
    description: 'Short-term skill training scheme information. Verify current scheme guidelines before quoting benefits.',
    geographicScope: 'India',
    isSynthetic: false,
    verificationStatus: 'PENDING_VERIFICATION',
  },
];
