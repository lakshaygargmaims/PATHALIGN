export interface SeedSalary {
  entry: [number, number];
  mid: [number, number];
  senior: [number, number];
}

export interface SeedTrade {
  name: string;
  slug: string;
  category: string;
  description: string;
  durationMonths: number;
  nsqfLevel: number | null;
  eligibility: string;
  feeMin: number;
  feeMax: number;
  salary: SeedSalary;
  selfEmployment: boolean;
  /** Titles used to build the four-stage progression pathway. */
  stages: {
    entryRole: string;
    midRole: string;
    seniorRole: string;
    furtherEducation: string;
  };
}

/**
 * Synthetic demo catalogue. Fee and salary figures are illustrative
 * ranges for the demo, always stored with isEstimate + SYNTHETIC_DEMO
 * status. Replace through the admin import + verification workflow.
 */
export const SEED_TRADES: SeedTrade[] = [
  {
    name: 'Electrician',
    slug: 'electrician',
    category: 'Engineering & Electrical',
    description:
      'Installation, maintenance and repair of electrical wiring, panels, machines and lighting systems in homes, factories and infrastructure projects. One of the most widely demanded ITI trades.',
    durationMonths: 24,
    nsqfLevel: 5,
    eligibility: 'Class 10th pass (entry norms vary by institute — verify with the institute)',
    feeMin: 10000,
    feeMax: 45000,
    salary: { entry: [12000, 18000], mid: [25000, 40000], senior: [45000, 75000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Junior electrician / wireman (site or factory)',
      midRole: 'Site electrician / maintenance technician',
      seniorRole: 'Electrical supervisor, contractor or own electrical business',
      furtherEducation: 'Diploma in Electrical Engineering (subject to applicable lateral-entry rules)',
    },
  },
  {
    name: 'Fitter (Mechanic Fitter)',
    slug: 'mechanic-fitter',
    category: 'Engineering & Mechanical',
    description:
      'Assembly, alignment and maintenance of heavy machinery, pumps, compressors and industrial equipment. Core manufacturing trade with steady demand in industrial belts.',
    durationMonths: 24,
    nsqfLevel: 5,
    eligibility: 'Class 10th pass (entry norms vary by institute — verify with the institute)',
    feeMin: 10000,
    feeMax: 50000,
    salary: { entry: [13000, 20000], mid: [26000, 42000], senior: [48000, 80000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Trainee fitter / machine assembler',
      midRole: 'Industrial fitter / maintenance fitter',
      seniorRole: 'Mechanical supervisor, service contractor or own workshop',
      furtherEducation: 'Diploma in Mechanical Engineering (subject to applicable rules)',
    },
  },
  {
    name: 'Welder (Gas & Electric)',
    slug: 'welder-gas-electric',
    category: 'Engineering & Fabrication',
    description:
      'Joining and cutting of metal components using arc, MIG/TIG and gas welding for fabrication, construction, shipbuilding and automotive work.',
    durationMonths: 12,
    nsqfLevel: 4,
    eligibility: 'Class 8th–10th pass (varies by institute)',
    feeMin: 6000,
    feeMax: 25000,
    salary: { entry: [12000, 18000], mid: [22000, 36000], senior: [40000, 65000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Trainee welder / fabrication helper',
      midRole: 'Certified welder (structural, pressure or pipe work)',
      seniorRole: 'Welding inspector, fabrication supervisor or own fabrication unit',
      furtherEducation: 'Welding certification courses and diplomas (verify current certifications)',
    },
  },
  {
    name: 'Solar PV Technician',
    slug: 'solar-pv-technician',
    category: 'Green Energy',
    description:
      'Installation, commissioning and maintenance of rooftop and ground-mounted solar photovoltaic systems, including wiring, inverters and safety procedures.',
    durationMonths: 6,
    nsqfLevel: 4,
    eligibility: 'Class 10th pass (some institutes accept Class 8th)',
    feeMin: 8000,
    feeMax: 35000,
    salary: { entry: [15000, 22000], mid: [28000, 45000], senior: [50000, 80000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Solar installation technician / panel installer',
      midRole: 'Site supervisor for rooftop solar projects',
      seniorRole: 'Project supervisor or own solar installation business',
      furtherEducation: 'Diploma / degree in electrical or renewable energy (subject to eligibility)',
    },
  },
  {
    name: 'Refrigeration & AC Mechanic',
    slug: 'refrigeration-ac-mechanic',
    category: 'Engineering & Electrical',
    description:
      'Installation and servicing of refrigerators, air conditioners, cold storage and commercial cooling equipment — residential, commercial and industrial segments.',
    durationMonths: 24,
    nsqfLevel: 5,
    eligibility: 'Class 10th pass',
    feeMin: 12000,
    feeMax: 50000,
    salary: { entry: [14000, 20000], mid: [25000, 40000], senior: [45000, 70000] },
    selfEmployment: true,
    stages: {
      entryRole: 'AC service technician / apprentice',
      midRole: 'Senior service technician (split/ducted systems)',
      seniorRole: 'Service centre owner or maintenance contract supervisor',
      furtherEducation: 'Diploma in Mechanical / Refrigeration & Air Conditioning',
    },
  },
  {
    name: 'Computer Operator & Programming Assistant (COPA)',
    slug: 'computer-operator-programming-assistant',
    category: 'IT & Software',
    description:
      'Fundamentals of computer operations, office automation, database basics and introductory programming — a base for IT support and junior development roles.',
    durationMonths: 12,
    nsqfLevel: 4,
    eligibility: 'Class 10th pass',
    feeMin: 8000,
    feeMax: 40000,
    salary: { entry: [15000, 25000], mid: [30000, 55000], senior: [60000, 110000] },
    selfEmployment: false,
    stages: {
      entryRole: 'Computer operator / IT support assistant',
      midRole: 'Junior software / support engineer',
      seniorRole: 'Team lead or independent IT service provider',
      furtherEducation: 'BCA / B.Sc. (CS) / diploma — subject to applicable eligibility rules',
    },
  },
  {
    name: 'Mechanic (Diesel)',
    slug: 'mechanic-diesel',
    category: 'Automobile',
    description:
      'Service, repair and overhaul of diesel engines used in trucks, buses, generators, tractors and construction equipment.',
    durationMonths: 24,
    nsqfLevel: 5,
    eligibility: 'Class 10th pass',
    feeMin: 10000,
    feeMax: 45000,
    salary: { entry: [13000, 19000], mid: [24000, 38000], senior: [42000, 68000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Diesel mechanic assistant / workshop trainee',
      midRole: 'Heavy vehicle diesel mechanic',
      seniorRole: 'Workshop supervisor or own garage',
      furtherEducation: 'Automobile / Mechanical diploma (subject to applicable rules)',
    },
  },
  {
    name: 'Mechanic (Two Wheeler)',
    slug: 'mechanic-two-wheeler',
    category: 'Automobile',
    description:
      'Diagnosis, service and repair of motorcycles and scooters — engine, electrical, fuel and suspension systems. Strong small-town self-employment potential.',
    durationMonths: 12,
    nsqfLevel: 4,
    eligibility: 'Class 8th–10th pass',
    feeMin: 6000,
    feeMax: 30000,
    salary: { entry: [11000, 17000], mid: [20000, 32000], senior: [35000, 55000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Two-wheeler service technician',
      midRole: 'Lead technician at a service centre',
      seniorRole: 'Own service centre / dealership workshop',
      furtherEducation: 'Automobile diploma or certificate specialisations',
    },
  },
  {
    name: 'Electronics Mechanic',
    slug: 'electronics-mechanic',
    category: 'Electronics',
    description:
      'Assembly, testing and repair of electronic equipment and circuits — from consumer electronics to industrial control panels and communication devices.',
    durationMonths: 24,
    nsqfLevel: 5,
    eligibility: 'Class 10th pass (Maths/Science preferred)',
    feeMin: 10000,
    feeMax: 48000,
    salary: { entry: [14000, 21000], mid: [26000, 42000], senior: [45000, 75000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Electronics trainee / test technician',
      midRole: 'Service technician or PCB assembly supervisor',
      seniorRole: 'Electronics service business or production supervisor',
      furtherEducation: 'Diploma / B.Tech in Electronics (subject to eligibility)',
    },
  },
  {
    name: 'Fashion Design & Technology',
    slug: 'fashion-design-technology',
    category: 'Apparel & Design',
    description:
      'Garment construction, pattern making, computer-aided design and production techniques for apparel units, boutiques and independent studios.',
    durationMonths: 12,
    nsqfLevel: 4,
    eligibility: 'Class 10th pass',
    feeMin: 8000,
    feeMax: 40000,
    salary: { entry: [10000, 16000], mid: [18000, 32000], senior: [35000, 60000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Sewing machine operator / trainee designer',
      midRole: 'Pattern maker or boutique assistant designer',
      seniorRole: 'Own boutique, studio or production unit',
      furtherEducation: 'Diploma / degree in fashion design (subject to eligibility)',
    },
  },
  {
    name: 'Beautician & Skin Care',
    slug: 'beautician-skin-care',
    category: 'Personal Services',
    description:
      'Professional beauty, skincare, hair and makeup services with hygiene and product-safety standards — employable in salons or own practice.',
    durationMonths: 6,
    nsqfLevel: 3,
    eligibility: 'Class 10th pass (minimum age norms vary by institute)',
    feeMin: 5000,
    feeMax: 30000,
    salary: { entry: [9000, 15000], mid: [16000, 30000], senior: [30000, 60000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Trainee beautician at a salon',
      midRole: 'Senior beautician / salon stylist',
      seniorRole: 'Own salon or freelance specialist',
      furtherEducation: 'Advanced specialisation diplomas in cosmetology',
    },
  },
  {
    name: 'Food Production (Cook)',
    slug: 'food-production-cook',
    category: 'Hospitality & Food',
    description:
      'Commercial kitchen production — planning, preparing and plating Indian, continental and bakery items with food-safety and hygiene standards.',
    durationMonths: 12,
    nsqfLevel: 4,
    eligibility: 'Class 10th pass',
    feeMin: 8000,
    feeMax: 35000,
    salary: { entry: [12000, 18000], mid: [22000, 38000], senior: [40000, 70000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Commis / kitchen trainee',
      midRole: 'Chef de partie (section chef)',
      seniorRole: 'Head chef, kitchen manager or own food business',
      furtherEducation: 'Diploma in hotel management / food production (subject to eligibility)',
    },
  },
  {
    name: 'Bakery & Confectionery',
    slug: 'bakery-confectionery',
    category: 'Hospitality & Food',
    description:
      'Production of breads, cakes, pastries and confectionery with standardised recipes, food safety and packaging practices.',
    durationMonths: 6,
    nsqfLevel: 3,
    eligibility: 'Class 8th–10th pass',
    feeMin: 6000,
    feeMax: 28000,
    salary: { entry: [10000, 16000], mid: [18000, 30000], senior: [32000, 55000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Bakery trainee / production assistant',
      midRole: 'Baker / pastry assistant',
      seniorRole: 'Head baker or own bakery business',
      furtherEducation: 'Food production diplomas and entrepreneurship programmes',
    },
  },
  {
    name: 'Plumbing & Sanitary Works',
    slug: 'plumbing-sanitary-works',
    category: 'Construction & Building',
    description:
      'Water supply, drainage and sanitary fixture installation for residential, commercial and municipal projects — a trade with steady construction-sector demand.',
    durationMonths: 12,
    nsqfLevel: 4,
    eligibility: 'Class 8th–10th pass',
    feeMin: 7000,
    feeMax: 30000,
    salary: { entry: [13000, 20000], mid: [24000, 40000], senior: [45000, 70000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Plumbing helper / site apprentice',
      midRole: 'Licensed plumber (residential/commercial)',
      seniorRole: 'Site supervisor or own contracting business',
      furtherEducation: 'Building services diploma / certification courses',
    },
  },
  {
    name: 'Carpenter (Furniture & Interior)',
    slug: 'carpenter-furniture-interior',
    category: 'Construction & Woodworking',
    description:
      'Manufacture and installation of furniture, formwork and interior woodwork using hand tools, power tools and modular hardware systems.',
    durationMonths: 12,
    nsqfLevel: 4,
    eligibility: 'Class 8th–10th pass',
    feeMin: 6000,
    feeMax: 30000,
    salary: { entry: [11000, 18000], mid: [20000, 35000], senior: [38000, 65000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Carpentry helper / furniture trainee',
      midRole: 'Furniture carpenter / interior fitter',
      seniorRole: 'Workshop supervisor or own furniture business',
      furtherEducation: 'Interior design / woodworking diploma courses',
    },
  },
  {
    name: 'Hospital Housekeeping & Hygiene',
    slug: 'hospital-housekeeping-hygiene',
    category: 'Healthcare Support',
    description:
      'Cleaning, disinfection, biomedical-waste handling and linen management in hospitals with infection-control standards.',
    durationMonths: 6,
    nsqfLevel: 3,
    eligibility: 'Class 8th pass minimum (varies)',
    feeMin: 4000,
    feeMax: 18000,
    salary: { entry: [10000, 15000], mid: [16000, 26000], senior: [28000, 45000] },
    selfEmployment: false,
    stages: {
      entryRole: 'Housekeeping attendant',
      midRole: 'Ward housekeeping supervisor',
      seniorRole: 'Facilities / housekeeping manager',
      furtherEducation: 'Hospital administration certificate courses (subject to eligibility)',
    },
  },
  {
    name: 'Mobile Repair & Maintenance',
    slug: 'mobile-repair-maintenance',
    category: 'IT & Hardware',
    description:
      'Diagnosis and repair of smartphones — displays, batteries, charging circuits and software flashing — with micro-soldering skills.',
    durationMonths: 6,
    nsqfLevel: 3,
    eligibility: 'Class 10th pass',
    feeMin: 5000,
    feeMax: 20000,
    salary: { entry: [10000, 16000], mid: [18000, 32000], senior: [35000, 60000] },
    selfEmployment: true,
    stages: {
      entryRole: 'Trainee technician at a repair shop',
      midRole: 'Independent repair technician',
      seniorRole: 'Own repair store or service franchise',
      furtherEducation: 'Advanced hardware / electronics certification courses',
    },
  },
  {
    name: 'Electric Vehicle (EV) Repair Technician',
    slug: 'ev-repair-technician',
    category: 'Green Energy',
    description:
      'Service and repair of electric two-wheelers, three-wheelers and light EVs — battery packs, motors, BMS and high-voltage safety procedures.',
    durationMonths: 12,
    nsqfLevel: 4,
    eligibility: 'Class 10th pass (Electrical/Electronics exposure helpful)',
    feeMin: 15000,
    feeMax: 60000,
    salary: { entry: [16000, 25000], mid: [30000, 50000], senior: [55000, 90000] },
    selfEmployment: true,
    stages: {
      entryRole: 'EV service trainee / assistant technician',
      midRole: 'EV service technician (battery & drivetrain)',
      seniorRole: 'EV service centre owner or workshop supervisor',
      furtherEducation: 'Automobile / Electrical diploma with EV specialisation',
    },
  },
];
