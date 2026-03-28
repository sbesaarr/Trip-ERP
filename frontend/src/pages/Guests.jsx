import React, { useState, useEffect } from 'react';
import api from '../api';
import BookingModal from '../components/BookingModal';

const LEAD_STAGES = [
    { key: 'LEADS',      label: 'Leads',       color: '#6366f1', bg: '#eef2ff' },
    { key: 'FOLLOW UP',  label: 'Follow Up',   color: '#f59e0b', bg: '#fffbeb' },
    { key: 'DEAL',       label: 'Deal',        color: '#10b981', bg: '#ecfdf5' },
    { key: 'BELUM TRIP', label: 'Belum Trip',  color: '#0ea5e9', bg: '#f0f9ff' },
    { key: 'SUDAH TRIP', label: 'Selesai',     color: '#16a34a', bg: '#dcfce7' },
    { key: 'CANCEL',     label: 'Cancel',      color: '#dc2626', bg: '#fee2e2' },
    { key: 'REFUND',     label: 'Refund',      color: '#9333ea', bg: '#faf5ff' },
];

const getStage = (key) => LEAD_STAGES.find(s => s.key === key) || LEAD_STAGES[0];

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const fmtDate = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
};

export default function Guests() {
    const [guests, setGuests] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Guest drawer
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Guest form modal (add/edit)
    const [guestModal, setGuestModal] = useState(false);
    const [guestForm, setGuestForm] = useState({ name: '', phone: '' });
    const [editingGuest, setEditingGuest] = useState(null);
    const [savingGuest, setSavingGuest] = useState(false);

    // Booking modal
    const [bookingModal, setBookingModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);

    const fetchGuests = () => {
        setLoading(true);
        api.get('/guests').then(r => setGuests(r.data)).finally(() => setLoading(false));
    };

    useEffect(() => { fetchGuests(); }, []);

    const openDetail = (guest) => {
        setSelected(guest);
        setDetail(null);
        setDetailLoading(true);
        api.get(`/guests/${guest.id}`)
            .then(r => setDetail(r.data))
            .finally(() => setDetailLoading(false));
    };

    const refreshDetail = (guestId) => {
        api.get(`/guests/${guestId}`).then(r => {
            setDetail(r.data);
            // Also update the guest in the list
            setSelected(prev => ({ ...prev, ...r.data.guest }));
        });
        fetchGuests();
    };

    const closeDetail = () => { setSelected(null); setDetail(null); };

    const openGuestModal = (guest = null) => {
        setEditingGuest(guest);
        setGuestForm({ name: guest?.name || '', phone: guest?.phone || '' });
        setGuestModal(true);
    };

    const saveGuest = async (e) => {
        e.preventDefault();
        setSavingGuest(true);
        try {
            if (editingGuest) {
                await api.put(`/guests/${editingGuest.id}`, guestForm);
            } else {
                await api.post('/guests', guestForm);
            }
            setGuestModal(false);
            fetchGuests();
            if (editingGuest && selected?.id === editingGuest.id) {
                refreshDetail(editingGuest.id);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menyimpan tamu');
        } finally {
            setSavingGuest(false);
        }
    };

    const filtered = guests.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.phone || '').includes(search)
    );

    const fieldStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

    return (
        <div style={{ padding: '0 0 40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Data Tamu</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>Kelola tamu & buat booking baru dari sini</p>
                </div>
                <button onClick={() => openGuestModal()} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    + Tambah Tamu
                </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau nomor HP..."
                    style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            {/* Guest Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Memuat data tamu...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>👥</div>
                    <div>Belum ada tamu. Klik <strong>+ Tambah Tamu</strong> untuk mulai.</div>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1.5px solid #e5e7eb' }}>
                                <th style={th}>Nama Tamu</th>
                                <th style={th}>No. HP</th>
                                <th style={{ ...th, textAlign: 'center' }}>Booking</th>
                                <th style={th}>Trip Terakhir</th>
                                <th style={th}>Total Belanja</th>
                                <th style={{ ...th, textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(g => (
                                <tr key={g.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(g.id * 47) % 360}, 60%, 55%)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                                                {g.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 700 }}>{g.name}</span>
                                        </div>
                                    </td>
                                    <td style={td}>{g.phone || '-'}</td>
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <span style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 20, padding: '3px 12px', fontWeight: 700 }}>{g.total_bookings || 0}x</span>
                                    </td>
                                    <td style={td}>{fmtDate(g.last_trip_date)}</td>
                                    <td style={{ ...td, fontWeight: 700, color: 'var(--primary)' }}>{fmt(g.total_spent)}</td>
                                    <td style={{ ...td, textAlign: 'center' }}>
                                        <button onClick={() => openDetail(g)} style={btnPrimary}>Detail &amp; Booking</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Guest Drawer */}
            {selected && (
                <div onClick={closeDetail} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
                    <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>

                        {/* Drawer Header */}
                        <div style={{ background: 'linear-gradient(135deg, var(--primary), #5aa341)', padding: '28px', color: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem' }}>
                                        {selected.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{selected.name}</div>
                                        <div style={{ opacity: 0.85, fontSize: '0.88rem', marginTop: 2 }}>📞 {selected.phone || 'Tidak ada nomor'}</div>
                                    </div>
                                </div>
                                <button onClick={closeDetail} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 16px', flex: 1, textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{selected.total_bookings || 0}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Booking</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '10px 16px', flex: 2, textAlign: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{fmt(selected.total_spent)}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Total Belanja</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => { openGuestModal(selected); }} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 10, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                    ✏️ Edit Tamu
                                </button>
                                <button onClick={() => { setEditingBooking(null); setBookingModal(true); }} style={{ flex: 2, background: '#fff', color: 'var(--primary)', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                                    🚀 + Buat Booking Baru
                                </button>
                            </div>
                        </div>

                        {/* Booking History */}
                        <div style={{ padding: 24, flex: 1 }}>
                            <h3 style={{ fontWeight: 800, margin: '0 0 16px', color: 'var(--text-main)' }}>🗂 Riwayat Booking</h3>

                            {detailLoading ? (
                                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Memuat booking...</div>
                            ) : detail && detail.bookings.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', background: '#f9fafb', borderRadius: 14 }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                                    <div>Belum ada booking. Klik <strong>+ Buat Booking Baru</strong> di atas.</div>
                                </div>
                            ) : detail ? detail.bookings.map(b => {
                                const stage = getStage(b.lead_status);
                                const paid = (b.payments || []).reduce((s, p) => s + p.amount, 0);
                                const remaining = b.total_price - paid;
                                const totalRefund = (b.refunds || []).reduce((s, r) => s + r.amount, 0);
                                return (
                                    <div key={b.id} style={{ background: '#f8fafc', borderRadius: 14, border: '1.5px solid #e5e7eb', padding: 18, marginBottom: 14 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>{b.product_name}</div>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
                                                    📅 {fmtDate(b.trip_date)} · 👥 {b.pax} pax {b.closing_by && b.closing_by !== '-' ? `· 🧑‍💼 ${b.closing_by}` : ''}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                                <span style={{ background: stage.bg, color: stage.color, borderRadius: 20, padding: '4px 12px', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                                    ● {stage.label}
                                                </span>
                                                <button onClick={() => { setEditingBooking(b); setBookingModal(true); }}
                                                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700, color: '#475569' }}>✏️ Edit</button>
                                            </div>
                                        </div>

                                        {/* Invoice */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                                            <div style={card}><div style={cardLabel}>Total Harga</div><div style={cardVal}>{fmt(b.total_price)}</div></div>
                                            <div style={card}><div style={cardLabel}>Sudah Bayar</div><div style={{ ...cardVal, color: '#16a34a' }}>{fmt(paid)}</div></div>
                                            <div style={card}><div style={cardLabel}>Sisa Tagihan</div><div style={{ ...cardVal, color: remaining > 0 ? '#dc2626' : '#16a34a' }}>{fmt(remaining)}</div></div>
                                        </div>

                                        {/* Refund info */}
                                        {totalRefund > 0 && (
                                            <div style={{ marginTop: 10, background: '#faf5ff', borderRadius: 8, padding: '8px 12px', border: '1px solid #e9d5ff' }}>
                                                <span style={{ fontSize: '0.82rem', color: '#9333ea', fontWeight: 700 }}>💰 Total Refund: {fmt(totalRefund)}</span>
                                                {b.refunds.map(r => (
                                                    <div key={r.id} style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3 }}>{fmtDate(r.refund_date)} — {fmt(r.amount)}{r.note ? ` · ${r.note}` : ''}</div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Payment history */}
                                        {b.payments.length > 0 && (
                                            <div style={{ marginTop: 10 }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>RIWAYAT PEMBAYARAN</div>
                                                {b.payments.map(p => (
                                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '4px 0', borderBottom: '1px dashed #e5e7eb' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>{fmtDate(p.payment_date)}</span>
                                                        <span style={{ fontWeight: 700, color: '#16a34a' }}>+{fmt(p.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Guest Add/Edit Modal */}
            {guestModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontWeight: 800, marginBottom: 20 }}>{editingGuest ? '✏️ Edit Data Tamu' : '👤 Tambah Tamu Baru'}</h2>
                        <form onSubmit={saveGuest}>
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, color: '#6b7280' }}>NAMA TAMU</label>
                                <input required type="text" value={guestForm.name} onChange={e => setGuestForm({ ...guestForm, name: e.target.value })} placeholder="Nama lengkap" style={fieldStyle} />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, color: '#6b7280' }}>NOMOR HP / WHATSAPP</label>
                                <input type="text" value={guestForm.phone} onChange={e => setGuestForm({ ...guestForm, phone: e.target.value })} placeholder="081234567890" style={fieldStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="button" onClick={() => setGuestModal(false)} style={{ flex: 1, padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                                <button type="submit" disabled={savingGuest} style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                                    {savingGuest ? 'Menyimpan...' : (editingGuest ? '💾 Simpan' : '✅ Tambah Tamu')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {bookingModal && selected && (
                <BookingModal
                    guest={detail?.guest || selected}
                    booking={editingBooking}
                    onClose={() => { setBookingModal(false); setEditingBooking(null); }}
                    onSaved={() => refreshDetail(selected.id)}
                />
            )}
        </div>
    );
}

const th = { padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td = { padding: '12px 16px', color: 'var(--text-main)', verticalAlign: 'middle' };
const btnPrimary = { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' };
const card = { background: '#fff', borderRadius: 8, padding: '8px 12px', border: '1px solid #e5e7eb' };
const cardLabel = { fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 };
const cardVal = { fontWeight: 700, fontSize: '0.88rem' };
