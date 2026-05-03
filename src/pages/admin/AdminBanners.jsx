import { useEffect, useState, useRef } from 'react';
import AdminRoute from '../../components/AdminRoute';
import { supabase } from '../../lib/supabase';

// Inline active/inactive badge (StatusBadge only covers order statuses)
function ActiveBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

const EMPTY_FORM = {
  id: null,
  title: '',
  image_url: '',
  start_date: '',
  end_date: '',
  active: false,
};

function BannerForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  // Keep form in sync if parent changes the initial value (e.g. switching edit targets)
  useEffect(() => {
    setForm(initial || EMPTY_FORM);
    setImageFile(null);
    setError(null);
  }, [initial]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let image_url = form.image_url;

      // Upload new image to Supabase Storage if a file was selected
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `banners/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const payload = {
        title: form.title,
        image_url,
        start_date: form.start_date,
        end_date: form.end_date,
        active: form.active,
      };

      // Include id only when editing so Supabase upserts correctly
      if (form.id) payload.id = form.id;

      const { data, error: upsertErr } = await supabase
        .from('seasonal_banners')
        .upsert(payload)
        .select()
        .single();

      if (upsertErr) throw upsertErr;
      onSave(data);
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {form.id ? 'Edit Banner' : 'Add Banner'}
      </h2>

      {error && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            required
            type="text"
            value={form.title}
            onChange={set('title')}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          {form.image_url && !imageFile && (
            <img src={form.image_url} alt="current" className="h-10 mb-1 rounded object-cover" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0] || null)}
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            required
            type="date"
            value={form.start_date}
            onChange={set('start_date')}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            required
            type="date"
            value={form.end_date}
            onChange={set('end_date')}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.active}
          onChange={set('active')}
          className="w-4 h-4 accent-indigo-600"
        />
        <span className="text-sm font-medium text-gray-700">Active</span>
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function BannersTable({ banners, onEdit, onDelete, onToggleActive }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Title', 'Image', 'Start', 'End', 'Status', 'Actions'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {banners.map((b) => (
            <tr key={b.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800">{b.title}</td>
              <td className="px-4 py-3">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.title} className="h-10 w-16 object-cover rounded" />
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">{b.start_date}</td>
              <td className="px-4 py-3 text-gray-600">{b.end_date}</td>
              <td className="px-4 py-3">
                {/* Clicking the badge toggles active inline without re-fetching */}
                <button
                  onClick={() => onToggleActive(b)}
                  title="Click to toggle"
                  className="focus:outline-none"
                >
                  <ActiveBadge active={b.active} />
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(b)}
                    className="px-3 py-1 text-xs border border-indigo-400 text-indigo-600 rounded hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(b)}
                    className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {banners.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                No banners found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminBannersInner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('seasonal_banners')
        .select('*')
        .order('start_date', { ascending: false });
      if (cancelled) return;
      if (error) setFetchError(error.message);
      else setBanners(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Optimistically toggle active in local state, then persist
  const handleToggleActive = async (banner) => {
    const newActive = !banner.active;
    // Optimistic update
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, active: newActive } : b))
    );
    const { error } = await supabase
      .from('seasonal_banners')
      .update({ active: newActive })
      .eq('id', banner.id);
    // Revert on failure
    if (error) {
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, active: banner.active } : b))
      );
      alert('Toggle failed: ' + error.message);
    }
  };

  // Optimistically upsert into local list
  const handleSave = (saved) => {
    setBanners((prev) => {
      const exists = prev.find((b) => b.id === saved.id);
      return exists
        ? prev.map((b) => (b.id === saved.id ? saved : b))
        : [saved, ...prev];
    });
    setShowForm(false);
    setEditTarget(null);
  };

  const handleDelete = async (banner) => {
    if (!window.confirm(`Delete "${banner.title}"?`)) return;
    // Optimistic removal
    setBanners((prev) => prev.filter((b) => b.id !== banner.id));
    const { error } = await supabase
      .from('seasonal_banners')
      .delete()
      .eq('id', banner.id);
    if (error) {
      // Restore on failure
      setBanners((prev) => [banner, ...prev]);
      alert('Delete failed: ' + error.message);
    }
  };

  const handleEdit = (banner) => {
    setEditTarget(banner);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditTarget(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <p className="text-red-600 bg-red-50 rounded px-4 py-3 text-sm">
        Error loading banners: {fetchError}
      </p>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seasonal Banners</h1>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
          >
            + Add Banner
          </button>
        )}
      </div>

      {showForm && (
        <BannerForm
          initial={editTarget}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <BannersTable
          banners={banners}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>
    </div>
  );
}

export default function AdminBanners() {
  return (
    <AdminRoute>
      <AdminBannersInner />
    </AdminRoute>
  );
}
