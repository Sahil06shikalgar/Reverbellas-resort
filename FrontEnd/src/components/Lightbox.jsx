import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Lightbox({ items, index, onClose, onNavigate }) {
  const item = items?.[index];
  const [closing, setClosing] = useState(false);
  const timerRef = useRef(null);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    timerRef.current = setTimeout(onClose, 250);
  }, [closing, onClose]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const prev = useCallback(() => {
    onNavigate?.((index - 1 + items.length) % items.length);
  }, [index, items, onNavigate]);

  const next = useCallback(() => {
    onNavigate?.((index + 1) % items.length);
  }, [index, items, onNavigate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, prev, next]);

  if (!item) return null;

  return (
    <div className={`lightbox${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-label={item.label}>
      <button
        className="lightbox-close"
        onClick={close}
        aria-label="Close image"
      >
        <X size={26} strokeWidth={1.5} />
      </button>

      <button className="lightbox-nav lightbox-prev" onClick={prev} aria-label="Previous image">
        <ChevronLeft size={30} strokeWidth={1.5} />
      </button>

      <div className="lightbox-frame">
        <img src={item.src} alt={item.label} className="lightbox-image" />
      </div>

      <button className="lightbox-nav lightbox-next" onClick={next} aria-label="Next image">
        <ChevronRight size={30} strokeWidth={1.5} />
      </button>

      <span className="lightbox-caption">{item.label}</span>
      <span className="lightbox-count">
        {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
      </span>
    </div>
  );
}
