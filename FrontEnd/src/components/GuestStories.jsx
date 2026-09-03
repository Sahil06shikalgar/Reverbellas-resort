const STORIES = [
  {
    quote:
      'We booked the full villa for a family reunion. The river, the bonfires, the food effortless and unforgettable.',
    name: 'A. Sharma',
    place: 'Mumbai',
  },
  {
    quote:
      'The lakeside tent was magical. Woke up to birds and water. The team took care of every little thing.',
    name: 'R. Menon',
    place: 'Bengaluru',
  },
  {
    quote: 'Best weekend getaway from the city. Quiet, clean, and the kitchen food was better than home.',
    name: 'K. Verma',
    place: 'Pune',
  },
];

export default function GuestStories() {
  return (
    <section className="section guest-stories">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Guest Stories</span>
          <h2>Loved by Travelers</h2>
        </div>

        <div className="guest-stories-grid">
          {STORIES.map((story) => (
            <figure className="guest-story" key={`${story.name}-${story.place}`}>
              <span className="guest-story-mark" aria-hidden="true">“</span>
              <blockquote className="guest-story-quote">{story.quote}</blockquote>
              <figcaption className="guest-story-author">
                <span className="guest-story-name">{story.name}</span>
                <span className="guest-story-place">· {story.place}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
