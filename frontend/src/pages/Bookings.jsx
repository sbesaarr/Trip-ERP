import React, { useState, useEffect } from 'react';
import api from '../api';
import { format } from 'date-fns';
import BookingModal from '../components/BookingModal';
import { useNavigate } from 'react-router-dom';

const LEAD_STAGES = [
    { key: 'ALL',        label: 'Semua',       color: '#475569', bg: '#f1f5f9' },
    { key: 'Booking',    label: 'Booking',     color: '#6366f1', bg: '#eef2ff' },
    { key: 'Closing',    label: 'Closing',     color: '#10b981', bg: '#ecfdf5' },
    { key: 'Belum Trip', label: 'Belum Trip',  color: '#0ea5e9', bg: '#f0f9ff' },
    { key: 'Sedang Trip',label: 'Sedang Trip', color: '#f59e0b', bg: '#fffbeb' },
    { key: 'Sudah Trip', label: 'Selesai',     color: '#16a34a', bg: '#dcfce7' },
    { key: 'Cancel',     label: 'Cancel',      color: '#dc2626', bg: '#fee2e2' },
];

const getStage = (key) => LEAD_STAGES.find(s => s.key === key) || LEAD_STAGES[1];

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [search, setSearch] = useState('');
    const [editingBooking, setEditingBooking] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const fetchData = () => {
        setLoading(true);
        api.get('/bookings').then(r => setBookings(r.data)).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    const safeDate = (dateStr) => {
        try {
            if (!dateStr) return '-';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '-';
            return format(d, 'dd MMM yyyy');
        } catch {
            return '-';
        }
    };

    const counts = LEAD_STAGES.reduce((acc, s) => {
        acc[s.key] = s.key === 'ALL' ? bookings.length : (Array.isArray(bookings) ? bookings.filter(b => b.status === s.key).length : 0);
        return acc;
    }, {});

    const filtered = Array.isArray(bookings) ? bookings.filter(b => {
        const matchTab = activeTab === 'ALL' || b.status === activeTab;
        const name = String(b.guest_name || '').toLowerCase();
        const prod = String(b.product_name || '').toLowerCase();
        const query = (search || '').toLowerCase();
        const matchSearch = !search || name.includes(query) || prod.includes(query);
        return matchTab && matchSearch;
    }) : [];

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus keseluruhan transaksi ini?')) return;
        try { await api.delete(`/bookings/${id}`); fetchData(); }
        catch { alert('Error deleting'); }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Transaksi Tamu</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>Pipeline booking dari leads sampai closing</p>
                </div>
                <button onClick={() => navigate('/guests')} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    👤 Tambah Lewat Data Tamu
                </button>
            </div>

            {/* Pipeline Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {LEAD_STAGES.map(s => (
                    <button key={s.key} onClick={() => setActiveTab(s.key)}
                        style={{ padding: '7px 14px', borderRadius: 20, border: `2px solid ${activeTab === s.key ? s.color : '#e5e7eb'}`, background: activeTab === s.key ? s.bg : '#f9fafb', color: activeTab === s.key ? s.color : '#6b7280', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {s.label}
                        <span style={{ background: activeTab === s.key ? s.color : '#e5e7eb', color: activeTab === s.key ? '#fff' : '#6b7280', borderRadius: 10, padding: '0 7px', fontSize: '0.75rem', fontWeight: 800 }}>{counts[s.key] || 0}</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama tamu atau produk..."
                    style={{ width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 900 }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1.5px solid #e5e7eb' }}>
                            <th style={th}>Tgl Trip</th>
                            <th style={th}>Tamu</th>
                            <th style={th}>Sales</th>
                            <th style={th}>Paket Trip</th>
                            <th style={th}>Piutang / Lunas</th>
                            <th style={th}>Status Trip</th>
                            <th style={{ ...th, textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Membaca database...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Tidak ada transaksi ditemukan.</td></tr>
                        ) : (
                            filtered.map(b => {
                                const bPaid = (Array.isArray(b.payments) ? b.payments : []).reduce((s, p) => s + (p.amount || 0), 0);
                                const isLunas = (Number(b.total_price) || 0) - bPaid <= 0;
                                const stage = getStage(b.status);
                                return (
                                    <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={td}><strong>{safeDate(b.trip_date)}</strong></td>
                                        <td style={td}>
                                            <div style={{ fontWeight: 700 }}>{b.guest_name || 'Tanpa Nama'} <span style={{ color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 500 }}>({b.guest_type || 'WNI'})</span></div>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                                                {b.guest_phone && (
                                                    <a href={`https://wa.me/${String(b.guest_phone).replace(/\D/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer"
                                                        style={{ background: '#1dc071', color: '#fff', padding: '2px 8px', borderRadius: 6, textDecoration: 'none', fontSize: '0.72rem', fontWeight: 700 }}>
                                                        WA 💬
                                                    </a>
                                                )}
                                                {b.documentation_url && (
                                                    <a href={String(b.documentation_url)} target="_blank" rel="noreferrer" title="Documentation Link"
                                                        style={{ background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: 6, textDecoration: 'none', fontSize: '0.72rem', fontWeight: 700 }}>
                                                        DOC 🔗
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td style={td}>{b.closing_by || '-'}</td>
                                        <td style={td}>
                                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{b.product_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.pax} Pax · {b.ship_name || '-'}</div>
                                        </td>
                                        <td style={td}>
                                            {isLunas ? (
                                                <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: '0.8rem' }}>LUNAS</span>
                                            ) : (
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>{formatCurrency(b.total_price - bPaid)}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Dibayar: {formatCurrency(bPaid)}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td style={td}>
                                            <select value={b.status}
                                                onChange={async (e) => {
                                                    try { await api.patch(`/bookings/${b.id}/status`, { status: e.target.value }); fetchData(); }
                                                    catch { alert('Error updating status'); }
                                                }}
                                                style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                                    background: b.status === 'Sudah Trip' ? '#dcfce7' : b.status === 'Belum Trip' ? '#fef9c3' : b.status === 'Cancel' ? '#fee2e2' : '#f1f5f9',
                                                    color: b.status === 'Sudah Trip' ? '#166534' : b.status === 'Belum Trip' ? '#854d0e' : b.status === 'Cancel' ? '#dc2626' : 'var(--text-main)' }}>
                                                <option>Booking</option>
                                                <option>Closing</option>
                                                <option>Belum Trip</option>
                                                <option>Sedang Trip</option>
                                                <option>Sudah Trip</option>
                                                <option>Cancel</option>
                                            </select>
                                        </td>
                                        <td style={{ ...td, textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: 6 }}>
                                                <button onClick={() => { setEditingBooking(b); setShowModal(true); }}
                                                    style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                                <button onClick={() => handleDelete(b.id)}
                                                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Hapus</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Booking Edit Modal */}
            {showModal && editingBooking && (
                <BookingModal
                    guest={{ id: editingBooking.guest_id, name: editingBooking.guest_name, phone: editingBooking.guest_phone }}
                    booking={editingBooking}
                    onClose={() => { setShowModal(false); setEditingBooking(null); }}
                    onSaved={fetchData}
                />
            )}
        </div>
    );
};

export default Bookings;

const th = { padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' };
const td = { padding: '12px 16px', verticalAlign: 'middle' };
