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

const OPTIONS = [
  { key: 'images/4686c0b060c3a3f60095bcbe7fbe5aa7.jpg', url: img0 },
  { key: 'images/5d036fd7d9fb35f95288f64c3a8cb7b8.jpg', url: img1 },
  { key: 'images/IMG-20260828-WA0000.jpg', url: img2 },
  { key: 'images/IMG-20260828-WA0001.jpg', url: img3 },
  { key: 'images/IMG-20260828-WA0002.jpg', url: img4 },
  { key: 'images/IMG-20260828-WA0003.jpg', url: img5 },
  { key: 'images/IMG-20260828-WA0004.jpg', url: img6 },
  { key: 'images/IMG-20260828-WA0005.jpg', url: img7 },
  { key: 'images/IMG-20260828-WA0006.jpg', url: img8 },
  { key: 'images/IMG-20260828-WA0007.jpg', url: img9 },
  { key: 'images/IMG-20260828-WA0008.jpg', url: img10 },
  { key: 'images/IMG-20260828-WA0009.jpg', url: img11 },
  { key: 'images/IMG-20260828-WA0011.jpg', url: img12 },
  { key: 'images/IMG-20260828-WA0012.jpg', url: img13 },
  { key: 'images/IMG-20260828-WA0015.jpg', url: img14 },
  { key: 'images/IMG-20260828-WA0017.jpg', url: img15 },
  { key: 'images/IMG-20260828-WA0018.jpg', url: img16 },
  { key: 'images/IMG-20260828-WA0019.jpg', url: img17 },
  { key: 'images/IMG-20260828-WA0020.jpg', url: img18 },
];

// Resolve the stored featuredImage key (e.g. "images/WA0004.jpg") into an
// importable asset. Falls back to the first curated image for legacy/blank
// values so cards never render a broken image.
export function resolveBlogImage(key) {
  const normalized = String(key || '').trim();
  const hit = OPTIONS.find((o) => {
    return (
      o.key.toLowerCase() === normalized.toLowerCase() ||
      o.url.split('/').pop().split('?')[0].toLowerCase() ===
        normalized.toLowerCase()
    );
  });
  return (hit || OPTIONS[0]).url;
}

export function blogImagePool() {
  return OPTIONS;
}