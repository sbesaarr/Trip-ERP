import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err.response?.data?.error || 'Login gagal. Periksa koneksi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'radial-gradient(at 50% 0%, rgba(59, 119, 36, 0.4) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(3, 105, 161, 0.4) 0px, transparent 50%)',
            padding: '20px'
        }}>
            <div className="glass" style={{
                maxWidth: '420px',
                width: '100%',
                padding: '40px',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary), #5aa341)', color: 'white', fontSize: '32px', marginBottom: '16px', boxShadow: '0 10px 25px rgba(59, 119, 36, 0.5)' }}>
                        🌿
                    </div>
                    <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>MENUJU.TRIP</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 600 }}>ERP EXECUTIVE SECURE PORTAL</p>
                </div>

                {error && (
                    <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#fca5a5', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>Username Akses</label>
                        <input
                            type="text"
                            required
                            placeholder="Ketik username Anda"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', transition: 'all 0.2s', fontSize: '1rem'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(0,0,0,0.2)'; }}
                        />
                    </div>
                    <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>Kata Sandi</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', transition: 'all 0.2s', fontSize: '1rem', letterSpacing: '0.2em'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.background = 'rgba(0,0,0,0.2)'; }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '12px', width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                            background: 'linear-gradient(to right, #3b7724, #2d5a1b)', color: 'white', fontWeight: 800, fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
                            boxShadow: '0 10px 25px rgba(59, 119, 36, 0.4)'
                        }}
                    >
                        {loading ? 'Mengautentikasi...' : 'Masuk ke Sistem'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    &copy; 2026 Menuju Trip. All Rights Reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
