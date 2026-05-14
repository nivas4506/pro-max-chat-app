import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_URL } from '../context/AuthContext';
import { Search, Heart, MessageCircle, Loader2 } from 'lucide-react';

const ExplorePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'hashtags'>('posts');
  const [results, setResults] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await apiFetch('/api/posts/explore/trending');
        const data = await res.json();
        setTrendingPosts(data.posts || []);
      } catch (e) { console.error(e); }
      setInitialLoading(false);
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/search/${activeTab}?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, activeTab]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('grid-reveal');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const items = document.querySelectorAll('.explore-grid-item');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [trendingPosts, results]);

  const getMediaUrl = (url: string) => url?.startsWith('/') ? `${API_URL}${url}` : url;

  const handleFollow = async (userId: number) => {
    try {
      await apiFetch(`/api/users/${userId}/follow`, { method: 'POST' });
      setResults(prev => prev.map(u => u.id === userId ? { ...u, is_following: true } : u));
    } catch (e) { console.error(e); }
  };

  if (initialLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%' }}>
      <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
    </div>
  );

  return (
    <div className="social-main-feed page-transition" style={{ maxWidth: '935px', padding: 0 }}>
      {/* Search Header */}
      <div style={{ 
        padding: '1rem 1.5rem', 
        position: 'sticky', 
        top: 0, 
        background: 'rgba(var(--bg-primary-rgb), 0.8)', 
        backdropFilter: 'blur(20px)',
        zIndex: 100,
        borderBottom: '1px solid var(--glass-border-bright)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          background: 'var(--bg-secondary)', 
          borderRadius: '10px', 
          padding: '0.6rem 1rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }} className="search-focus-ring">
          <Search size={18} color="var(--text-tertiary)" />
          <input 
            type="text" 
            placeholder="Search" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem', color: 'var(--text-primary)' }} 
          />
        </div>

        {query.trim() && (
          <div className="search-tabs" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {(['posts', 'users', 'hashtags'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.4rem 1.2rem', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: 'pointer',
                  background: activeTab === tab ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                  color: activeTab === tab ? 'var(--bg-primary)' : 'var(--text-secondary)', 
                  fontWeight: '600', 
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {query.trim() ? (
        <div style={{ padding: '1rem 1.5rem' }}>
          {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
               <Loader2 className="animate-spin" size={24} color="var(--accent-primary)" />
             </div>
          ) : (
            <>
              {activeTab === 'users' && results.map((u: any) => (
                <div key={u.id} className="search-result-item" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '10px 0',
                  animation: 'fadeIn 0.3s ease-out forwards'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${u.id}`)}>
                    <img src={getMediaUrl(u.avatar)} alt="" className="avatar avatar-premium" style={{ width: '44px', height: '44px', margin: 0 }} />
                    <div>
                      <h4 style={{ fontWeight: '600', fontSize: '0.9rem' }}>{u.username}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{u.name}</p>
                    </div>
                  </div>
                  {!u.is_following && (
                    <button className="follow-btn btn-premium" style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => handleFollow(u.id)}>Follow</button>
                  )}
                </div>
              ))}

              {activeTab === 'hashtags' && results.map((h: any) => (
                <div key={h.id} className="search-result-item" style={{ padding: '12px 0', borderBottom: '1px solid var(--glass-border-bright)' }}>
                  <h4 style={{ fontWeight: '600', fontSize: '1rem' }}>#{h.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{h.post_count?.toLocaleString()} posts</p>
                </div>
              ))}

              {activeTab === 'posts' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {results.map((p: any) => (
                    <div key={p.id} className="explore-grid-item" onClick={() => navigate(`/post/${p.id}`)}
                      style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden', cursor: 'pointer' }}>
                      {p.media?.[0] && (
                        <img src={getMediaUrl(p.media[0].media_url)} alt=""
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {results.length === 0 && <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-tertiary)' }}>No results found</div>}
            </>
          )}
        </div>
      ) : (
        /* Trending Masonry Grid */
        <div className="explore-grid">
          {trendingPosts.map((post: any, idx: number) => {
            // Instagram-style layout: 1st, 11th, 21st, etc. items are large
            const isLarge = idx % 10 === 0 || idx % 10 === 6;
            
            return (
              <div 
                key={post.id} 
                className={`explore-grid-item ${isLarge ? 'large' : ''}`}
                onClick={() => navigate(`/post/${post.id}`)}
                style={{
                  gridColumn: isLarge ? 'span 2' : 'span 1',
                  gridRow: isLarge ? 'span 2' : 'span 1',
                  opacity: 0, // for reveal animation
                  transform: 'translateY(20px)' // for reveal animation
                }}
              >
                {post.media && post.media[0] && (
                  <img src={getMediaUrl(post.media[0].media_url)} alt="" className="explore-img" />
                )}
                <div className="explore-item-overlay">
                  <div className="overlay-stats">
                    <span className="stat-badge"><Heart size={18} fill="white" /> {post.like_count}</span>
                    <span className="stat-badge"><MessageCircle size={18} fill="white" /> {post.comment_count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: minmax(100px, auto);
          gap: 4px;
          padding: 4px;
        }

        .explore-grid-item {
          position: relative;
          overflow: hidden;
          background: var(--bg-tertiary);
          cursor: pointer;
          aspect-ratio: 1 / 1;
        }

        .explore-grid-item.large {
          aspect-ratio: auto;
        }

        .explore-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .explore-grid-item:hover .explore-img {
          transform: scale(1.05);
        }

        .explore-item-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 2;
        }

        .explore-grid-item:hover .explore-item-overlay {
          opacity: 1;
        }

        .overlay-stats {
          display: flex;
          gap: 20px;
          color: white;
          transform: translateY(10px);
          transition: transform 0.3s ease;
        }

        .explore-grid-item:hover .overlay-stats {
          transform: translateY(0);
        }

        .stat-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 1rem;
        }

        .grid-reveal {
          animation: gridReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes gridReveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .search-focus-ring:focus-within {
          box-shadow: 0 0 0 2px var(--accent-primary);
          background: var(--bg-primary);
        }

        @media (max-width: 768px) {
           .explore-grid {
             grid-template-columns: repeat(3, 1fr);
           }
        }
      `}</style>
    </div>
  );
};

export default ExplorePage;

