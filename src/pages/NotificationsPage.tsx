import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_URL } from '../context/AuthContext';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiFetch('/api/notifications');
        const data = await res.json();
        setNotifications(data || []);
        await apiFetch('/api/notifications/read-all', { method: 'PUT' });
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, []);

  const getMediaUrl = (url: string) => url?.startsWith('/') ? `${API_URL}${url}` : url;

  const getNotifText = (n: any) => {
    switch (n.type) {
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'follow': return 'started following you';
      case 'follow_request': return 'requested to follow you';
      case 'mention': return 'mentioned you';
      case 'story_reply': return 'replied to your story';
      default: return 'interacted with you';
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} fill="#ef4444" color="#ef4444" />;
      case 'comment': return <MessageCircle size={16} color="var(--accent-primary)" />;
      case 'follow': case 'follow_request': return <UserPlus size={16} color="var(--accent-primary)" />;
      default: return null;
    }
  };

  const timeAgo = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <div className="social-main-feed" style={{ maxWidth: '600px' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border-bright)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Notifications</h2>
      </div>

      {loading && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</p>}

      {!loading && notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>
          <h3>No notifications yet</h3>
          <p>When someone interacts with you, it will show up here</p>
        </div>
      )}

      {notifications.map(n => (
        <div key={n.id}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--glass-border-bright)', cursor: 'pointer',
            background: n.is_read ? 'transparent' : 'var(--bg-secondary)',
            transition: 'background 0.15s'
          }}
          onClick={() => {
            if (n.reference_type === 'user') navigate(`/profile/${n.actor_id}`);
            else if (n.reference_type === 'post') navigate('/');
          }}>
          <img src={getMediaUrl(n.actor_avatar)} alt="" className="avatar" style={{ margin: 0, width: '44px', height: '44px' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.9rem' }}>
              <strong>{n.actor_name}</strong> {getNotifText(n)}
            </p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{timeAgo(n.created_at)}</span>
          </div>
          {getNotifIcon(n.type)}
        </div>
      ))}
    </div>
  );
};

export default NotificationsPage;
