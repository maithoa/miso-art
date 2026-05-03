import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { parseCents } from '../lib/currency';

export default function ProductForm({ product, onClose, onSaved }) {
  const isEdit = Boolean(product?.id);
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  // price displayed in EUR
  const [priceEur, setPriceEur] = useState(product ? (product.price / 100).toFixed(2) : '');
  const [tags, setTags] = useState(product?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let imageUrl = product?.image_url || '';

      if (imageFile) {
        // upload image to storage and retrieve public URL
        const ext = imageFile.name.split('.').pop();
        const filePath = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        imageUrl = publicData.publicUrl;
      }

      const priceCents = parseCents(priceEur);
      const payload = { name, description, price: priceCents, tags, is_available: isAvailable, image_url: imageUrl };

      let result;
      if (isEdit) {
        result = await supabase.from('products').update(payload).eq('id', product.id).select().single();
      } else {
        result = await supabase.from('products').insert(payload).select().single();
      }
      if (result.error) throw result.error;
      onSaved(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (EUR)</label>
            <input required type="number" min="0" step="0.01" value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag" className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="button" onClick={addTag}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Add</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            {imagePreview && <img src={imagePreview} alt="preview" className="w-24 h-24 object-cover rounded-lg mb-2" />}
            <input type="file" accept="image/*" ref={fileRef} onChange={(e) => setImageFile(e.target.files[0] || null)}
              className="text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Available</label>
            <button type="button" onClick={() => setIsAvailable(!isAvailable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAvailable ? 'bg-indigo-600' : 'bg-gray-300'
              }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAvailable ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
