import React, { useState, useEffect } from 'react';
import api from '../api';

const Finance = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/full')
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    if (loading || !data) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Memuat Laporan Keuangan...</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const { financials, products, trends } = data;

    return (
        <div style={{ paddingBottom: '60px', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                    💰 Finance Overview
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Ringkasan arus kas, HPP vendor, dan profitabilitas operasional.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="glass" style={{ padding: '32px', borderLeft: '8px solid #10b981' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', marginBottom: '16px', textTransform: 'uppercase' }}>Total Omzet (Revenue)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)' }}>{formatCurrency(financials.total_revenue)}</div>
                    <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total dana masuk dari semua booking aktif.</div>
                </div>

                <div className="glass" style={{ padding: '32px', borderLeft: '8px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#d97706', marginBottom: '16px', textTransform: 'uppercase' }}>Total HPP (Expenses)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-main)' }}>{formatCurrency(financials.total_operator_expense)}</div>
                    <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total biaya yang harus dibayar ke vendor/operator.</div>
                </div>

                <div className="glass" style={{ padding: '32px', borderLeft: '8px solid var(--primary)', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase' }}>Net Margin Est.</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>{formatCurrency(financials.net_margin)}</div>
                    <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estimasi keuntungan bersih setelah potongan HPP.</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div className="glass" style={{ padding: '24px', flex: 1, minWidth: '400px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        📊 Analisis Profitabilitas Produk
                    </h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>NAMA PAKET</th>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>EST. MARGIN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.top_packages_margin.map((p, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '12px', fontWeight: 600 }}>{p.name}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{formatCurrency(p.value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="glass" style={{ padding: '24px', flex: 1, minWidth: '400px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🚢 Performa Cost Operator
                    </h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>OPERATOR / VENDOR</th>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'right' }}>VOLUME MARGIN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trends.top_5_operators_margin.map((o, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '12px', fontWeight: 600 }}>{o.name}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(o.value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Finance;
