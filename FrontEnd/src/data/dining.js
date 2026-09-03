const dining = [
  {
    id: 'breakfast',
    step: '01',
    title: 'Breakfast',
    time: '9:30 AM – 10:00 AM',
    note: 'A settled start to the morning.',
    layout: 'left',
    cols: [
      ['Poha', 'Butter & Jam'],
      ['Upma', 'Tea / Coffee'],
      ['Bread'],
    ],
  },
  {
    id: 'lunch',
    step: '02',
    title: 'Lunch',
    time: '1:00 PM – 2:30 PM',
    note: 'A hearty midday spread.',
    layout: 'right',
    cols: [
      ['Dal', 'Veg Bhaji', 'Papad'],
      ['Rice', 'Chicken Gravy', 'Pickle'],
      ['Chapati', 'Sweet Dish'],
    ],
  },
  {
    id: 'hi-tea',
    step: '03',
    title: 'Hi-Tea',
    time: '5:00 PM – 5:30 PM',
    note: 'A light pause in the afternoon.',
    layout: 'left',
    cols: [['Kanda / Batata Bhaji'], ['Tea / Coffee']],
  },
  {
    id: 'dinner',
    step: '04',
    title: 'Dinner',
    time: '9:30 PM – 11:00 PM',
    note: 'An unhurried meal to end the day.',
    layout: 'right',
    cols: [
      ['Chicken Gravy', 'Dal Tadka', 'Green Salad'],
      ['Veg Bhaji', 'Bhakri', 'Pickle'],
      ['Jeera Rice', 'Sweet Dish', 'Papad'],
    ],
  },
];

export default dining;
