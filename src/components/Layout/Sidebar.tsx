import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, API_URL } from '../../context/AuthContext';
import {
  Home, Search, Compass, Film, MessageCircle, Bell, PlusSquare,
  User as UserIcon, Settings, LogOut, MessageSquare, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/explore' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Film, label: 'Reels', path: '/reels' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: UserIcon, label: 'Profile', path: `/profile/${user?.id}` },
  ];

  const getMediaUrl = (url: string) => url?.startsWith('/') ? `${API_URL}${url}` : url;

  return (
    <div className="social-sidebar-left page-transition" style={{ borderRight: '1px solid var(--glass-border-bright)', background: 'var(--bg-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem', padding: '0 0.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{
          width: '42px', height: '42px', background: 'var(--accent-gradient)',
          borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--accent-glow)'
        }}>
          <MessageSquare color="white" size={22} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '900', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          PRO MAX
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.label}
              className={`nav-item magnetic-item ${isActive ? 'active glass-card-hover' : ''}`}
              onClick={() => navigate(item.path)}
              style={{ 
                animationDelay: `${index * 0.05}s`,
                background: isActive ? 'var(--glass-bg-bright)' : 'transparent',
                boxShadow: isActive ? 'var(--glass-shadow-bright)' : 'none',
                border: isActive ? '1px solid var(--glass-border-bright)' : '1px solid transparent',
              }}
            >
              <item.icon size={24} style={{ 
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                strokeWidth: isActive ? 2.5 : 2
              }} className={isActive ? 'icon-pulse' : ''} />
              <span style={{ 
                fontWeight: isActive ? '900' : '500',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                letterSpacing: isActive ? '-0.02em' : 'normal'
              }}>{item.label}</span>
              {isActive && <div className="active-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', marginLeft: 'auto', boxShadow: '0 0 10px var(--accent-primary)' }}></div>}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '2rem' }}>
        <div className="nav-item" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={24} color="var(--text-secondary)" /> : <Sun size={24} color="var(--text-secondary)" />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
        <div className="nav-item" onClick={() => navigate('/settings')}>
          <Settings size={24} color="var(--text-secondary)" />
          <span>Settings</span>
        </div>
        
        {user && (
          <div className="nav-item" style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }} onClick={() => navigate(`/profile/${user.id}`)}>
             <img src={getMediaUrl(user.avatar)} alt="Me" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border-bright)' }} />
             <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{user.name}</span>
               <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>View Profile</span>
             </div>
          </div>
        )}

        <div className="nav-item" onClick={logout} style={{ color: 'var(--error)', marginTop: '0.5rem' }}>
          <LogOut size={24} />
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
