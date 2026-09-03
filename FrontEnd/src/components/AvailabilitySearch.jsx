import { useState, useRef } from 'react';
import { toast } from 'sonner';
import Hero from './Hero';
import AvailabilityResults from './AvailabilityResults';
import { getAvailability } from '../services/propertyService';

export default function AvailabilitySearch({ ready }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const handleSearch = async ({ checkIn, checkOut, guests }) => {
    setLoading(true);
    setResult(null);

    try {
      const res = await getAvailability({
        checkIn,
        checkOut,
        adults: guests,
        children: 0,
      });

      const availabilityData = res?.data;

      if (res && res.success) {
        const properties = availabilityData?.availableProperties || [];
        if (properties.length === 0) {
          toast.error('No stays are available for the selected dates.');
        }
        setResult({
          ...availabilityData,
          availableProperties: properties,
        });
      } else {
        toast.error('Unable to check availability. Please try again.');
      }
    } catch {
      toast.error('Unable to check availability. Please try again.');
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        const resultsEl = document.querySelector('#availability-results');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  };

  return (
    <>
      <Hero ready={ready} onSearch={handleSearch} />

      {loading && (
        <div className="avail-loading" ref={resultRef}>
          <div className="avail-loading-spinner" aria-hidden="true" />
          <span>Checking availability...</span>
        </div>
      )}

      {result && !loading && (
        <AvailabilityResults result={result} />
      )}
    </>
  );
}
