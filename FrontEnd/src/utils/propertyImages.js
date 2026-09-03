import img0 from '../assets/media/4686c0b060c3a3f60095bcbe7fbe5aa7.jpg';
import img1 from '../assets/media/5d036fd7d9fb35f95288f64c3a8cb7b8.jpg';
import img2 from '../assets/media/IMG-20260828-WA0000.jpg';
import img3 from '../assets/media/IMG-20260828-WA0001.jpg';
import img4 from '../assets/media/IMG-20260828-WA0002.jpg';
import img5 from '../assets/media/IMG-20260828-WA0003.jpg';
import img6 from '../assets/media/IMG-20260828-WA0004.jpg';
import img7 from '../assets/media/IMG-20260828-WA0005.jpg';
import img8 from '../assets/media/IMG-20260828-WA0006.jpg';
import img9 from '../assets/media/IMG-20260828-WA0007.jpg';
import img10 from '../assets/media/IMG-20260828-WA0008.jpg';
import img11 from '../assets/media/IMG-20260828-WA0009.jpg';
import img12 from '../assets/media/IMG-20260828-WA0011.jpg';
import img13 from '../assets/media/IMG-20260828-WA0012.jpg';
import img14 from '../assets/media/IMG-20260828-WA0015.jpg';
import img15 from '../assets/media/IMG-20260828-WA0017.jpg';
import img16 from '../assets/media/IMG-20260828-WA0018.jpg';
import img17 from '../assets/media/IMG-20260828-WA0019.jpg';
import img18 from '../assets/media/IMG-20260828-WA0020.jpg';

// All available project photos. Filters aren't perfect; these are real
// Riverbells photos used to illustrate each stay type.
const ALL_IMAGES = [
  img0, img1, img2, img3, img4, img5, img6, img7, img8, img9,
  img10, img11, img12, img13, img14, img15, img16, img17, img18,
];

// Default pool per property type — used when a property has no images
// configured. This is a graceful fallback only; real assignments are
// data-driven through the property `images` field.
const TYPE_DEFAULTS = {
  villa: [img15, img16, img17],
  room: [img7, img8, img9],
  tent: [img3, img4, img5],
  lawn: [img12, img13, img14],
  other: [img2, img3, img4],
};

const KNOWN = {
  'FULL-VILLA': [img15, img16, img17],
  'ROOM-101': [img7, img8, img9],
  'ROOM-102': [img9, img7, img8],
  'LAKESIDE-TENT': [img3, img4, img5],
  'MARRIAGE-LAWN': [img12, img13, img14],
};

// Resolve the `images` array stored on a property into importable URLs.
// Support: known property-code keys, direct file names in the project,
// and a type-based default pool.
export function resolvePropertyImages(property) {
  const code = property?.propertyCode;
  const type = property?.type;
  const stored = property?.images || [];

  const resolved = stored
    .map((key) => {
      const normalized = String(key || '').trim();
      if (!normalized) return null;

      if (KNOWN[normalized.toUpperCase()]) return KNOWN[normalized.toUpperCase()][0];
      if (/^images\//.test(normalized)) {
        const short = normalized.replace(/^images\//, '').toLowerCase();
        const match = ALL_IMAGES.find((img) => img.toLowerCase().includes(short));
        if (match) return match;
      }

      const exact = ALL_IMAGES.find((img) => {
        const base = img.split('/').pop().split('?')[0].toLowerCase();
        return base === normalized.toLowerCase();
      });
      if (exact) return exact;

      return null;
    })
    .filter(Boolean);

  const fromCode = KNOWN[String(code || '').toUpperCase()];
  const fallback = fromCode || TYPE_DEFAULTS[type] || TYPE_DEFAULTS.other;

  return resolved.length > 0 ? resolved : fallback;
}

export function resolvePropertyMainImage(property) {
  const resolved = resolvePropertyImages(property);
  return resolved[0] || null;
}
