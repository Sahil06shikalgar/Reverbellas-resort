import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toDate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toIso = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function DateRangePicker({ open, field, anchorEl, checkIn, checkOut, onChange, onClose }) {
  const today = useMemo(() => startOfToday(), []);
  const todayIso = toIso(today);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const base = checkIn ? toDate(checkIn) : today;
    setView(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [open, checkIn, today]);

  useEffect(() => {
    if (!open) return;
    const position = () => {
      const root = rootRef.current;
      if (!root) return;
      if (window.matchMedia('(min-width: 561px)').matches && anchorEl && anchorEl.current) {
        root.classList.remove('bb-cal-center');
        root.style.transform = '';
        const vw = document.documentElement.clientWidth;
        const calW = Math.min(vw - 24, 360);
        const rect = anchorEl.current.getBoundingClientRect();
        let top = rect.bottom + 12;
        const estH = root.offsetHeight || 380;
        if (top + estH > window.innerHeight - 12) top = Math.max(12, rect.top - estH - 12);
        let left = rect.left + rect.width / 2 - calW / 2;
        left = Math.min(Math.max(12, left), vw - calW - 12);
        root.style.left = `${left}px`;
        root.style.top = `${top}px`;
        root.style.bottom = 'auto';
        root.style.right = 'auto';
      } else {
        root.classList.add('bb-cal-center');
        root.style.transform = '';
        root.style.left = '';
        root.style.top = '';
        root.style.bottom = '';
        root.style.right = '';
      }
    };
    const raf = requestAnimationFrame(position);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open, field, anchorEl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const minIso = field === 'checkOut' && checkIn ? checkIn : todayIso;
  const minMonthAnchor = new Date(toDate(minIso).getFullYear(), toDate(minIso).getMonth(), 1);
  const canPrev = view.getTime() > minMonthAnchor.getTime();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ empty: true, key: `e${i}` });
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toIso(new Date(year, month, day));
    cells.push({ iso, day, key: `${year}-${month}-${day}` });
  }
  while (cells.length % 7 !== 0) cells.push({ empty: true, key: `e${cells.length}` });

  const isInRange = (iso) => checkIn && checkOut && iso > checkIn && iso < checkOut;

  const selectDay = (iso) => {
    if (iso < minIso) return;
    if (checkIn && (!checkOut || checkOut <= checkIn)) {
      if (iso <= checkIn) {
        onChange({ checkIn: iso, checkOut: '' });
      } else {
        onChange({ checkIn, checkOut: iso });
        onClose();
      }
    } else {
      onChange({ checkIn: iso, checkOut: '' });
    }
  };

  return createPortal(
    <>
      <div className="bb-cal-scrim" onClick={onClose} />
      <div className="bb-cal" ref={rootRef} role="dialog" aria-modal="true" aria-label="Select dates">
        <div className="bb-cal-header">
          <button
            type="button"
            className="bb-cal-nav"
            aria-label="Previous month"
            disabled={!canPrev}
            onClick={() => setView(new Date(year, month - 1, 1))}
          >
            <ChevronLeft size={20} strokeWidth={1.75} />
          </button>
          <div className="bb-cal-title">
            {MONTH_NAMES[month]} {year}
          </div>
          <button
            type="button"
            className="bb-cal-nav"
            aria-label="Next month"
            onClick={() => setView(new Date(year, month + 1, 1))}
          >
            <ChevronRight size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className="bb-cal-weekdays">
          {WEEKDAYS.map((w) => (
            <div key={w} className="bb-cal-weekday">
              {w}
            </div>
          ))}
        </div>

        <div className="bb-cal-grid">
          {cells.map((cell) => {
            if (cell.empty) return <div key={cell.key} className="bb-cal-cell" />;
            const disabled = cell.iso < minIso;
            const cls = ['bb-cal-cell'];
            if (isInRange(cell.iso)) cls.push('bb-cal-range');
            if (cell.iso === checkIn) cls.push('bb-cal-range-start');
            if (cell.iso === checkOut) cls.push('bb-cal-range-end');
            return (
              <div key={cell.key} className={cls.join(' ')}>
                <button
                  type="button"
                  className="bb-cal-day"
                  disabled={disabled}
                  aria-pressed={cell.iso === checkIn || cell.iso === checkOut}
                  onClick={() => selectDay(cell.iso)}
                >
                  {cell.day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}