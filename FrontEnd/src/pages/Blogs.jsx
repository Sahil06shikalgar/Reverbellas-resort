import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RefreshCw, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getPublishedBlogs } from '../services/blogService';
import { resolveBlogImage } from '../utils/blogImages';

const fmtDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const SKELETON_COUNT = 3;

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const heroRef = useRef(null);
  const gridRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await getPublishedBlogs();
      setBlogs(r.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simple reveal only — no parallax, pinning or scrub.
  useEffect(() => {
    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) return;

    const hero = heroRef.current;
    if (hero && 'animate' in hero) {
      hero.animate(
        [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
      );
    }

    const cards = gridRef.current?.querySelectorAll('.journal-card');
    if (cards && cards.length) {
      cards.forEach((card, i) => {
        card.animate(
          [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 700, delay: i * 80, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
        );
      });
    }
  }, [blogs, error, loading]);

  const latest = blogs[0];
  const rest = blogs.length > 1 ? blogs.slice(1) : [];

  return (
    <>
      <Navbar />

      <section className="journal-hero" ref={heroRef}>
        <div className="journal-container journal-hero-inner">
          <span className="journal-eyebrow">Riverbells Journal</span>
          <h1 className="journal-title">Riverbells Journal</h1>
          <p className="journal-subtitle">
            Stories, experiences and moments from Riverbells Resort.
          </p>
        </div>
      </section>

      <section className="journal-content-sec">
        <div className="journal-container">
          {loading ? (
            <div className="journal-skeleton-grid" aria-hidden="true">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div className="journal-skeleton" key={i}>
                  <div className="journal-skeleton-media shimmer" />
                  <div className="journal-skeleton-line shimmer short" />
                  <div className="journal-skeleton-line shimmer title" />
                  <div className="journal-skeleton-line shimmer" />
                  <div className="journal-skeleton-line shimmer" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="journal-editorial-state" role="status">
              <BookOpen className="journal-state-icon" size={36} strokeWidth={1.25} aria-hidden="true" />
              <h2 className="journal-state-title">Journal Unavailable</h2>
              <p className="journal-state-text">
                We’re unable to load our latest stories right now.
                <br />
                Please try again in a moment.
              </p>
              <button type="button" className="journal-try-again" onClick={load}>
                <RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />
                Try Again
              </button>
            </div>
          ) : blogs.length === 0 ? (
            <div className="journal-editorial-state">
              <BookOpen className="journal-state-icon" size={36} strokeWidth={1.25} aria-hidden="true" />
              <h2 className="journal-state-title">No Stories Yet</h2>
              <p className="journal-state-text">
                Our journal is just getting started.
                <br />
                New Riverbells stories will appear here soon.
              </p>
            </div>
          ) : (
            <div className="journal-results" ref={gridRef}>
              {latest && (
                <Link to={`/blogs/${latest.slug}`} className="journal-featured">
                  <div className="journal-featured-media">
                    <img src={resolveBlogImage(latest.featuredImage)} alt={latest.title} loading="lazy" />
                  </div>
                  <div className="journal-featured-body">
                    <span className="journal-card-category">
                      {latest.category}
                      <span className="journal-featured-tag">Featured</span>
                    </span>
                    <h2 className="journal-card-title">{latest.title}</h2>
                    <p className="journal-card-excerpt">{latest.excerpt}</p>
                    <div className="journal-card-foot">
                      <span className="journal-card-date">{fmtDate(latest.publishedAt)}</span>
                      <span className="journal-read-more">
                        Read Story <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="journal-grid">
                  {rest.map((blog) => (
                    <Link to={`/blogs/${blog.slug}`} className="journal-card" key={blog._id}>
                      <div className="journal-card-media">
                        <img src={resolveBlogImage(blog.featuredImage)} alt={blog.title} loading="lazy" />
                      </div>
                      <div className="journal-card-body">
                        <span className="journal-card-category">{blog.category}</span>
                        <h2 className="journal-card-title">{blog.title}</h2>
                        <p className="journal-card-excerpt">{blog.excerpt}</p>
                        <div className="journal-card-foot">
                          <span className="journal-card-date">{fmtDate(blog.publishedAt)}</span>
                          <span className="journal-read-more">
                            Read Story <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
