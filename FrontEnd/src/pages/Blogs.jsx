import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await getPublishedBlogs();
        if (active) setBlogs(r.data || []);
      } catch {
        if (active) setError('Unable to load the journal right now.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Navbar />
      <section className="section journal-hero">
        <div className="container journal-hero-inner">
          <span className="eyebrow">Riverbells Journal</span>
          <h1>Riverbells Journal</h1>
          <p>Stories, experiences and moments from Riverbells Resort.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="journal-empty">Loading stories…</div>
          ) : error ? (
            <div className="journal-empty">{error}</div>
          ) : blogs.length === 0 ? (
            <div className="journal-empty">
              New stories are being written. Visit again soon.
            </div>
          ) : (
            <div className="journal-grid">
              {blogs.map((blog) => (
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
                        Read More <span aria-hidden="true">↗</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}