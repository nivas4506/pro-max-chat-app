import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, apiFetch, API_URL } from '../context/AuthContext';
import { Settings, Grid, Film, Bookmark, Heart, MessageCircle, PlusSquare, Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', username: '', bio: '', website: '' });
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !id || id === String(currentUser?.id);
  const profileId = isOwnProfile ? 'me' : id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          apiFetch(`/api/users/${profileId}`),
          apiFetch(`/api/users/${profileId}/posts`)
        ]);
        const profileData = await profileRes.json();
        const postsData = await postsRes.json();
        
        setProfile(profileData);
        setPosts(postsData.posts || []);
        setEditData({ 
          name: profileData.name || '', 
          username: profileData.username || '', 
          bio: profileData.bio || '', 
          website: profileData.website || '' 
        });
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, [profileId]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (profile.is_following) {
        await apiFetch(`/api/users/${profile.id}/follow`, { method: 'DELETE' });
        setProfile((p: any) => ({ ...p, is_following: false, follower_count: p.follower_count - 1 }));
      } else {
        await apiFetch(`/api/users/${profile.id}/follow`, { method: 'POST' });
        setProfile((p: any) => ({ ...p, is_following: true, follower_count: p.follower_count + 1 }));
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await apiFetch('/api/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify(editData)
      });
      const data = await res.json();
      setProfile((p: any) => ({ ...p, ...data }));
      setEditing(false);
    } catch (e) { console.error(e); }
  };

  const getMediaUrl = (url: string) => url?.startsWith('/') ? `${API_URL}${url}` : url;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%' }}>
      <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
    </div>
  );

  if (!profile) return (
    <div className="social-main-feed" style={{ textAlign: 'center', padding: '5rem' }}>
      <h2 style={{ color: 'var(--text-secondary)' }}>User not found</h2>
      <button className="btn-premium" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>Return Home</button>
    </div>
  );

  return (
    <div className="social-main-feed page-transition" style={{ maxWidth: '935px', padding: '2rem 1.5rem' }}>
      {/* Header with Glass Card */}
      <div className="profile-header-card" style={{
        display: 'flex', 
        gap: '4rem', 
        marginBottom: '3rem', 
        alignItems: 'center',
        padding: '2.5rem',
        borderRadius: '24px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border-bright)',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ position: 'relative' }}>
          <img src={getMediaUrl(profile.avatar)} alt={profile.name} className="avatar-premium"
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent-primary)', padding: '4px' }} />
          {isOwnProfile && (
            <div className="avatar-edit-overlay">
              <Settings size={20} color="white" />
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
              {profile.username || profile.name}
              {profile.follower_count > 100 && (
                <span className="premium-badge" style={{ 
                  background: 'var(--accent-primary)', color: 'white', fontSize: '0.65rem', 
                  padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold', marginLeft: '10px'
                }}>PRO</span>
              )}
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {isOwnProfile ? (
                <>
                  <button className="btn-premium" onClick={() => setEditing(!editing)} style={{ padding: '8px 24px' }}>
                    {editing ? 'Cancel' : 'Edit Profile'}
                  </button>
                  <button className="btn-premium" style={{ padding: '8px 12px', background: 'var(--bg-tertiary)' }} onClick={() => navigate('/settings')}>
                    <Settings size={18} />
                  </button>
                </>
              ) : (
                <button className={`btn-premium ${profile.is_following ? 'btn-secondary' : ''}`} onClick={handleFollow} style={{ padding: '8px 32px' }}>
                  {profile.is_following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '3rem', marginBottom: '1.5rem' }}>
            <div className="profile-stat"><strong>{profile.post_count || 0}</strong><span>posts</span></div>
            <div className="profile-stat"><strong>{profile.follower_count || 0}</strong><span>followers</span></div>
            <div className="profile-stat"><strong>{profile.following_count || 0}</strong><span>following</span></div>
          </div>

          {editing ? (
            <div className="profile-edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
              <input value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                placeholder="Name" className="input-premium" />
              <input value={editData.username} onChange={e => setEditData(p => ({ ...p, username: e.target.value }))}
                placeholder="Username" className="input-premium" />
              <textarea value={editData.bio} onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))}
                placeholder="Bio" rows={3} className="input-premium" style={{ resize: 'none' }} />
              <input value={editData.website} onChange={e => setEditData(p => ({ ...p, website: e.target.value }))}
                placeholder="Website" className="input-premium" />
              <button className="btn-premium" onClick={handleSaveProfile} style={{ marginTop: '0.5rem' }}>Save Changes</button>
            </div>
          ) : (
            <div className="profile-info-content">
              <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>{profile.name}</p>
              {profile.bio && <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{profile.bio}</p>}
              {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="profile-link">{profile.website}</a>}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs" style={{ display: 'flex', borderTop: '1px solid var(--glass-border-bright)', justifyContent: 'center', gap: '4rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'posts', icon: Grid, label: 'POSTS' },
          { key: 'reels', icon: Film, label: 'REELS' },
          { key: 'saved', icon: Bookmark, label: 'SAVED' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`profile-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
          >
            <tab.icon size={16} /> <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Post Grid */}
      <div className="profile-post-grid">
        {posts.map((post, idx) => (
          <div key={post.id} className="profile-post-item" style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => navigate(`/post/${post.id}`)}>
            {post.thumbnail ? (
              <img src={getMediaUrl(post.thumbnail.media_url)} alt="" className="profile-post-img" />
            ) : (
              <div className="profile-post-placeholder">
                <Grid size={32} color="var(--text-tertiary)" />
              </div>
            )}
            <div className="profile-post-overlay">
              <div className="overlay-stats">
                <span className="stat-badge"><Heart size={20} fill="white" /> {post.like_count}</span>
                <span className="stat-badge"><MessageCircle size={20} fill="white" /> {post.comment_count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && !editing && (
        <div className="profile-empty-state" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
             <PlusSquare size={40} color="var(--text-tertiary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>No posts yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>When you share photos, they'll appear here.</p>
          {isOwnProfile && <button className="btn-premium" onClick={() => navigate('/create')}>Share your first photo</button>}
        </div>
      )}

      <style>{`
        .profile-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .profile-stat strong {
          font-size: 1.1rem;
          color: var(--text-primary);
        }
        .profile-stat span {
          font-size: 0.85rem;
          color: var(--text-tertiary);
          text-transform: lowercase;
        }
        .profile-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1.25rem 0;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: var(--text-tertiary);
          border-top: 2px solid transparent;
          transition: all 0.3s ease;
          opacity: 0.6;
        }
        .profile-tab-btn.active {
          color: var(--text-primary);
          border-top-color: var(--text-primary);
          opacity: 1;
        }
        .profile-tab-btn span {
          margin-top: 1px;
        }
        .profile-post-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .profile-post-item {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          background: var(--bg-tertiary);
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .profile-post-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .profile-post-item:hover .profile-post-img {
          transform: scale(1.1);
        }
        .profile-post-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
        }
        .profile-post-item:hover .profile-post-overlay {
          opacity: 1;
        }
        .profile-post-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-link {
          color: var(--accent-primary);
          font-weight: 600;
          text-decoration: none;
          font-size: 0.9rem;
          display: inline-block;
          margin-top: 0.5rem;
        }
        .profile-link:hover {
          text-decoration: underline;
        }
        .input-premium {
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border-bright);
          border-radius: 10px;
          color: var(--text-primary);
          outline: none;
          transition: all 0.3s ease;
        }
        .input-premium:focus {
          border-color: var(--accent-primary);
          background: var(--bg-primary);
        }
        .avatar-edit-overlay {
          position: absolute;
          bottom: 5px;
          right: 5px;
          background: var(--accent-primary);
          padding: 6px;
          border-radius: 50%;
          border: 3px solid var(--bg-primary);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        @media (max-width: 768px) {
          .profile-header-card {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
            padding: 1.5rem;
          }
          .profile-post-grid {
            gap: 4px;
            grid-template-columns: repeat(3, 1fr);
          }
          .profile-post-item {
            border-radius: 0;
          }
          .profile-stat span {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;

