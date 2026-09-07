import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { createBlog, getBlogById, updateBlog } from '../services/blogService';
import { blogImagePool, resolveBlogImage } from '../utils/blogImages';

const slugify = (text = '') =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const initial = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImage: 'images/02',
  category: 'Riverbells',
  author: 'Riverbells Resort',
  tagsText: '',
  seoTitle: '',
  seoDescription: '',
  status: 'draft',
};

export default function BlogEditor({ mode = 'new' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = mode === 'edit' && !!id;

  const [form, setForm] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        const r = await getBlogById(id);
        const b = r.data;
        setForm({
          title: b.title || '',
          slug: b.slug || '',
          excerpt: b.excerpt || '',
          content: b.content || '',
          featuredImage: b.featuredImage || 'images/02',
          category: b.category || 'Riverbells',
          author: b.author || 'Riverbells Resort',
          tagsText: (b.tags || []).join(', '),
          seoTitle: b.seoTitle || '',
          seoDescription: b.seoDescription || '',
          status: b.status || 'draft',
        });
        setSlugTouched(true);
      } catch (e) {
        toast.error(e.message || 'Unable to load blog.');
        navigate('/admin/blogs');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, id]);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'title' && !slugTouched) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const autoSlug = () => {
    setForm((f) => ({ ...f, slug: slugify(f.title) }));
    setSlugTouched(true);
  };

  const selectImage = (key) => setForm((f) => ({ ...f, featuredImage: key }));

  const validate = () => {
    if (!form.title.trim() || !form.slug.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast.error('Title, Slug, Excerpt and Content are required.');
      return false;
    }
    return true;
  };

  const save = async (status) => {
    if (!validate()) return;
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      featuredImage: form.featuredImage,
      category: form.category.trim() || 'Riverbells',
      author: form.author.trim() || 'Riverbells Resort',
      tags: form.tagsText
        ? form.tagsText.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      status: editing ? form.status : status,
    };

    setBusy(true);
    try {
      if (editing) {
        await updateBlog(id, payload);
        toast.success('Blog updated successfully.');
      } else {
        await createBlog(payload);
        toast.success('Blog created successfully.');
      }
      navigate('/admin/blogs');
    } catch (e) {
      toast.error(e.message || 'Unable to create blog.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading blog…</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>{editing ? 'Edit Blog' : 'Add Blog'}</h1>
          <p className="admin-sub">
            {editing ? 'Update the blog post and save your changes.' : 'Write a new story for the Riverbells journal.'}
          </p>
        </div>
        <button type="button" className="admin-btn ghost" onClick={() => navigate('/admin/blogs')}>← Back to Blogs</button>
      </div>

      <form
        className="admin-form blog-editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          save(form.status);
        }}
      >
        <div className="admin-form-grid two-col">
          <div className="admin-field full">
            <label>Blog Title *</label>
            <input className="admin-input" value={form.title} onChange={update('title')} placeholder="A Peaceful Weekend at Riverbells" />
          </div>

          <div className="admin-field">
            <label>Slug *</label>
            <div className="slug-row">
              <input className="admin-input" value={form.slug} onChange={(e) => { setSlugTouched(true); update('slug')(e); }} placeholder="a-peaceful-weekend-at-riverbells" />
              <button type="button" className="admin-btn tiny ghost" onClick={autoSlug}>Auto</button>
            </div>
          </div>

          <div className="admin-field">
            <label>Category</label>
            <input className="admin-input" value={form.category} onChange={update('category')} placeholder="Riverbells" />
          </div>

          <div className="admin-field">
            <label>Author</label>
            <input className="admin-input" value={form.author} onChange={update('author')} placeholder="Riverbells Resort" />
          </div>

          <div className="admin-field full">
            <label>Short Description / Excerpt *</label>
            <textarea className="admin-input textarea" rows="3" value={form.excerpt} onChange={update('excerpt')} placeholder="A one or two sentence summary shown on the blog card." />
          </div>

          <div className="admin-field full">
            <label>Main Content *</label>
            <textarea className="admin-input textarea tall" rows="12" value={form.content} onChange={update('content')} placeholder="Write the full story…" />
          </div>

          <div className="admin-field full">
            <label>Tags</label>
            <input className="admin-input" value={form.tagsText} onChange={update('tagsText')} placeholder="weekend, nature, river" />
          </div>
        </div>

        <div className="admin-form-grid two-col blog-optional-grid">
          <div className="admin-field">
            <label>SEO Title</label>
            <input className="admin-input" value={form.seoTitle} onChange={update('seoTitle')} />
          </div>
          <div className="admin-field">
            <label>SEO Description</label>
            <input className="admin-input" value={form.seoDescription} onChange={update('seoDescription')} />
          </div>
        </div>

        <div className="admin-field">
          <label>Featured Image</label>
          {form.featuredImage && (
            <div className="blog-img-preview">
              <img src={resolveBlogImage(form.featuredImage)} alt="Featured preview" />
            </div>
          )}
          <div className="blog-img-picker">
            {blogImagePool().map((opt) => (
              <button
                type="button"
                key={opt.key}
                className={`blog-img-opt ${form.featuredImage === opt.key ? 'active' : ''}`}
                onClick={() => selectImage(opt.key)}
                aria-label={opt.key}
              >
                <img src={opt.url} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="admin-field">
          <label>Status</label>
          <select className="admin-input" value={form.status} onChange={update('status')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="admin-form-actions blog-editor-actions">
          <button type="button" className="admin-btn ghost" onClick={() => navigate('/admin/blogs')} disabled={busy}>Cancel</button>
          {editing ? (
            <button type="submit" className="admin-btn" disabled={busy}>
              {busy ? 'Saving…' : 'Update Blog'}
            </button>
          ) : (
            <>
              <button type="button" className="admin-btn ghost" disabled={busy} onClick={() => save('draft')}>
                {busy ? 'Saving…' : 'Save as Draft'}
              </button>
              <button type="button" className="admin-btn" disabled={busy} onClick={() => save('published')}>
                {busy ? 'Publishing…' : 'Publish Blog'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}