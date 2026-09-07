import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getBlogBySlug } from '../services/blogService';
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

const renderContent = (content) => {
  const c = String(content || '').trim();
  if (!c) return null;

  // Trusted, admin-authored content — render inline HTML if present.
  if (/<[a-z][\s\S]*>/i.test(c)) {
    return <div className="journal-content" dangerouslySetInnerHTML={{ __html: c }} />;
  }

  const blocks = c.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="journal-content">
      {blocks.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
};

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await getBlogBySlug(slug);
        if (active) setBlog(r.data);
      } catch {
        if (active) setMissing(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <>
      <Navbar variant="light" />
      <section className="section journal-article">
        <div className="container journal-article-inner">
          {loading ? (
            <div className="journal-empty">Loading story…</div>
          ) : missing || !blog ? (
            <div className="journal-empty">
              <h2>Story not found</h2>
              <p>This story may have been unpublished or removed.</p>
              <Link to="/blogs" className="btn btn-fill journal-back">
                Back to Blogs
              </Link>
            </div>
          ) : (
            <>
              <header className="journal-article-head">
                <span className="journal-card-category">{blog.category}</span>
                <h1>{blog.title}</h1>
                <p className="journal-article-meta">
                  {fmtDate(blog.publishedAt)}
                  {blog.author ? <span> · by {blog.author}</span> : null}
                </p>
              </header>

              <figure className="journal-article-media">
                <img src={resolveBlogImage(blog.featuredImage)} alt={blog.title} />
              </figure>

              {renderContent(blog.content)}

              <div className="journal-article-actions">
                <Link to="/blogs" className="btn btn-fill journal-back">
                  ← Back to Blogs
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}