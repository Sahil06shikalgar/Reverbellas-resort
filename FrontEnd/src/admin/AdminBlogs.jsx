import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getAdminBlogs,
  deleteBlog,
  toggleBlogStatus,
} from '../services/blogService';
import { resolveBlogImage } from '../utils/blogImages';

const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function AdminBlogs() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await getAdminBlogs({
        search: search.trim() || undefined,
        status: status || undefined,
      });
      setBlogs(r.data || []);
    } catch (e) {
      toast.error(e.message || 'Unable to load blogs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runToggle = async (id) => {
    setBusyId(id);
    try {
      const r = await toggleBlogStatus(id);
      const next = r.data?.status;
      toast.success(next === 'published' ? 'Blog published.' : 'Blog moved to draft.');
      await load();
    } catch (e) {
      toast.error(e.message || 'Unable to update blog.');
    } finally {
      setBusyId(null);
    }
  };

  const runDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBlog(deleteTarget._id);
      toast.success('Blog deleted successfully.');
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(e.message || 'Unable to delete blog.');
      setDeleteTarget(null);
    }
  };

  const openPublic = (slug) => {
    window.open(`/blogs/${slug}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Blog Management</h1>
          <p className="admin-sub">Create and manage Riverbells Resort blog content.</p>
        </div>
        <button type="button" className="admin-btn" onClick={() => navigate('/admin/blogs/new')}>
          + Add Blog
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by title, category, author…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          className="admin-input"
        />
        <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button type="button" className="admin-btn" onClick={load}>Search</button>
        {(search || status) && (
          <button
            type="button"
            className="admin-btn ghost"
            onClick={() => {
              setSearch('');
              setStatus('');
              setTimeout(load, 0);
            }}
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="admin-loading">Loading blogs…</div>
      ) : blogs.length === 0 ? (
        <div className="admin-empty">
          {search || status ? 'No blogs match your search.' : 'No blogs yet. Create your first post.'}
        </div>
      ) : (
        <div className="blog-table-wrapper">
          <table className="admin-table blog-admin-table">
            <thead>
              <tr>
                <th>Featured Image</th>
                <th>Title</th>
                <th>Category</th>
                <th className="col-author">Author</th>
                <th>Status</th>
                <th>Published</th>
                <th className="col-updated">Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((b) => (
                <tr key={b._id} className="blog-admin-row">
                  <td data-label="Featured Image">
                    <img className="admin-thumb blog-admin-thumb" src={resolveBlogImage(b.featuredImage)} alt="" />
                  </td>
                  <td className="blog-title-cell" data-label="Title">
                    <strong className="admin-blog-title">{b.title}</strong>
                    <span className="admin-blog-slug">/{b.slug}</span>
                  </td>
                  <td data-label="Category">{b.category}</td>
                  <td className="col-author" data-label="Author">{b.author}</td>
                  <td data-label="Status">
                    <span className={`blog-badge ${b.status === 'published' ? 'published' : 'draft'}`}>
                      {b.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td data-label="Published">{fmtDate(b.publishedAt)}</td>
                  <td className="col-updated" data-label="Updated">{fmtDate(b.updatedAt)}</td>
                  <td className="row-actions blog-row-actions" data-label="Actions">
                    <button type="button" className="admin-btn tiny ghost" onClick={() => openPublic(b.slug)}>View</button>
                    <button type="button" className="admin-btn tiny" onClick={() => navigate(`/admin/blogs/${b._id}/edit`)}>Edit</button>
                    <button type="button" className="admin-btn tiny" disabled={busyId === b._id} onClick={() => runToggle(b._id)}>
                      {b.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button type="button" className="admin-btn tiny danger" onClick={() => setDeleteTarget(b)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Delete Blog?</h3>
              <button type="button" className="modal-close" onClick={() => setDeleteTarget(null)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <p className="muted">
                This action cannot be undone. “{deleteTarget.title}” will be permanently removed.
              </p>
              <div className="admin-form-actions">
                <button type="button" className="admin-btn ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button type="button" className="admin-btn danger" onClick={runDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}