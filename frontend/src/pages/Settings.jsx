import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

// SettingBox defined OUTSIDE Settings to prevent input focus loss on re-render
const SettingBox = ({ title, type, items, val, setVal, catVal, setCatVal, catOptions, onAdd, onDelete }) => (
    <div style={{ flex: 1, background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', minWidth: '300px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{title}</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                    type="text" 
                    placeholder="Ketik Nama Baru..." 
                    value={val} 
                    onChange={e => setVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') onAdd(type, val, setVal, catVal, setCatVal); }}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                />
                <button 
                    onClick={() => onAdd(type, val, setVal, catVal, setCatVal)} 
                    className="btn btn-primary" 
                    style={{ padding: '0 16px', fontSize: '1.2rem' }}
                >
                    +
                </button>
            </div>
            {catOptions && (
                <select 
                    value={catVal || ''} 
                    onChange={e => setCatVal(e.target.value)} 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                    <option value="">-- Set Kategori (Opsional) --</option>
                    {catOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            )}
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '300px', overflowY: 'auto' }}>
            {items.length === 0 && <li style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Belum ada entri data.</li>}
            {items.map(i => (
                <li key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{i.name}</div>
                        {i.category_name && <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>{i.category_name}</div>}
                    </div>
                    <button 
                        onClick={() => onDelete(type, i.id)} 
                        style={{ background: '#fee2e2', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, transition: 'all 0.2s' }}
                    >
                        Hapus
                    </button>
                </li>
            ))}
        </ul>
    </div>
);

const Settings = () => {
    const { user } = useContext(AuthContext);

    const [ships, setShips] = useState([]);
    const [sales, setSales] = useState([]);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [shipTypes, setShipTypes] = useState([]);
    const [users, setUsers] = useState([]);
    
    const [newShip, setNewShip] = useState('');
    const [newShipCategory, setNewShipCategory] = useState('');
    const [newSales, setNewSales] = useState('');
    const [newService, setNewService] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newShipType, setNewShipType] = useState('');

    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('staff');

    const fetchData = () => {
        api.get('/settings/ships').then(res => setShips(res.data));
        api.get('/settings/sales').then(res => setSales(res.data));
        api.get('/settings/services').then(res => setServices(res.data));
        api.get('/settings/categories').then(res => setCategories(res.data));
        api.get('/settings/ship_types').then(res => setShipTypes(res.data));
        if (user?.role === 'admin') {
            api.get('/users').then(res => setUsers(res.data)).catch(console.error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (type, name, setter, category_name = '', catSetter = null) => {
        if (!name.trim()) return;
        try {
            await api.post(`/settings/${type}`, { name, category_name });
            setter('');
            if (catSetter) catSetter('');
            fetchData();
        } catch (e) {
            alert('Error adding global setting');
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm('Hapus item ini?')) return;
        try {
            if (type === 'users') {
                await api.delete(`/users/${id}`);
            } else {
                await api.delete(`/settings/${type}/${id}`);
            }
            fetchData();
        } catch (e) {
            alert('Error deleting');
        }
    };

    const handleAddUser = async () => {
        if (!newUsername || !newPassword) return alert('Username & Password wajib diisi');
        try {
            await api.post('/users', { username: newUsername, password: newPassword, role: newRole });
            setNewUsername('');
            setNewPassword('');
            setNewRole('staff');
            fetchData();
        } catch (e) {
            alert(e.response?.data?.error || 'Gagal membuat user');
        }
    };

    const handleResetPassword = async (userId, username) => {
        const newPassword = window.prompt(`Masukkan sandi baru untuk user ${username} (Minimal 6 karakter):`);
        if (newPassword === null) return;
        if (newPassword.length < 6) return alert('Kata sandi minimal 6 karakter!');
        
        try {
            await api.put(`/users/${userId}/reset`, { newPassword });
            alert(`Kata sandi untuk ${username} berhasil direset!`);
        } catch (e) {
            alert(e.response?.data?.error || 'Gagal mereset kata sandi');
        }
    };

    return (
        <div>
            <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <div>
                    <h1>⚙️ Settings & Master Data</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Atur opsi dropdown Dinamis secara terpusat untuk keseluruhan sistem (CMS).</p>
                </div>
            </div>

            <div className="glass" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '24px' }}>
                <SettingBox title="🚢 Nama Kapal / Armada" type="ships" items={ships} val={newShip} setVal={setNewShip} catVal={newShipCategory} setCatVal={setNewShipCategory} catOptions={categories} onAdd={handleAdd} onDelete={handleDelete} />
                <SettingBox title="🛥️ Model / Jenis Kapal" type="ship_types" items={shipTypes} val={newShipType} setVal={setNewShipType} onAdd={handleAdd} onDelete={handleDelete} />
                <SettingBox title="💼 Tim Sales / Closing By" type="sales" items={sales} val={newSales} setVal={setNewSales} onAdd={handleAdd} onDelete={handleDelete} />
                <SettingBox title="🏷️ Jenis Layanan Dasar" type="services" items={services} val={newService} setVal={setNewService} onAdd={handleAdd} onDelete={handleDelete} />
                <SettingBox title="📂 Kategori Layanan / Sub-tipe" type="categories" items={categories} val={newCategory} setVal={setNewCategory} onAdd={handleAdd} onDelete={handleDelete} />
            </div>

            {user?.role === 'admin' && (
                <div style={{ marginTop: '32px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>🔐 Manajemen Akses Pengguna</h2>
                    <div className="glass" style={{ padding: '24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 700 }}>Tambah User Baru</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label>Username</label>
                                    <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Contoh: CS_Budi" />
                                </div>
                                <div>
                                    <label>Kata Sandi</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" />
                                </div>
                                <div>
                                    <label>Role</label>
                                    <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                                        <option value="staff">Staff (Terbatas)</option>
                                        <option value="admin">Administrator (Penuh)</option>
                                    </select>
                                </div>
                                <button onClick={handleAddUser} className="btn btn-primary" style={{ marginTop: '8px' }}>+ Buat Akun</button>
                            </div>
                        </div>

                        <div style={{ flex: 2, minWidth: '400px' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 700 }}>Daftar Akun Karyawan</h3>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Username</th>
                                            <th>Role Hak Akses</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td>#{u.id}</td>
                                                <td style={{ fontWeight: 700 }}>{u.username}</td>
                                                <td><span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>{u.role.toUpperCase()}</span></td>
                                                <td style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        onClick={() => handleResetPassword(u.id, u.username)} 
                                                        style={{ padding: '6px 12px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                                    >
                                                        Reset Sandi
                                                    </button>
                                                    <button onClick={() => handleDelete('users', u.id)} disabled={u.id === user.id} style={{ padding: '6px 12px', borderRadius: '6px', background: u.id === user.id ? '#f1f5f9' : '#fee2e2', color: u.id === user.id ? '#94a3b8' : '#dc2626', border: 'none', cursor: u.id === user.id ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                                                        {u.id === user.id ? 'Anda' : 'Hapus'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
