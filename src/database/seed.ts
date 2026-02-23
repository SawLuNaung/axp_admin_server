import { pool } from './pool';

// ─── Seed data (matches the frontend's hardcoded INITIAL_* constants) ───

const PLANS = [
  {
    id: '1',
    title: 'Starter',
    price: '$9',
    period: '/month',
    features: [
      '1,000 SMS messages per month',
      'Basic API access',
      'Email support',
      'Delivery reports',
      'Single user account',
      'Shared inbox for replies',
      'Basic analytics dashboard',
    ],
    button_text: 'Choose Plan',
    button_variant: 'secondary',
    is_popular: false,
    sort_order: 0,
  },
  {
    id: '2',
    title: 'Business',
    price: '$9',
    period: '/month',
    features: [
      '5,000 SMS messages per month',
      'Full API access',
      'Priority email support',
      'Advanced analytics',
      'Multiple user accounts',
      'Custom sender ID',
      'Automatic top-up options',
      'Team permissions & roles',
      'Exportable billing reports',
    ],
    button_text: 'Get Started',
    button_variant: 'primary',
    is_popular: true,
    sort_order: 1,
  },
  {
    id: '3',
    title: 'Enterprise',
    price: '$49',
    period: '/month',
    features: [
      '20,000 SMS messages per month',
      'Premium API access',
      '24/7 phone & email support',
      'Advanced analytics & reporting',
      'Unlimited user accounts',
      'Custom integrations',
      'Dedicated account manager',
      'High-volume discounts',
      'Advanced security & compliance',
      'SLA-backed uptime guarantees',
    ],
    button_text: 'Choose Plan',
    button_variant: 'secondary',
    is_popular: false,
    sort_order: 2,
  },
];

const PARTNERS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    title: 'Marketing Director',
    company: 'TechCorp',
    quote:
      'SMS Gateway has transformed how we communicate with our customers. The delivery rate is excellent and the API is incredibly easy to integrate.',
    image_url: '',
    featured: true,
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'CTO',
    company: 'E-commerce Solutions',
    quote:
      "We've tried multiple SMS providers, but none compare to the reliability and features offered by SMS Gateway. Our customer engagement has increased by 40%.",
    image_url: '',
    featured: true,
  },
  {
    id: '3',
    name: 'Emily Davis',
    title: 'Operations Manager',
    company: 'LogiFlow',
    quote:
      'Fast delivery and clear reporting. Exactly what we needed for our notification system.',
    image_url: '',
    featured: true,
  },
  {
    id: '4',
    name: 'James Wilson',
    title: 'Head of Customer Success',
    company: 'SupportPro',
    quote:
      'The team behind SMS Gateway is responsive and the platform keeps improving. Highly recommend.',
    image_url: '',
    featured: false,
  },
  {
    id: '5',
    name: 'Lisa Park',
    title: 'Product Lead',
    company: 'AppWorks',
    quote:
      'Integration took a day. Delivery rates are consistently high. Our users love the reliability.',
    image_url: '',
    featured: false,
  },
];

const LOGOS = [
  { id: '1', name: 'NMRE', image_url: '', link_url: '', sort_order: 0 },
  { id: '2', name: 'Power Play', image_url: '', link_url: '', sort_order: 1 },
  { id: '3', name: 'V.Jun', image_url: '', link_url: '', sort_order: 2 },
  { id: '4', name: 'Bon Chon', image_url: '', link_url: '', sort_order: 3 },
  { id: '5', name: 'CB Life', image_url: '', link_url: '', sort_order: 4 },
  { id: '6', name: 'Alpha International', image_url: '', link_url: '', sort_order: 5 },
  { id: '7', name: 'MULA', image_url: '', link_url: '', sort_order: 6 },
];

// ─── Seed functions ───

async function seed(): Promise<void> {
  console.log('[Seed] Inserting initial data...');

  // Clear existing data first (safe for dev)
  await pool.query('DELETE FROM plans');
  await pool.query('DELETE FROM partners');
  await pool.query('DELETE FROM partner_logos');

  // Insert plans
  for (const p of PLANS) {
    await pool.query(
      `INSERT INTO plans (id, title, price, period, features, button_text, button_variant, is_popular, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [p.id, p.title, p.price, p.period, JSON.stringify(p.features), p.button_text, p.button_variant, p.is_popular, p.sort_order]
    );
  }
  console.log(`[Seed] ✓ ${PLANS.length} plans`);

  // Insert partners
  for (const p of PARTNERS) {
    await pool.query(
      `INSERT INTO partners (id, name, title, company, quote, image_url, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [p.id, p.name, p.title, p.company, p.quote, p.image_url, p.featured]
    );
  }
  console.log(`[Seed] ✓ ${PARTNERS.length} partners`);

  // Insert logos
  for (const l of LOGOS) {
    await pool.query(
      `INSERT INTO partner_logos (id, name, image_url, link_url, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [l.id, l.name, l.image_url, l.link_url, l.sort_order]
    );
  }
  console.log(`[Seed] ✓ ${LOGOS.length} logos`);

  console.log('[Seed] Done.');
}

// Run directly: npm run seed
seed()
  .catch((err) => {
    console.error('[Seed] Failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
