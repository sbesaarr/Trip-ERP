import React from 'react';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Bookings from './pages/Bookings';
import Guests from './pages/Guests';
import Finance from './pages/Finance';
import ManagementRefund from './pages/ManagementRefund';
import VendorPayments from './pages/VendorPayments';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

const AppContent = () => {
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);

    if (!user) {
        return <Login />;
    }

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>MENUJU FLORES</h2>
                    <p>FLORES & LABUAN BAJO</p>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li className={location.pathname === '/' ? 'active' : ''}>
                            <Link to="/"><span className="icon">📊</span> Dashboard</Link>
                        </li>
                        <li className={location.pathname === '/products' ? 'active' : ''}>
                            <Link to="/products"><span className="icon">📦</span> Master Trips</Link>
                        </li>
                        <li className={location.pathname === '/bookings' ? 'active' : ''}>
                            <Link to="/bookings"><span className="icon">🎫</span> Transaksi Tamu</Link>
                        </li>
                        <li className={location.pathname === '/guests' ? 'active' : ''}>
                            <Link to="/guests"><span className="icon">👥</span> Data Tamu</Link>
                        </li>
                        <li className={location.pathname === '/vendor-payments' ? 'active' : ''}>
                            <Link to="/vendor-payments"><span className="icon">⚓</span> Setoran Operator</Link>
                        </li>
                        <li className={location.pathname === '/finance' ? 'active' : ''}>
                            <Link to="/finance"><span className="icon">💰</span> Finance</Link>
                        </li>
                        <li className={location.pathname === '/refunds' ? 'active' : ''}>
                            <Link to="/refunds"><span className="icon">💸</span> Management Refund</Link>
                        </li>
                        <hr style={{margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)'}} />
                        <li className={location.pathname === '/settings' ? 'active' : ''}>
                            <Link to="/settings"><span className="icon">⚙️</span> Settings</Link>
                        </li>
                    </ul>
                </nav>
                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '10px', borderRadius: '12px', textDecoration: 'none', transition: 'background 0.2s', background: location.pathname === '/profile' ? 'rgba(59, 119, 36, 0.1)' : 'transparent' }} onMouseOver={e => !location.pathname.startsWith('/profile') && (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')} onMouseOut={e => !location.pathname.startsWith('/profile') && (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #5aa341)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            {user.photo_url ? (
                                <img src={user.photo_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                user.username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'capitalize' }}>{user.username}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>{user.role}</div>
                        </div>
                    </Link>
                    <button onClick={logout} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseOver={e => {e.currentTarget.style.background = '#fca5a5'; e.currentTarget.style.color = 'white'}} onMouseOut={e => {e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'}}>
                        Keluar (Logout) 🔒
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <div className="content-container">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/bookings" element={<Bookings />} />
                        <Route path="/guests" element={<Guests />} />
                        <Route path="/vendor-payments" element={<VendorPayments />} />
                        <Route path="/finance" element={<Finance />} />
                        <Route path="/refunds" element={<ManagementRefund />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
