import { Clock } from 'lucide-react';
import dining from '../data/dining';

function MenuCols({ cols }) {
  return (
    <div className="dining-menu">
      {cols.map((col, i) => (
        <ul key={i} className="dining-col">
          {col.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ))}
    </div>
  );
}

function Meal({ meal }) {
  return (
    <article className={`dining-meal dining-meal--${meal.layout}`}>
      <header className="dining-meal-head">
        <span className="dining-step" aria-hidden="true">{meal.step}</span>
        <div className="dining-title">
          <h3>{meal.title}</h3>
          <div className="dining-time">
            <Clock size={13} strokeWidth={1.6} aria-hidden="true" />
            <span>{meal.time}</span>
          </div>
        </div>
      </header>

      <p className="dining-note">{meal.note}</p>

      <div className="dining-menu-wrap">
        <MenuCols cols={meal.cols} />
      </div>
    </article>
  );
}

export default function Dining() {
  return (
    <section className="section dining" id="dining">
      <div className="container dining-container">
        <div className="dining-head">
          <span className="eyebrow">Dining</span>
          <h2>
            <span className="reveal-line"><span>From Breakfast</span></span>
            <span className="reveal-line"><span>to Dinner</span></span>
          </h2>
        </div>

        <div className="dining-list">
          {dining.map((meal) => (
            <Meal meal={meal} key={meal.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
