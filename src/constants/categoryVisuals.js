const VISUALS = {
  medicines: { aliases: ['medicines-pharmacy', 'medicines', 'pharmacy', 'pharmacy-health'], home: '/images/categories/health-home.svg', hero: '/images/categories/health-hero.svg' },
  supplies: { aliases: ['medical-supplies', 'healthcare-supplies', 'supplies'], home: '/images/categories/other-home.svg', hero: '/images/categories/other-hero.svg' },
  diagnostic: { aliases: ['diagnostic-laboratory', 'diagnostic', 'laboratory', 'lab'], home: '/images/categories/health-home.svg', hero: '/images/categories/health-hero.svg' },
  equipment: { aliases: ['medical-equipment', 'equipment'], home: '/images/categories/electronics-home.svg', hero: '/images/categories/electronics-hero.svg' },
  surgical: { aliases: ['surgical-clinical', 'surgical', 'clinical'], home: '/images/categories/health-home.svg', hero: '/images/categories/health-hero.svg' },
  ppe: { aliases: ['ppe-infection-control', 'ppe', 'infection-control'], home: '/images/categories/health-home.svg', hero: '/images/categories/health-hero.svg' },
  consumables: { aliases: ['healthcare-consumables', 'consumables', 'disposables'], home: '/images/categories/other-home.svg', hero: '/images/categories/other-hero.svg' },
  other: { aliases: ['other-healthcare', 'other'], home: '/images/categories/other-home.svg', hero: '/images/categories/other-hero.svg' },
};

const normalize = (value = '') => value.toLowerCase().trim().replace(/&/g, 'and').replace(/[_\s]+/g, '-');

export function getCategoryVisual(category) {
  const key = normalize(typeof category === 'string' ? category : category?.slug || category?.name);
  for (const visual of Object.values(VISUALS)) {
    if (visual.aliases.some((alias) => { const a = normalize(alias); return key === a || key.startsWith(`${a}-`); })) return visual;
  }
  return VISUALS.other;
}
