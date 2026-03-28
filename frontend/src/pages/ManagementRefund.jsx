import React, { useState, useEffect } from 'react';
import api from '../api';
import { format } from 'date-fns';

const ManagementRefund = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [refundForm, setRefundForm] = useState({
        refund_date: format(new Date(), 'yyyy-MM-dd'),
        amount: 0,
        note: ''
    });
    const [saving, setSaving] = useState(false);

    const fetchData = () => {
        setLoading(true);
        api.get('/bookings').then(r => {
            // Filter bookings that have status Cancel and have payments, OR have existing refunds
            const filtered = r.data.filter(b => {
                const totalPaid = (b.payments || []).reduce((s, p) => s + p.amount, 0);
                return b.status === 'Cancel' || (b.refunds && b.refunds.length > 0);
            });
            setBookings(filtered);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const handleRefundSubmit = async (e) => {
        e.preventDefault();
        if (!refundForm.amount || refundForm.amount <= 0) return alert('Isi nominal refund');
        setSaving(true);
        try {
            await api.post(`/bookings/${selectedBooking.id}/refund`, refundForm);
            setSelectedBooking(null);
            setRefundForm({ refund_date: format(new Date(), 'yyyy-MM-dd'), amount: 0, note: '' });
            fetchData();
        } catch { alert('Gagal menyimpan refund'); }
        finally { setSaving(false); }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    const th = { padding: '16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' };
    const td = { padding: '16px', verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' };
    const fieldStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: '#9333ea' }}>
                    💸 Management Refund
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Pantau dan kelola pengembalian dana tamu untuk transaksi batal.</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                        <tr style={{ background: '#faf5ff', borderBottom: '1.5px solid #e9d5ff' }}>
                            <th style={th}>Tgl Trip</th>
                            <th style={th}>Tamu</th>
                            <th style={th}>Paket</th>
                            <th style={th}>Total Bayar</th>
                            <th style={th}>Total Refund</th>
                            <th style={th}>Status</th>
                            <th style={{ ...th, textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Memuat data refund...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Tidak ada data refund yang perlu dikelola.</td></tr>
                        ) : (
                            bookings.map(b => {
                                const totalPaid = (b.payments || []).reduce((s, p) => s + p.amount, 0);
                                const totalRefunded = (b.refunds || []).reduce((s, r) => s + r.amount, 0);
                                const isFullyRefunded = totalPaid > 0 && totalRefunded >= totalPaid;

                                return (
                                    <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={td}>{b.trip_date ? format(new Date(b.trip_date), 'dd MMM yyyy') : '-'}</td>
                                        <td style={td}>
                                            <div style={{ fontWeight: 700 }}>{b.guest_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.guest_phone}</div>
                                        </td>
                                        <td style={td}>{b.product_name}</td>
                                        <td style={td}>{formatCurrency(totalPaid)}</td>
                                        <td style={{ ...td, color: '#dc2626', fontWeight: 700 }}>{formatCurrency(totalRefunded)}</td>
                                        <td style={td}>
                                            <span style={{ 
                                                background: isFullyRefunded ? '#dcfce7' : '#fee2e2', 
                                                color: isFullyRefunded ? '#16a34a' : '#dc2626', 
                                                padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.75rem' 
                                            }}>
                                                {isFullyRefunded ? 'Completed' : 'Pending Refund'}
                                            </span>
                                        </td>
                                        <td style={{ ...td, textAlign: 'right' }}>
                                            <button 
                                                onClick={() => setSelectedBooking(b)}
                                                disabled={isFullyRefunded}
                                                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: isFullyRefunded ? '#f1f5f9' : '#9333ea', color: '#fff', fontWeight: 700, cursor: isFullyRefunded ? 'default' : 'pointer', fontSize: '0.82rem' }}>
                                                {isFullyRefunded ? 'Done' : 'Proses Refund'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {selectedBooking && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 450, padding: 28 }}>
                        <h3 style={{ marginTop: 0, marginBottom: 8, color: '#9333ea' }}>💰 Catat Pengembalian Dana</h3>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 20 }}>
                            Booking: <strong>{selectedBooking.guest_name}</strong> - {selectedBooking.product_name}
                        </p>
                        
                        <form onSubmit={handleRefundSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>TGL REFUND</label>
                                <input type="date" required style={fieldStyle} value={refundForm.refund_date} onChange={e => setRefundForm({...refundForm, refund_date: e.target.value})} />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>NOMINAL (RP)</label>
                                <input type="number" required min="1" style={fieldStyle} value={refundForm.amount} onChange={e => setRefundForm({...refundForm, amount: Number(e.target.value)})} />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>CATATAN / ALASAN</label>
                                <input type="text" style={fieldStyle} placeholder="Contoh: Refund DP 50% karena batal sepihak" value={refundForm.note} onChange={e => setRefundForm({...refundForm, note: e.target.value})} />
                            </div>
                            
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" onClick={() => setSelectedBooking(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                                <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: '#9333ea', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                                    {saving ? 'Menyimpan...' : 'Simpan Refund'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const th = { padding: '16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' };
const td = { padding: '16px', verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' };

export default ManagementRefund;
