import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Sun, Moon, Shield, Bell, Lock, LogOut, User } from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { key: 'general', icon: User, label: 'General' },
    { key: 'privacy', icon: Shield, label: 'Privacy' },
    { key: 'notifications', icon: Bell, label: 'Notifications' },
    { key: 'appearance', icon: Sun, label: 'Appearance' },
  ];

  const handlePrivacyToggle = async () => {
    try {
      const res = await apiFetch('/api/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify({ is_private: !user?.is_private })
      });
      const data = await res.json();
      updateUser(data);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="social-main-feed" style={{ maxWidth: '800px', display: 'flex', padding: 0 }}>
      {/* Settings sidebar */}
      <div style={{ width: '250px', borderRight: '1px solid var(--glass-border-bright)', padding: '1.5rem 0' }}>
        <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', padding: 0 }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Settings</h2>
        </div>
        {sections.map(s => (
          <div key={s.key} onClick={() => setActiveSection(s.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem',
              cursor: 'pointer', fontWeight: activeSection === s.key ? '600' : '400',
              background: activeSection === s.key ? 'var(--bg-secondary)' : 'transparent',
              borderLeft: activeSection === s.key ? '3px solid var(--accent-primary)' : '3px solid transparent'
            }}>
            <s.icon size={20} /> {s.label}
          </div>
        ))}
        <div onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', cursor: 'pointer', color: 'var(--error)', marginTop: '2rem' }}>
          <LogOut size={20} /> Logout
        </div>
      </div>

      {/* Settings content */}
      <div style={{ flex: 1, padding: '2rem' }}>
        {activeSection === 'general' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>General Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div><h4>Email</h4><p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{user?.email}</p></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div><h4>Username</h4><p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>@{user?.username || 'Not set'}</p></div>
                <button className="follow-btn" onClick={() => navigate(`/profile/${user?.id}`)}>Edit</button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Privacy Settings</h3>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Lock size={20} />
                <div><h4>Private Account</h4><p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Only approved followers can see your posts</p></div>
              </div>
              <label style={{ position: 'relative', width: '48px', height: '26px', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!user?.is_private} onChange={handlePrivacyToggle}
                  style={{ display: 'none' }} />
                <div style={{
                  width: '100%', height: '100%', borderRadius: '13px',
                  background: user?.is_private ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  transition: 'background 0.2s', position: 'relative'
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '2px', left: user?.is_private ? '24px' : '2px',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </label>
            </div>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Appearance</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {(['light', 'dark'] as const).map(t => (
                <div key={t} onClick={() => { if (theme !== t) toggleTheme(); }}
                  style={{
                    flex: 1, padding: '2rem', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                    border: theme === t ? '2px solid var(--accent-primary)' : '2px solid var(--glass-border-bright)',
                    background: t === 'dark' ? '#1a1a2e' : '#f8fafc'
                  }}>
                  {t === 'light' ? <Sun size={32} color="#333" /> : <Moon size={32} color="#fff" />}
                  <p style={{ marginTop: '0.75rem', fontWeight: '600', color: t === 'dark' ? '#fff' : '#333' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Notification Preferences</h3>
            {['Likes', 'Comments', 'New Followers', 'Messages', 'Story Replies'].map(item => (
              <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--glass-border-bright)' }}>
                <span>{item}</span>
                <label style={{ position: 'relative', width: '48px', height: '26px', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ display: 'none' }} />
                  <div style={{ width: '100%', height: '100%', borderRadius: '13px', background: 'var(--accent-primary)', position: 'relative' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
