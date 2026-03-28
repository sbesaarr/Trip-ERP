import React, { useState, useEffect } from 'react';
import api from '../api';
import { format } from 'date-fns';

const VendorPayments = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [operatorPayments, setOperatorPayments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const fetchData = () => {
        setLoading(true);
        api.get('/bookings')
            .then(res => {
                const active = res.data.filter(b => b.status !== 'CANCEL/RESCHEDULE');
                setBookings(active);
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val || 0);

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

    const handleOpenModal = (b) => {
        setSelectedBooking(b);
        setOperatorPayments(b.operator_payments ? [...b.operator_payments] : []);
        setShowModal(true);
    };

    const handleAddPayment = () => {
        setOperatorPayments([
            ...operatorPayments, 
            { payment_date: format(new Date(), 'yyyy-MM-dd'), amount: 0, proof_url: '' }
        ]);
    };

    const handlePaymentChange = (index, field, value) => {
        const arr = [...operatorPayments];
        arr[index][field] = value;
        setOperatorPayments(arr);
    };

    const removePayment = (index) => {
        const arr = [...operatorPayments];
        arr.splice(index, 1);
        setOperatorPayments(arr);
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
            alert('Gagal mengupload bukti transfer');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...selectedBooking, operator_payments: operatorPayments.filter(p => p.amount > 0) };
        try {
            await api.put(`/bookings/${selectedBooking.id}`, payload);
            setShowModal(false);
            fetchData();
        } catch(err) {
            alert('Error saving vendor payment');
        }
    };

    return (
        <div>
            <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <div>
                    <h1>Setoran ke Operator / Vendor</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Pantau kewajiban bayar (HPP) ke pihak operator kapal dan vendor layanan lainnya.</p>
                </div>
            </div>

            <div className="table-container">
                <table style={{minWidth: '1000px'}}>
                    <thead>
                        <tr>
                            <th>Tgl Trip</th>
                            <th>Tamu & Pax</th>
                            <th>Layanan & Kapal</th>
                            <th>Nama Operator</th>
                            <th>Total Kewajiban (HPP)</th>
                            <th>Telah Disetor</th>
                            <th>Sisa Hutang</th>
                            <th style={{textAlign: 'right'}}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{textAlign: 'center', padding: '40px'}}>Membaca data hutang vendor...</td></tr>
                        ) : (
                            Array.isArray(bookings) && bookings.map(b => {
                                const hppBase = (Number(b.cost_price) || 0) * (Number(b.pax) || 0);
                                const hppAddons = Array.isArray(b.additional_services) ? b.additional_services.reduce((acc, svc) => acc + ((Number(svc.cost_price) || 0) * (Number(svc.qty) || 0)), 0) : 0;
                                const hppTotal = hppBase + hppAddons;
                                
                                const totalPaidToOp = Array.isArray(b.operator_payments) ? b.operator_payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) : 0;
                                const hutang = hppTotal - totalPaidToOp;

                                return (
                                    <tr key={b.id}>
                                        <td style={{fontWeight: 600}}>{safeDate(b.trip_date)}</td>
                                        <td>
                                            <div style={{fontWeight: 700}}>{String(b.guest_name || 'Tanpa Nama')}</div>
                                            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px'}}>{b.pax} Orang 👤</div>
                                        </td>
                                        <td>
                                            <div style={{fontWeight: 600, color: 'var(--primary)'}}>{b.product_name}</div>
                                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px'}}>
                                                Kapal: {b.ship_name || '-'}
                                            </div>
                                        </td>
                                        <td><div style={{fontWeight: 700, color: '#475569'}}>{b.operator_name || '-'}</div></td>
                                        <td>{formatCurrency(hppTotal)}</td>
                                        <td>
                                            <strong style={{color: totalPaidToOp > 0 ? 'var(--secondary)' : 'var(--text-main)'}}>
                                                {formatCurrency(totalPaidToOp)}
                                            </strong>
                                            {Array.isArray(b.operator_payments) && b.operator_payments.some(p => p.proof_url) && (
                                                <div style={{fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, marginTop: '4px'}}>BUKTI TF TERLAMPIR ✓</div>
                                            )}
                                        </td>
                                        <td>
                                            {hutang <= 0 ? (
                                                <span className="badge badge-success">LUNAS Penuh</span>
                                            ) : (
                                                <strong style={{color: 'var(--danger)', fontSize: '1rem'}}>{formatCurrency(hutang)}</strong>
                                            )}
                                        </td>
                                        <td style={{textAlign: 'right'}}>
                                            <button onClick={() => handleOpenModal(b)} className="btn btn-primary" style={{padding: '6px 14px', fontSize: '12px'}}>📝 Kelola Setoran</button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        {!loading && (!Array.isArray(bookings) || bookings.length === 0) && (
                            <tr><td colSpan="8" style={{textAlign: 'center', padding: '40px'}}>Belum ada data trip aktif.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && selectedBooking && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: '700px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                            <div>
                                <h2 style={{fontSize: '1.4rem', fontWeight: 800}}>Setoran Operator / Vendor</h2>
                                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px'}}>
                                    Tracking pelunasan HPP ke mitra Kapal dari transaksi <strong>{selectedBooking.guest_name}</strong>.
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)'}}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-section">
                                <div className="form-section-header">🎫 Detail Alokasi Vendor</div>
                                <div className="grid-cols-2">
                                    <div className="col-span-1">
                                        <label>Nama Paket / Trip</label>
                                        <div style={{fontWeight: 600, fontSize: '0.95rem'}}>{selectedBooking.product_name}</div>
                                    </div>
                                    <div className="col-span-1">
                                        <label>Vendor / Operator</label>
                                        <div style={{fontWeight: 700, fontSize: '1rem', color: 'var(--primary)'}}>{selectedBooking.operator_name || 'TIDAK DIISI'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section" style={{background: '#fcfcfc', border: '1px solid #e2e8f0'}}>
                                <div className="form-section-header" style={{color: '#475569'}}>
                                    <span>💸 Riwayat Transfer Bank ke Vendor</span>
                                    <button type="button" onClick={handleAddPayment} className="btn btn-primary" style={{fontSize: '0.8rem', padding: '6px 12px'}}>+ Tambah Bukti TF</button>
                                </div>
                                
                                {operatorPayments.map((pay, index) => (
                                    <div key={index} style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0'}}>
                                        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                                            <div style={{flex: 1}}>
                                                <label style={{fontSize: '0.75rem', marginBottom: '4px'}}>Tgl Setor</label>
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
                                                <input type="file" accept="image/*,application/pdf" onChange={e => handleFileUpload(index, e.target.files[0])} style={{fontSize: '0.8rem', padding: '6px'}} />
                                            </div>
                                            <div style={{flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
                                                {isUploading && <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>Mengunggah gambar...</span>}
                                                {pay.proof_url && (
                                                    <a href={pay.proof_url.startsWith('http') ? pay.proof_url : `http://localhost:3000${pay.proof_url}`} target="_blank" rel="noreferrer" 
                                                       style={{fontSize: '12px', color: 'var(--secondary)', background: '#dcfce7', padding: '6px 14px', borderRadius: '20px', textDecoration: 'none', fontWeight: 700}}>
                                                        Lihat Struk ↗
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {operatorPayments.length === 0 && <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Belum ada catatan setoran atau transfer.</span>}
                            </div>

                            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{flex: 1, padding: '16px'}} disabled={isUploading}>Tutup Kembali</button>
                                <button type="submit" className="btn btn-primary" style={{flex: 2, padding: '16px', fontSize: '1.1rem'}} disabled={isUploading}>
                                    💾 Simpan Setoran Vendor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorPayments;
