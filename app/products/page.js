'use client';

import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: '#1c1e21' }}>
          Products
        </h1>
        <p className="text-[14px] mt-1.5" style={{ color: '#65676b' }}>
          Read-only product catalog. Management features coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <p className="col-span-2 text-[13px]" style={{ color: '#8a8d91' }}>
            Loading...
          </p>
        ) : products.length === 0 ? (
          <p className="col-span-2 text-[13px]" style={{ color: '#8a8d91' }}>
            No products found.
          </p>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-lg"
              style={{ backgroundColor: '#ffffff', border: '1px solid #dadde1' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: '#e7f3ff' }}
                >
                  <Package size={18} strokeWidth={1.75} style={{ color: '#1877f2' }} />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold" style={{ color: '#1c1e21' }}>
                    {p.model}
                  </h3>
                  <span className="text-[11px]" style={{ color: '#8a8d91' }}>
                    {p.series}
                  </span>
                </div>
              </div>
              <p className="text-[13px] mb-4" style={{ color: '#65676b' }}>
                {p.features}
              </p>
              <div className="flex gap-2 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-medium"
                  style={
                    p.is_smart
                      ? { backgroundColor: '#e7f3ff', color: '#1877f2' }
                      : { backgroundColor: '#f2f3f5', color: '#65676b' }
                  }
                >
                  {p.is_smart ? 'Smart' : 'Non-Smart'}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-medium"
                  style={{ backgroundColor: '#e3f1d8', color: '#2e7d32' }}
                >
                  {p.warranty_terms}
                </span>
                {p.price && (
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-medium"
                    style={{ backgroundColor: '#f2f3f5', color: '#65676b' }}
                  >
                    RM {p.price}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
