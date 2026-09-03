export default function StayInfo() {
  return (
    <section className="section stay-info section-bg-green">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Good to Know</span>
          <h2>Plan Your Stay</h2>
        </div>

        <div className="stay-info-grid">
          <div className="stay-info-item">
            <span className="stay-info-label">Check-In</span>
            <span className="stay-info-value">12:00 PM</span>
          </div>
          <div className="stay-info-divider" aria-hidden="true" />
          <div className="stay-info-item">
            <span className="stay-info-label">Check-Out</span>
            <span className="stay-info-value">11:00 AM</span>
          </div>
        </div>

        <p className="stay-info-note">
          Stay charges are complimentary for children aged 3 to 6 years.
        </p>
      </div>
    </section>
  );
}
