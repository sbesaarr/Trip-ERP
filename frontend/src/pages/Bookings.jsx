import React, { useState, useEffect } from 'react';
import api from '../api';
import { format } from 'date-fns';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Master data
    const [ships, setShips] = useState([]);
    const [sales, setSales] = useState([]);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [shipTypes, setShipTypes] = useState([]);
    
    const initialForm = { 
        guest_name: '', guest_phone: '', guest_type: 'WNI',
        closing_by: '', product_id: '', service_type: '', service_category: '', ship_type: '', cabin_name: '', ship_name: '', operator_name: '',
        trip_date: format(new Date(), 'yyyy-MM-dd'), pax: 1,
        additional_services: [],
        payments: []
    };
    const [formData, setFormData] = useState(initialForm);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            api.get('/bookings'), api.get('/products'),
            api.get('/settings/ships'), api.get('/settings/sales'), 
            api.get('/settings/services'), api.get('/settings/categories'),
            api.get('/settings/ship_types')
        ]).then(([resBookings, resProducts, resShips, resSales, resServices, resCategories, resShipTypes]) => {
                setBookings(resBookings.data);
                setProducts(resProducts.data);
                setShips(resShips.data);
                setSales(resSales.data);
                setServices(resServices.data);
                setCategories(resCategories.data);
                setShipTypes(resShipTypes.data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const mainProducts = products.filter(p => p.type !== 'Layanan Tambahan');
    const addonProducts = products.filter(p => p.type === 'Layanan Tambahan');

    const selectedProduct = products.find(p => p.id === Number(formData.product_id));
    const basePrice = selectedProduct ? selectedProduct.price * formData.pax : 0;
    
    const addonsPrice = formData.additional_services.reduce((acc, svc) => {
        const prod = addonProducts.find(p => p.id === Number(svc.product_id));
        return acc + (prod ? prod.price * svc.qty : 0);
    }, 0);

    const totalPrice = basePrice + addonsPrice;
    const totalPaid = formData.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const sisaBayar = totalPrice - totalPaid;

    const handleAddService = () => setFormData({...formData, additional_services: [...formData.additional_services, { product_id: '', qty: 1 }]});
    const handleAddPayment = () => setFormData({...formData, payments: [...formData.payments, { payment_date: format(new Date(), 'yyyy-MM-dd'), amount: 0, proof_url: '' }]});
    
    const handleServiceChange = (i, f, v) => {
        const arr = [...formData.additional_services];
        arr[i][f] = v;
        setFormData({ ...formData, additional_services: arr });
    };

    const handlePaymentChange = (i, f, v) => {
        const arr = [...formData.payments];
        arr[i][f] = v;
        setFormData({ ...formData, payments: arr });
    };

    const handleFileUpload = async (index, file) => {
        if (!file) return;
        setIsUploading(true);
        const submitData = new FormData();
        submitData.append('proof', file);
        try {
            const res = await api.post('/upload', submitData, { headers: { 'Content-Type': 'multipart/form-data' } });
            handlePaymentChange(index, 'proof_url', res.data.url);
        } catch (e) {
            alert('Gagal mengupload bukti bayar');
        } finally {
            setIsUploading(false);
        }
    };

    const removeService = (i) => { const arr = [...formData.additional_services]; arr.splice(i, 1); setFormData({...formData, additional_services: arr}); };
    const removePayment = (i) => { const arr = [...formData.payments]; arr.splice(i, 1); setFormData({...formData, payments: arr}); };

    const handleEdit = (b) => {
        setIsEditing(b.id);
        
        let initialPayments = b.payments ? [...b.payments] : [];
        if (initialPayments.length === 0 && b.down_payment > 0) {
            initialPayments = [{ payment_date: b.trip_date, amount: b.down_payment, proof_url: '' }];
        }

        setFormData({
            guest_id: b.guest_id, guest_name: b.guest_name, guest_phone: b.guest_phone || '',
            guest_type: b.guest_type || 'WNI', closing_by: b.closing_by || '',
            product_id: b.product_id, service_type: b.service_type || '', service_category: b.service_category || '', ship_type: b.ship_type || '', cabin_name: b.cabin_name || '', ship_name: b.ship_name || '', operator_name: b.operator_name || '',
            trip_date: b.trip_date, pax: b.pax,
            additional_services: b.additional_services ? b.additional_services.map(s => ({ product_id: s.product_id, qty: s.qty, price: s.price })) : [],
            payments: initialPayments
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payloadServices = formData.additional_services.map(svc => {
            const prod = addonProducts.find(p => p.id === Number(svc.product_id));
            return { ...svc, price: prod ? prod.price : 0 };
        }).filter(s => s.product_id !== '');
        
        const payloadPayments = formData.payments.filter(p => p.amount > 0);

        const payload = { ...formData, additional_services: payloadServices, payments: payloadPayments, total_price: totalPrice, down_payment: 0 };

        try {
            if (isEditing) await api.put(`/bookings/${isEditing}`, payload);
            else await api.post('/bookings', payload);
            setShowModal(false); setFormData(initialForm); setIsEditing(null); fetchData();
        } catch(err) {
            alert('Error saving booking');
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm('Hapus keseluruhan transaksi ini?')) return;
        try { await api.delete(`/bookings/${id}`); fetchData(); } catch (e) { alert('Error deleting'); }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val || 0);

    const filteredShips = ships.filter(s => !s.category_name || s.category_name === formData.service_category);

    return (
        <div>
            <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <div>
                    <h1>Data Transaksi & Booking</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Mencatat data tamu, termin pembayaran berkelanjutan, dan informasi operasional.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setFormData(initialForm); setIsEditing(null); setShowModal(true); }} style={{transform: 'translateY(-10px)'}}>
                    + Buat Transaksi Baru
                </button>
            </div>

            <div className="table-container">
                <table style={{minWidth: '1000px'}}>
                    <thead>
                        <tr>
                            <th>Tgl Trip</th>
                            <th>Nama Tamu</th>
                            <th>Sales</th>
                            <th>Paket Trip</th>
                            <th>Total Tagihan</th>
                            <th>Piutang Tamu</th>
                            <th>Status Trip</th>
                            <th style={{textAlign: 'right'}}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{textAlign: 'center', padding: '40px'}}>Membaca database...</td></tr>
                        ) : (
                            bookings.map(b => {
                                const bPaid = (b.payments ? b.payments.reduce((sum, p) => sum + p.amount, 0) : 0) + (b.payments && b.payments.length ? 0 : b.down_payment);
                                const isLunas = b.total_price - bPaid <= 0;

                                return (
                                    <tr key={b.id}>
                                        <td style={{fontWeight: 600}}>{format(new Date(b.trip_date), 'dd MMM yyyy')}</td>
                                        <td>
                                            <div style={{fontWeight: 700}}>{b.guest_name} <span style={{fontWeight: 500, color: 'var(--primary)', fontSize: '0.8rem'}}>({b.guest_type || 'WNI'})</span></div>
                                            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px'}}>
                                                {b.guest_phone || '-'}
                                                {b.guest_phone && (
                                                    <a href={`https://wa.me/${b.guest_phone.replace(/\\D/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer" 
                                                       style={{background: '#1dc071', color: 'white', padding: '3px 8px', borderRadius: '6px', textDecoration: 'none', fontSize: '10px', fontWeight: 700}}>
                                                       Chat WA 💬
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td><div style={{fontWeight: 600}}>{b.closing_by || '-'}</div></td>
                                        <td>
                                            <div style={{fontWeight: 700, color: 'var(--primary)'}}>{b.product_name}</div>
                                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px'}}>
                                                {b.pax} Org | Kapal: {b.ship_name || '-'}
                                            </div>
                                        </td>
                                        <td>{formatCurrency(b.total_price)}</td>
                                        <td>
                                            {isLunas ? (
                                                <span className="badge badge-success">LUNAS</span>
                                            ) : (
                                                <div>
                                                    <strong style={{color: 'var(--danger)', fontSize: '1rem'}}>{formatCurrency(b.total_price - bPaid)}</strong>
                                                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px'}}>Telah dibayar: {formatCurrency(bPaid)}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <select 
                                                value={b.status} 
                                                onChange={async (e) => {
                                                    try { await api.patch(`/bookings/${b.id}/status`, { status: e.target.value }); fetchData(); } 
                                                    catch (ex) { alert('Error updating'); }
                                                }}
                                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 700,
                                                    backgroundColor: b.status === 'TRIP SELESAI' ? '#dcfce7' : (b.status === 'BELUM TRIP' ? '#fef9c3' : '#f1f5f9'),
                                                    color: b.status === 'TRIP SELESAI' ? '#166534' : (b.status === 'BELUM TRIP' ? '#854d0e' : 'var(--text-main)') }}
                                            >
                                                <option>BELUM TRIP</option>
                                                <option>SEDANG TRIP</option>
                                                <option>TRIP SELESAI</option>
                                                <option>CANCEL/RESCHEDULE</option>
                                            </select>
                                        </td>
                                        <td style={{textAlign: 'right'}}>
                                            <div style={{display: 'inline-flex', gap: '8px'}}>
                                                <button onClick={() => handleEdit(b)} className="btn btn-primary" style={{padding: '6px 12px', fontSize: '12px'}}>Detail</button>
                                                <button onClick={() => handleDelete(b.id)} className="btn" style={{padding: '6px 12px', fontSize: '12px', color: 'var(--danger)', borderColor: '#fca5a5', background: '#fef2f2'}}>Hapus</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        {!loading && bookings.length === 0 && (
                            <tr><td colSpan="8" style={{textAlign: 'center', padding: '40px'}}>Belum ada transaksi di sistem.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                            <div>
                                <h2 style={{fontSize: '1.5rem', fontWeight: 800}}>{isEditing ? 'Detail & Edit Transaksi' : 'Register Transaksi Baru'}</h2>
                                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px'}}>Pastikan kelengkapan data operasional sebelum menyimpan.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)'}}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            
                            {/* Section 1: Tamu & Sales */}
                            <div className="form-section">
                                <div className="form-section-header">👤 Data Tamu & Tim Penjualan</div>
                                <div className="grid-cols-4">
                                    <div className="col-span-2">
                                        <label>Nama Tamu (PIC)</label>
                                        <input required type="text" placeholder="Nama Lengkap" value={formData.guest_name} onChange={e => setFormData({...formData, guest_name: e.target.value})} />
                                    </div>
                                    <div className="col-span-1">
                                        <label>Nomor WhatsApp</label>
                                        <input type="text" placeholder="08..." value={formData.guest_phone} onChange={e => setFormData({...formData, guest_phone: e.target.value})} />
                                    </div>
                                    <div className="col-span-1">
                                        <label>Jenis Tamu</label>
                                        <select value={formData.guest_type} onChange={e => setFormData({...formData, guest_type: e.target.value})}>
                                            <option value="WNI">WNI (Lokal)</option>
                                            <option value="WNA">WNA (Asing)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <label>Closing Sales / Agen By</label>
                                        <select value={formData.closing_by} onChange={e => setFormData({...formData, closing_by: e.target.value})}>
                                            <option value="">-- Ketik Bebas atau Pilih Sales --</option>
                                            {sales.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Section 2: Trip & Operational Info */}
                            <div className="form-section">
                                <div className="form-section-header">🎫 Detail Trip & Operasional</div>
                                <div className="grid-cols-3">
                                    <div className="col-span-1">
                                        <label>Pilih Produk Utama (Pricelist)</label>
                                        <select required value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})}>
                                            <option value="" disabled>-- Pilih Produk Trip --</option>
                                            {mainProducts.map(p => <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}/p</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label>Tgl. Keberangkatan</label>
                                        <input required type="date" value={formData.trip_date} onChange={e => setFormData({...formData, trip_date: e.target.value})} />
                                    </div>
                                    <div className="col-span-1">
                                        <label>Total Pax (Penumpang)</label>
                                        <input required type="number" min="1" value={formData.pax} onChange={e => setFormData({...formData, pax: Number(e.target.value)})} />
                                    </div>
                                    
                                    <div className="col-span-1">
                                        <label>Jenis Layanan (Dasar)</label>
                                        <select value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})}>
                                            <option value="">-- Pilih Jenis --</option>
                                            {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label>Kategori Layanan (Sub)</label>
                                        <select value={formData.service_category} onChange={e => {
                                            setFormData({...formData, service_category: e.target.value, ship_name: ''}); 
                                        }}>
                                            <option value="">-- Pilih Kategori --</option>
                                            {categories.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label>Jenis Kapal</label>
                                        <select value={formData.ship_type} onChange={e => setFormData({...formData, ship_type: e.target.value})}>
                                            <option value="">-- Pilih Jenis --</option>
                                            {shipTypes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label>Kapasitas / Nama Armada</label>
                                        <select value={formData.ship_name} onChange={e => setFormData({...formData, ship_name: e.target.value})}>
                                            <option value="">-- Pilih Kapal --</option>
                                            {filteredShips.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                        {formData.service_category && filteredShips.length === 0 && <p style={{fontSize: '11px', color: 'var(--danger)', marginTop: '4px'}}>Tidak ada kapal pada Kategori ini.</p>}
                                    </div>
                                    <div className="col-span-1">
                                        <label>Nama Kabin</label>
                                        <input type="text" placeholder="Cth: Master Ocean View" value={formData.cabin_name} onChange={e => setFormData({...formData, cabin_name: e.target.value})} />
                                    </div>
                                    <div className="col-span-1">
                                        <label>Vendor Operator Eksternal</label>
                                        <input type="text" placeholder="Vendor eksternal jika ada (atau '-' bila milik sendiri)" value={formData.operator_name} onChange={e => setFormData({...formData, operator_name: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Services Section */}
                            <div className="form-section" style={{background: 'white'}}>
                                <div className="form-section-header">
                                    <span>🧩 Layanan Tambahan (Add-ons)</span>
                                    <button type="button" onClick={handleAddService} className="btn" style={{fontSize: '0.8rem', padding: '6px 12px'}}>+ Tambah Add-ons</button>
                                </div>
                                {formData.additional_services.map((svc, index) => (
                                    <div key={index} style={{display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center'}}>
                                        <div style={{flex: 3}}>
                                            <select required value={svc.product_id} onChange={e => handleServiceChange(index, 'product_id', e.target.value)}>
                                                <option value="" disabled>-- Pilih Layanan Tersedia --</option>
                                                {addonProducts.map(p => <option key={p.id} value={p.id}>{p.name} (+{formatCurrency(p.price)})</option>)}
                                            </select>
                                        </div>
                                        <div style={{flex: 1}}>
                                            <input required type="number" min="1" placeholder="Qty" value={svc.qty} onChange={e => handleServiceChange(index, 'qty', Number(e.target.value))} />
                                        </div>
                                        <button type="button" onClick={() => removeService(index)} style={{color: 'var(--danger)', background: 'none', border: 'none', padding: '8px', cursor: 'pointer', fontSize: '1.2rem'}}>×</button>
                                    </div>
                                ))}
                                {formData.additional_services.length === 0 && <p style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Tidak ada layanan opsional yang dipilih.</p>}
                            </div>

                            {/* Payments Section */}
                            <div className="form-section" style={{border: '1px solid #bae6fd', background: '#f0f9ff'}}>
                                <div className="form-section-header" style={{color: '#0369a1'}}>
                                    <span>💸 Riwayat Pembayaran (Termin)</span>
                                    <button type="button" onClick={handleAddPayment} className="btn btn-primary" style={{fontSize: '0.8rem', padding: '6px 12px', background: '#0284c7'}}>+ Input Pembayaran</button>
                                </div>
                                {formData.payments.map((pay, index) => (
                                    <div key={index} style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'}}>
                                        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                                            <div style={{flex: 1}}>
                                                <label style={{fontSize: '0.75rem', marginBottom: '4px'}}>Tgl Bayar</label>
                                                <input required type="date" value={pay.payment_date} onChange={e => handlePaymentChange(index, 'payment_date', e.target.value)} />
                                            </div>
                                            <div style={{flex: 2}}>
                                                <label style={{fontSize: '0.75rem', marginBottom: '4px'}}>Nominal (Rp)</label>
                                                <input required type="number" min="0" placeholder="Ketik jumlah IDR" value={pay.amount} onChange={e => handlePaymentChange(index, 'amount', Number(e.target.value))} />
                                            </div>
                                            <div style={{paddingTop: '20px'}}>
                                                <button type="button" onClick={() => removePayment(index)} style={{color: 'var(--danger)', background: 'none', border: 'none', padding: '8px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 800}}>×</button>
                                            </div>
                                        </div>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px'}}>
                                            <div style={{flex: 1}}>
                                                <label style={{fontSize: '0.75rem', marginBottom: '4px'}}>Upload Bukti Transfer</label>
                                                <input type="file" accept="image/*,application/pdf" onChange={e => handleFileUpload(index, e.target.files[0])} style={{padding: '8px'}} />
                                            </div>
                                            <div style={{flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
                                                {isUploading && <span style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px'}}>Mengunggah gambar...</span>}
                                                {pay.proof_url && (
                                                    <a href={`http://localhost:3000${pay.proof_url}`} target="_blank" rel="noreferrer" 
                                                       style={{fontSize: '13px', color: '#0369a1', background: '#e0f2fe', padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', fontWeight: 700}}>
                                                        Lihat Bukti Lampiran ↗
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {formData.payments.length === 0 && <p style={{fontSize: '0.85rem', color: '#0369a1'}}>Belum ada termin cicilan masuk.</p>}
                            </div>

                            {/* Pricing Summary */}
                            <div style={{ background: '#1e293b', color: 'white', padding: '24px', borderRadius: '16px', marginTop: '24px' }}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1rem', color: '#cbd5e1'}}>
                                    <span>Base Trip ({formData.pax}x)</span>
                                    <span>{formatCurrency(basePrice)}</span>
                                </div>
                                {addonsPrice > 0 && (
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1rem', color: '#cbd5e1'}}>
                                        <span>Add-ons Total</span>
                                        <span>{formatCurrency(addonsPrice)}</span>
                                    </div>
                                )}
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #334155'}}>
                                    <span style={{fontWeight: 700, fontSize: '1.1rem'}}>Total Tagihan Bruto</span>
                                    <strong style={{fontSize: '1.3rem', color: '#38bdf8'}}>{formatCurrency(totalPrice)}</strong>
                                </div>

                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                                    <span style={{fontWeight: 600, color: '#94a3b8'}}>Akumulasi Dibayar ({formData.payments.length} termin)</span>
                                    <strong style={{color: 'white', fontSize: '1.1rem'}}>{formatCurrency(totalPaid)}</strong>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px'}}>
                                    <span style={{color: sisaBayar <= 0 ? '#34d399' : '#f87171', fontWeight: 700, fontSize: '1.1rem'}}>
                                        {sisaBayar <= 0 ? '✨ STATUS TAGIHAN' : '🚨 Sisa Hutang Tamu'}
                                    </span>
                                    <strong style={{color: sisaBayar <= 0 ? '#34d399' : '#f87171', fontSize: '1.6rem', letterSpacing: '-0.03em'}}>
                                        {sisaBayar <= 0 ? 'LUNAS (0)' : formatCurrency(sisaBayar)}
                                    </strong>
                                </div>
                            </div>

                            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{flex: 1, padding: '16px'}} disabled={isUploading}>Kembali</button>
                                <button type="submit" className="btn btn-primary" style={{flex: 2, padding: '16px', fontSize: '1.1rem'}} disabled={!formData.product_id || isUploading}>
                                    💾 Simpan Semua Data ke Database
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bookings;
