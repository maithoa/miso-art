import { useEffect, useState } from 'react';
import AdminRoute from '../../components/AdminRoute';
import ProductForm from '../../components/ProductForm';
import { supabase } from '../../lib/supabase';

function AdminProductsInner() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formProduct, setFormProduct] = useState(null); // null=closed, {}=new, product=edit
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (error) setError(error.message);
      else setProducts(data);
      setLoading(false);
    })();
  }, []);

  const openAdd = () => { setFormProduct({}); setShowForm(true); };
  const openEdit = (p) => { setFormProduct(p); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setFormProduct(null); };

  const handleSaved = (saved) => {
    // insert or replace in local list without full reload
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      if (exists) return prev.map((p) => (p.id === saved.id ? saved : p));
      return [saved, ...prev];
    });
    closeForm();
  };

  const toggleAvailability = async (product) => {
    const newVal = !product.is_available;
    // optimistic update
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_available: newVal } : p));
    const { error } = await supabase
      .from('products')
      .update({ is_available: newVal })
      .eq('id', product.id);
    if (error) {
      // revert on failure
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_available: product.is_available } : p));
      alert(error.message);
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    // remove immediately
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      // restore on failure
      setProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
      alert(error.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-600">Error: {error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={openAdd}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500">No products yet.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Available</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image_url && (
                        <img src={product.image_url} alt={product.name}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.tags?.length > 0 && (
                          <p className="text-xs text-gray-400">{product.tags.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">€{(product.price / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    {/* inline toggle — calls supabase immediately */}
                    <button onClick={() => toggleAvailability(product)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        product.is_available ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        product.is_available ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(product)}
                        className="px-3 py-1.5 border rounded-lg text-xs hover:bg-gray-50">Edit</button>
                      <button onClick={() => deleteProduct(product)}
                        className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ProductForm
          product={Object.keys(formProduct).length === 0 ? null : formProduct}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

export default function AdminProducts() {
  return <AdminRoute><AdminProductsInner /></AdminRoute>;
}
