import React, { useState, useEffect } from 'react';
import api from '../api';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
    'Booking',
    'Closing',
    'Belum Trip',
    'Sedang Trip',
    'Sudah Trip',
    'Cancel'
];

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function BookingModal({ guest, booking = null, onClose, onSaved }) {
    const isEditing = !!booking;

    const [products, setProducts] = useState([]);
    const [ships, setShips] = useState([]);
    const [sales, setSales] = useState([]);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [shipTypes, setShipTypes] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Refund form
    const [showRefund, setShowRefund] = useState(false);
    const [refundForm, setRefundForm] = useState({
        refund_date: format(new Date(), 'yyyy-MM-dd'),
        amount: 0,
        note: ''
    });
    const [savingRefund, setSavingRefund] = useState(false);

    const initialForm = () => ({
        guest_type: 'WNI',
        closing_by: '',
        product_id: '',
        service_type: '',
        service_category: '',
        ship_type: '',
        cabin_name: '',
        ship_name: '',
        operator_name: '',
        trip_date: format(new Date(), 'yyyy-MM-dd'),
        pax: 1,
        status: 'Booking',
        documentation_url: '',
        additional_services: [],
        payments: [],
        operator_payments: [],
    });

    const [form, setForm] = useState(() => {
        if (!booking) return initialForm();
        return {
            guest_type: booking.guest_type || 'WNI',
            closing_by: booking.closing_by || '',
            product_id: booking.product_id || '',
            service_type: booking.service_type || '',
            service_category: booking.service_category || '',
            ship_type: booking.ship_type || '',
            cabin_name: booking.cabin_name || '',
            ship_name: booking.ship_name || '',
            operator_name: booking.operator_name || '',
            trip_date: booking.trip_date || format(new Date(), 'yyyy-MM-dd'),
            pax: booking.pax || 1,
            status: booking.status || 'Booking',
            documentation_url: booking.documentation_url || '',
            additional_services: booking.additional_services?.map(s => ({ product_id: s.product_id, qty: s.qty, price: s.price })) || [],
            payments: booking.payments || [],
            operator_payments: booking.operator_payments || [],
        };
    });

    useEffect(() => {
        Promise.all([
            api.get('/products'),
            api.get('/settings/ships'),
            api.get('/settings/sales'),
            api.get('/settings/services'),
            api.get('/settings/categories'),
            api.get('/settings/ship_types'),
        ]).then(([rp, rs, rsa, rsv, rc, rst]) => {
            setProducts(rp.data);
            setShips(rs.data);
            setSales(rsa.data);
            setServices(rsv.data);
            setCategories(rc.data);
            setShipTypes(rst.data);
        });
    }, []);

    const mainProducts = products.filter(p => p.type !== 'Layanan Tambahan');
    const addonProducts = products.filter(p => p.type === 'Layanan Tambahan');
    const selectedProduct = products.find(p => p.id === Number(form.product_id));
    const basePrice = selectedProduct ? selectedProduct.price * form.pax : 0;
    const addonsPrice = form.additional_services.reduce((acc, svc) => {
        const prod = addonProducts.find(p => p.id === Number(svc.product_id));
        return acc + (prod ? prod.price * svc.qty : 0);
    }, 0);
    const totalPrice = basePrice + addonsPrice;
    const totalPaid = form.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const sisaBayar = totalPrice - totalPaid;
    const filteredShips = ships.filter(s => !s.category_name || s.category_name === form.service_category);

    const isCancelOrRefund = form.lead_status === 'CANCEL' || form.lead_status === 'REFUND';

    const handleFileUpload = async (index, file) => {
        if (!file) return;
        setIsUploading(true);
        const fd = new FormData();
        fd.append('proof', file);
        try {
            const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            const arr = [...form.payments];
            arr[index].proof_url = res.data.url;
            setForm({ ...form, payments: arr });
        } catch { alert('Gagal upload bukti bayar'); }
        finally { setIsUploading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const payloadServices = form.additional_services.map(svc => {
            const prod = addonProducts.find(p => p.id === Number(svc.product_id));
            return { ...svc, price: prod ? prod.price : 0 };
        }).filter(s => s.product_id !== '');
        const payloadPayments = form.payments.filter(p => Number(p.amount) > 0);

        const payload = {
            ...form,
            guest_id: guest.id,
            additional_services: payloadServices,
            payments: payloadPayments,
            total_price: totalPrice,
            down_payment: 0,
        };

        try {
            if (isEditing) {
                await api.put(`/bookings/${booking.id}`, { ...payload, guest_id: guest.id });
            } else {
                await api.post('/bookings', payload);
            }
            onSaved();
            onClose();
        } catch { alert('Gagal menyimpan booking'); }
        finally { setSaving(false); }
    };


    const fieldStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '24px 16px' }}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 780, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '24px 28px', borderRadius: '20px 20px 0 0', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{isEditing ? 'Edit Booking' : 'Buat Booking Baru'}</div>
                        <div style={{ opacity: 0.75, fontSize: '0.88rem', marginTop: 4 }}>
                            👤 {guest.name} &nbsp;·&nbsp; 📞 {guest.phone || '-'}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 28 }}>


                    {/* Section: Trip Info */}
                    <div style={{ background: '#f8fafc', borderRadius: 14, padding: '20px', marginBottom: 16, border: '1.5px solid #e5e7eb' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#374151', marginBottom: 14 }}>🎫 Detail Trip & Operasional</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <div style={{ gridColumn: 'span 1' }}>
                                <label style={labelStyle}>Jenis Tamu</label>
                                <select style={fieldStyle} value={form.guest_type} onChange={e => setForm({ ...form, guest_type: e.target.value })}>
                                    <option value="WNI">WNI (Lokal)</option>
                                    <option value="WNA">WNA (Asing)</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Sales / Closing By</label>
                                <select style={fieldStyle} value={form.closing_by} onChange={e => setForm({ ...form, closing_by: e.target.value })}>
                                    <option value="">-- Pilih Sales --</option>
                                    {sales.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div style={{ gridColumn: 'span 1' }}>
                                <label style={labelStyle}>Produk Trip</label>
                                <select required style={fieldStyle} value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                                    <option value="">-- Pilih Produk --</option>
                                    {mainProducts.map(p => <option key={p.id} value={p.id}>{p.name} – {fmt(p.price)}/pax</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Tgl Keberangkatan</label>
                                <input required type="date" style={fieldStyle} value={form.trip_date} onChange={e => setForm({ ...form, trip_date: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Pax</label>
                                <input required type="number" min="1" style={fieldStyle} value={form.pax} onChange={e => setForm({ ...form, pax: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Jenis Layanan</label>
                                <select style={fieldStyle} value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })}>
                                    <option value="">-- Pilih --</option>
                                    {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Kategori Layanan</label>
                                <select style={fieldStyle} value={form.service_category} onChange={e => setForm({ ...form, service_category: e.target.value, ship_name: '' })}>
                                    <option value="">-- Pilih --</option>
                                    {categories.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Jenis Kapal</label>
                                <select style={fieldStyle} value={form.ship_type} onChange={e => setForm({ ...form, ship_type: e.target.value })}>
                                    <option value="">-- Pilih --</option>
                                    {shipTypes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Nama Kapal</label>
                                <select style={fieldStyle} value={form.ship_name} onChange={e => setForm({ ...form, ship_name: e.target.value })}>
                                    <option value="">-- Pilih Kapal --</option>
                                    {filteredShips.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Nama Kabin</label>
                                <input type="text" style={fieldStyle} placeholder="Master Ocean View" value={form.cabin_name} onChange={e => setForm({ ...form, cabin_name: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Vendor Operator</label>
                                <input type="text" style={fieldStyle} placeholder="Nama vendor / '-' jika milik sendiri" value={form.operator_name} onChange={e => setForm({ ...form, operator_name: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Status Trip</label>
                                <select style={fieldStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            {form.status === 'Sudah Trip' && (
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ ...labelStyle, color: '#16a34a' }}>🔗 Link Dokumentasi Trip</label>
                                    <input type="text" style={{ ...fieldStyle, borderColor: '#16a34a' }} placeholder="https://google.drive/..." value={form.documentation_url} onChange={e => setForm({ ...form, documentation_url: e.target.value })} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Add-ons */}
                    <div style={{ background: '#fff', borderRadius: 14, padding: '20px', marginBottom: 16, border: '1.5px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#374151' }}>🧩 Layanan Tambahan</div>
                            <button type="button" onClick={() => setForm({ ...form, additional_services: [...form.additional_services, { product_id: '', qty: 1 }] })}
                                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}>+ Add-on</button>
                        </div>
                        {form.additional_services.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Tidak ada add-on.</p> :
                            form.additional_services.map((svc, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                    <select required style={{ ...fieldStyle, flex: 3 }} value={svc.product_id} onChange={e => { const a = [...form.additional_services]; a[i].product_id = e.target.value; setForm({ ...form, additional_services: a }); }}>
                                        <option value="" disabled>-- Pilih Layanan --</option>
                                        {addonProducts.map(p => <option key={p.id} value={p.id}>{p.name} (+{fmt(p.price)})</option>)}
                                    </select>
                                    <input required type="number" min="1" style={{ ...fieldStyle, flex: 1 }} value={svc.qty} onChange={e => { const a = [...form.additional_services]; a[i].qty = Number(e.target.value); setForm({ ...form, additional_services: a }); }} />
                                    <button type="button" onClick={() => { const a = [...form.additional_services]; a.splice(i, 1); setForm({ ...form, additional_services: a }); }} style={{ color: '#dc2626', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
                                </div>
                            ))
                        }
                    </div>

                    {/* Payments */}
                    <div style={{ background: '#f0f9ff', borderRadius: 14, padding: '20px', marginBottom: 16, border: '1.5px solid #bae6fd' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0369a1' }}>💸 Pembayaran Tamu (Termin)</div>
                            <button type="button" onClick={() => setForm({ ...form, payments: [...form.payments, { payment_date: format(new Date(), 'yyyy-MM-dd'), amount: 0, proof_url: '' }] })}
                                style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}>+ Bayaran</button>
                        </div>
                        {form.payments.length === 0 ? <p style={{ color: '#0369a1', fontSize: '0.85rem' }}>Belum ada cicilan masuk.</p> :
                            form.payments.map((pay, i) => (
                                <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '14px', marginBottom: 10, border: '1px solid #bae6fd' }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ ...labelStyle, color: '#0369a1' }}>Tgl Bayar</label>
                                            <input type="date" style={fieldStyle} value={pay.payment_date} onChange={e => { const a = [...form.payments]; a[i].payment_date = e.target.value; setForm({ ...form, payments: a }); }} />
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <label style={{ ...labelStyle, color: '#0369a1' }}>Nominal (Rp)</label>
                                            <input type="number" min="0" style={fieldStyle} value={pay.amount} onChange={e => { const a = [...form.payments]; a[i].amount = Number(e.target.value); setForm({ ...form, payments: a }); }} />
                                        </div>
                                        <button type="button" onClick={() => { const a = [...form.payments]; a.splice(i, 1); setForm({ ...form, payments: a }); }} style={{ marginTop: 18, color: '#dc2626', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}>×</button>
                                    </div>
                                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <input type="file" accept="image/*,application/pdf" onChange={e => handleFileUpload(i, e.target.files[0])} style={{ fontSize: '0.82rem', flex: 1 }} />
                                        {pay.proof_url && <a href={pay.proof_url.startsWith('http') ? pay.proof_url : `http://localhost:3000${pay.proof_url}`} target="_blank" rel="noreferrer" style={{ color: '#0369a1', fontSize: '0.82rem', fontWeight: 700 }}>Lihat Bukti ↗</a>}
                                    </div>
                                </div>
                            ))
                        }
                    </div>


                    {/* Pricing Summary */}
                    <div style={{ background: '#1e293b', color: '#fff', padding: '20px 24px', borderRadius: 14, marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 8, fontSize: '0.9rem' }}>
                            <span>Base Trip ({form.pax}x)</span><span>{fmt(basePrice)}</span>
                        </div>
                        {addonsPrice > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: 8, fontSize: '0.9rem' }}><span>Add-ons</span><span>{fmt(addonsPrice)}</span></div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: 12, marginBottom: 12 }}>
                            <span style={{ fontWeight: 700 }}>Total Tagihan</span>
                            <strong style={{ fontSize: '1.2rem', color: '#38bdf8' }}>{fmt(totalPrice)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: '#94a3b8' }}>Sudah Dibayar</span><span style={{ color: '#34d399', fontWeight: 700 }}>{fmt(totalPaid)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            <span style={{ color: sisaBayar <= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>{sisaBayar <= 0 ? '✅ LUNAS' : '🚨 Sisa Tagihan'}</span>
                            <strong style={{ color: sisaBayar <= 0 ? '#34d399' : '#f87171', fontSize: '1.1rem' }}>{sisaBayar <= 0 ? 'Rp 0' : fmt(sisaBayar)}</strong>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                        <button type="submit" disabled={!form.product_id || saving || isUploading}
                            style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: 'var(--primary, #3b7724)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>
                            {saving ? 'Menyimpan...' : (isEditing ? '💾 Simpan Perubahan' : '🚀 Buat Booking')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
