import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
    const { user, login } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const fileInputRef = useRef(null);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            setProfile(res.data);
            
            // Sync context if photo changed (basic sync)
            const oldUserStr = localStorage.getItem('user');
            if (oldUserStr) {
                const ud = JSON.parse(oldUserStr);
                ud.photo_url = res.data.photo_url;
                localStorage.setItem('user', JSON.stringify(ud));
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.error || "Gagal memuat profil. Sesi mungkin telah berakhir.");
            if (err.response && err.response.status === 401) {
                // Token invalid or expired
                const { logout } = require('../context/AuthContext'); 
                // wait, I can just use AuthContext from useContext above
            }
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/profile/password', { oldPassword, newPassword });
            alert('Kata sandi berhasil diperbarui!');
            setOldPassword('');
            setNewPassword('');
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal mengubah kata sandi');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            await api.put('/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchProfile();
            alert('Foto profil berhasil diunggah! Refresh halaman jika foto belum berubah sepenuhnya.');
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal mengunggah foto');
        } finally {
            setUploading(false);
        }
    };

    if (errorMsg) return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>⚠️ {errorMsg}</h2>
            <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="btn btn-primary" style={{ marginTop: '20px' }}>Masuk Ulang</button>
        </div>
    );
    if (!profile) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Memuat Profil Karyawan...</div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <h1>👤 Profil Karyawan</h1>
                <p style={{ color: 'var(--text-muted)' }}>Atur foto identitas personal dan perbarui tingkat keamanan akun Anda.</p>
            </div>

            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                
                {/* Avatar Section */}
                <div className="glass" style={{ flex: 1, minWidth: '300px', padding: '30px', textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 20px auto' }}>
                        {profile.photo_url ? (
                            <img 
                                src={`http://localhost:3000${profile.photo_url}`} 
                                alt="Avatar" 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} 
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #5aa341)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', fontWeight: 800, border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                {profile.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            disabled={uploading}
                            style={{ position: 'absolute', bottom: '0', right: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                        >
                            📷
                        </button>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                    />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'capitalize' }}>{profile.username}</h2>
                    <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(56, 189, 248, 0.1)', color: '#0284c7', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '8px' }}>
                        {profile.role}
                    </div>
                </div>

                {/* Password Section */}
                <div className="glass" style={{ flex: 2, minWidth: '400px', padding: '30px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>Ubah Kata Sandi</h2>
                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                        <div>
                            <label>Kata Sandi Lama</label>
                            <input 
                                type="password" 
                                value={oldPassword} 
                                onChange={e => setOldPassword(e.target.value)} 
                                required 
                                placeholder="Masukkan sandi saat ini"
                            />
                        </div>
                        <div>
                            <label>Kata Sandi Baru</label>
                            <input 
                                type="password" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                required 
                                placeholder="Minimal 6 Karakter"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? 'Menyimpan...' : 'Perbarui Keamanan'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Profile;
