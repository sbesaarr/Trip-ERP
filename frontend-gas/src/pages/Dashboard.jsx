import React, { useState, useEffect } from 'react';
import api from '../api';

const Dashboard = () => {
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

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val || 0);

    if (loading || !data) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Mengkalkulasi Aggregasi Analytics...</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const { financials, products, goal, trends, sales } = data;
    const progressPercent = Math.min(100, Math.round((goal.current_pax / goal.target_pax) * 100));

    const StatCard = ({ title, value, subtitle, icon, highlight = false }) => (
        <div className="glass" style={{ padding: '24px', flex: 1, minWidth: '250px', background: highlight ? 'linear-gradient(135deg, var(--primary) 0%, #0369a1 100%)' : undefined, color: highlight ? 'white' : 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: highlight ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                    {title}
                </div>
                <div style={{ fontSize: '1.5rem', opacity: 0.8 }}>{icon}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>
                {value}
            </div>
            {subtitle && (
                <div style={{ fontSize: '0.85rem', color: highlight ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)', fontWeight: 500 }}>
                    {subtitle}
                </div>
            )}
        </div>
    );

    const ListWidget = ({ title, items, renderValue, icon }) => (
        <div className="glass" style={{ padding: '24px', flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {items.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>Belum ada data</div>
                ) : (
                    items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px', transition: 'all 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: idx === 0 ? '#fef08a' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#fed7aa' : 'transparent', color: idx < 3 ? '#854d0e' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                                    {idx + 1}
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{item.name}</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                                {renderValue(item.value)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div style={{ paddingBottom: '60px', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', background: 'linear-gradient(90deg, var(--primary), #0369a1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Executive Analytics
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Ringkasan performa finansial, tren produk, dan pencapaian target operasional Anda.</p>
            </div>

            {/* Financial Overview Cards */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
                <StatCard 
                    title="Total Omzet Penjualan" 
                    value={formatCurrency(financials.total_revenue)} 
                    subtitle="Akumulasi tagihan bruto tamu"
                    icon="💰" 
                />
                <StatCard 
                    title="Total Pengeluaran (HPP)" 
                    value={formatCurrency(financials.total_operator_expense)} 
                    subtitle="Pembayaran ke pihak vendor & operator"
                    icon="💸" 
                />
                <StatCard 
                    title="Estimasi Margin Bersih" 
                    value={formatCurrency(financials.net_margin)} 
                    subtitle="Keuntungan kotor perusahaan"
                    icon="✨" 
                    highlight={true}
                />
            </div>

            {/* Target 2026 Goal */}
            <div className="glass" style={{ padding: '32px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>🎯 Target 2026: {goal.target_pax} Tamu (Pax)</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Pantau pencapaian jumlah tamu aktual berbanding target tahunan.</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{progressPercent}%</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>TERCAPAI</div>
                    </div>
                </div>
                
                <div style={{ position: 'relative', height: '24px', backgroundColor: '#e2e8f0', borderRadius: '100px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ 
                        width: `${progressPercent}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)', 
                        borderRadius: '100px',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem', animation: 'move 1s linear infinite' }}></div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700 }}>
                    <span style={{ color: '#10b981' }}>{goal.current_pax} Pax Saat Ini</span>
                    <span style={{ color: '#ef4444' }}>⚡ {goal.target_pax - goal.current_pax} Pax Lagi!</span>
                </div>
                <style>{`@keyframes move { 0% { background-position: 0 0; } 100% { background-position: 1rem 0; } }`}</style>
            </div>

            {/* Lists Row 1 */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
                <ListWidget 
                    title="Top 5 Paket Paling Laris" 
                    icon="🔥" 
                    items={products.top_packages_pax} 
                    renderValue={(v) => `${v} Org`} 
                />
                <ListWidget 
                    title="Top 5 Paket Margin Tertinggi" 
                    icon="💎" 
                    items={products.top_packages_margin} 
                    renderValue={(v) => formatCurrency(v)} 
                />
                <ListWidget 
                    title="Top 5 Operator Terbaik" 
                    icon="🚢" 
                    items={products.top_operators} 
                    renderValue={(v) => `${v}x Trip`} 
                />
            </div>

            {/* Lists Row 2: Trends & CS */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                
                {/* Insights / Trends */}
                <div className="glass" style={{ padding: '24px', flex: 2, minWidth: '400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <span style={{ fontSize: '1.2rem' }}>📈</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Insights & Tren Pasar</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div style={{ padding: '16px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
                            <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Total Keuntungan (Khusus Open Trip)</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0369a1' }}>{formatCurrency(trends.margin_open_trip)}</div>
                        </div>

                        <div style={{ padding: '16px', backgroundColor: 'rgba(251, 146, 60, 0.1)', borderRadius: '12px', borderLeft: '4px solid #fb923c' }}>
                            <div style={{ fontSize: '0.8rem', color: '#c2410c', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Open Trip Paling Diminati</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#9a3412', marginBottom: '4px' }}>{trends.top_open_trip.name}</div>
                            <div style={{ fontSize: '0.85rem', color: '#ea580c', fontWeight: 600 }}>Diikuti {trends.top_open_trip.value} Pax</div>
                        </div>

                        <div style={{ padding: '16px', backgroundColor: 'rgba(167, 139, 250, 0.1)', borderRadius: '12px', borderLeft: '4px solid #a78bfa' }}>
                            <div style={{ fontSize: '0.8rem', color: '#6d28d9', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Kapal Paling Sering Digunakan</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#5b21b6', marginBottom: '4px' }}>{trends.top_ship.name}</div>
                            <div style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 600 }}>Tercatat {trends.top_ship.value} Booking</div>
                        </div>
                        
                        <div style={{ padding: '16px', backgroundColor: 'rgba(74, 222, 128, 0.1)', borderRadius: '12px', borderLeft: '4px solid #4ade80' }}>
                            <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>OT Darat Paling Diminati</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d', marginBottom: '4px' }}>{trends.top_darat.name}</div>
                            <div style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 600 }}>Diikuti {trends.top_darat.value} Pax</div>
                        </div>
                    </div>
                </div>

                {/* Sales Performance */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <ListWidget 
                        title="Leaderboard Tim Sales" 
                        icon="👩‍💻" 
                        items={sales} 
                        renderValue={(v) => `${v} Closing`} 
                    />
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

export default Dashboard;
