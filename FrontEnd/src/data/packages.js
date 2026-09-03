import { images } from './media';

const packages = [
  {
    id: 'group-family',
    index: '01',
    title: 'Group / Family Stay',
    subtitle: 'A comfortable stay for families and groups',
    pricing: [
      { label: 'Weekdays', value: '₹2,199', unit: 'per person' },
      { label: 'Weekends', value: '₹2,499', unit: 'per person' },
    ],
    cta: 'Book Group Stay',
    image: images.WA0000,
    objectPosition: 'center 60%',
  },
  {
    id: 'couple-escape',
    index: '02',
    title: 'Couple Escape',
    subtitle: 'A peaceful escape for two',
    pricing: [
      { label: 'Weekdays', value: '₹4,499', unit: 'per couple' },
      { label: 'Weekends', value: '₹5,499', unit: 'per couple' },
    ],
    cta: 'Book Couple Stay',
    image: images.WA0002,
    objectPosition: 'center 40%',
  },
  {
    id: 'one-day-group',
    index: '03',
    title: 'One-Day Group / Family',
    subtitle: 'A full day out for groups',
    pricing: [{ label: 'Per Person', value: '₹1,199', unit: 'per person' }],
    cta: 'Plan a Day Trip',
    image: images.WA0005,
    objectPosition: 'center 55%',
  },
  {
    id: 'one-day-couple',
    index: '04',
    title: 'One-Day Couple',
    subtitle: 'A relaxed day escape for two',
    pricing: [{ label: 'Per Couple', value: '₹3,999', unit: 'per couple' }],
    cta: 'Book Day Escape',
    image: images.BATHROOM,
    objectPosition: 'center 50%',
  },
];

export default packages;
