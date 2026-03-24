import React, { useState, useEffect } from 'react';
import api from '../api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [formData, setFormData] = useState({ name: '', type: 'Open Trip', price: 0, cost_price: 0 });

    const fetchProducts = () => {
        setLoading(true);
        api.get('/products')
            .then(res => {
                setProducts(res.data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', formData);
            setShowModal(false);
            setFormData({ name: '', type: 'Open Trip', price: 0, cost_price: 0 });
            fetchProducts();
        } catch(err) {
            alert('Error adding product');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val || 0);

    return (
        <div>
            <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <div>
                    <h1>📦 Master Desk (Pricelist)</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Kelola harga jual dasar paket ke Tamu dan HPP modal ke Operator Kapal.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Tambah Produk</button>
            </div>

            <div className="table-container">
                <table style={{minWidth: '800px'}}>
                    <thead>
                        <tr>
                            <th>Nama Paket / Produk</th>
                            <th>Kategori Trip</th>
                            <th>Jual Tamu (Harga Dasar)</th>
                            <th>Bayar Vendor (HPP Modal)</th>
                            <th>Est. Margin / Pax</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>Membaca katalog produk...</td></tr>
                        ) : (
                            products.map(p => (
                                <tr key={p.id}>
                                    <td style={{fontWeight: 700}}>{p.name}</td>
                                    <td><span className="badge badge-success" style={{background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0'}}>{p.type}</span></td>
                                    <td style={{fontWeight: 600}}>{formatCurrency(p.price)}</td>
                                    <td style={{color: 'var(--text-muted)'}}>{formatCurrency(p.cost_price)}</td>
                                    <td style={{color: 'var(--primary)', fontWeight: 800}}>{formatCurrency(p.price - p.cost_price)}</td>
                                </tr>
                            ))
                        )}
                        {!loading && products.length === 0 && (
                            <tr><td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>Belum ada produk terdaftar.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: '550px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                            <div>
                                <h2 style={{fontSize: '1.4rem', fontWeight: 800}}>Tambah Produk Baru</h2>
                                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px'}}>
                                    Masukkan paket trip utama atau layanan tambahan (add-ons).
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)'}}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-section">
                                <div className="grid-cols-1">
                                    <div style={{marginBottom: '16px'}}>
                                        <label>Nama Produk (Trip / Kapal / Layanan)</label>
                                        <input required type="text" placeholder="Misal: Open Trip Komodo 3D2N" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div style={{marginBottom: '16px'}}>
                                        <label>Klasifikasi Trip</label>
                                        <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                            <option>Open Trip</option>
                                            <option>Sailing Trip</option>
                                            <option>Private Trip</option>
                                            <option>Layanan Tambahan</option>
                                        </select>
                                    </div>
                                    <div className="grid-cols-2">
                                        <div className="col-span-1">
                                            <label>Harga Jual Dasar (Rp / Pax)</label>
                                            <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                                            <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px'}}>Nominal ditagihkan ke tamu</p>
                                        </div>
                                        <div className="col-span-1">
                                            <label>HPP / Bayar Vendor (Rp / Pax)</label>
                                            <input required type="number" min="0" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} />
                                            <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px'}}>Nominal kewajiban kita ke operator</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{flex: 1, padding: '16px'}}>Batal</button>
                                <button type="submit" className="btn btn-primary" style={{flex: 1, padding: '16px'}}>💾 Simpan ke Pricelist</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
