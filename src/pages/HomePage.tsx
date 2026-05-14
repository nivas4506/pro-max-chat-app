import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiFetch, API_URL } from '../context/AuthContext';
import { 
  Search, Bell, Plus, Heart, MessageCircle, Share2, Bookmark,
  MoreVertical, Loader2, PlusSquare, LogOut
} from 'lucide-react';

const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  
  const [scrollProgress, setScrollProgress] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (feedRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(progress);
    }
  };

  const scrollToTop = () => {
    feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchFeed = useCallback(async (pageNum: number) => {
    if (pageNum > 1) setIsFetchingMore(true);
    else setLoading(true);
    
    try {
      const res = await apiFetch(`/api/posts?page=${pageNum}&limit=5`);
      const data = await res.json();
      const newPosts = data.posts || [];
      
      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === 5);
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  const fetchStories = async () => {
    try {
      const res = await apiFetch('/api/stories');
      const data = await res.json();
      setStories(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await apiFetch('/api/users/suggestions/list');
      const data = await res.json();
      setSuggestions(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchTrends = async () => {
    try {
      const res = await apiFetch('/api/search/hashtags?q=');
      const data = await res.json();
      setTrends((data || []).slice(0, 5));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    if (user) {
      fetchFeed(1);
      fetchStories(); 
      fetchSuggestions(); 
      fetchTrends();
    }
  }, [user, fetchFeed]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, loading]);

  useEffect(() => {
    if (page > 1) {
      fetchFeed(page);
    }
  }, [page, fetchFeed]);

  const handleLike = async (postId: number, isLiked: boolean) => {
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const res = await apiFetch(`/api/posts/${postId}/like`, { method });
      const data = await res.json();
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: data.liked, like_count: data.count } : p));
    } catch (e) { console.error(e); }
  };

  const handleBookmark = async (postId: number, isBookmarked: boolean) => {
    try {
      const method = isBookmarked ? 'DELETE' : 'POST';
      await apiFetch(`/api/posts/${postId}/bookmark`, { method });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_bookmarked: !isBookmarked } : p));
    } catch (e) { console.error(e); }
  };

  const handleComment = async (postId: number) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;
    try {
      await apiFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
    } catch (e) { console.error(e); }
  };

  const handleFollow = async (userId: number) => {
    try {
      await apiFetch(`/api/users/${userId}/follow`, { method: 'POST' });
      setSuggestions(prev => prev.filter(s => s.id !== userId));
    } catch (e) { console.error(e); }
  };

  const getMediaUrl = (url: string) => url?.startsWith('/') ? `${API_URL}${url}` : url;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [posts]);

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%' }}>
      <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
    </div>
  );

  return (
    <>
      <div className="social-main-feed page-transition" ref={feedRef} onScroll={handleScroll}>
        {/* Top Navbar */}
        <div className="top-navbar">
          <div className="search-bar" style={{ width: '300px', margin: 0, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border-bright)' }}
            onClick={() => navigate('/explore')}>
            <Search size={18} color="var(--text-tertiary)" />
            <input type="text" placeholder="Search..." style={{ background: 'transparent' }} readOnly />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="icon-btn magnetic-item" style={{ background: 'transparent', border: '1px solid var(--glass-border-bright)' }}
              onClick={() => navigate('/notifications')}>
              <Bell size={20} color="var(--text-primary)" />
            </button>
            <button className="icon-btn magnetic-item" style={{ background: 'transparent', border: '1px solid var(--glass-border-bright)', color: 'var(--error)' }}
              onClick={logout} title="Logout">
              <LogOut size={20} />
            </button>
            <div className="avatar-premium magnetic-item" style={{ width: '40px', height: '40px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${user.id}`)}>
              <img src={getMediaUrl(user.avatar)} alt="Profile" className="avatar"
                style={{ width: '100%', height: '100%', margin: 0, border: '2px solid var(--bg-primary)' }} />
            </div>
          </div>
        </div>

        {/* Scroll Progress Bar */}
        <div className="scroll-progress-container">
          <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }}></div>
        </div>

        {/* Back to Top Button */}
        {scrollProgress > 10 && (
          <button 
            className="back-to-top magnetic-item box-glow" 
            onClick={scrollToTop}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: 'calc(20% + 2rem)',
              zIndex: 100,
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              animation: 'slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <PlusSquare size={24} color="white" style={{ transform: 'rotate(45deg)' }} />
          </button>
        )}

        {/* Stories */}
        <div className="stories-container" style={{ 
          animation: 'slideDownFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '1.5rem 1rem'
        }}>
          <div className="story-item" onClick={() => navigate('/create?type=story')} style={{ flexShrink: 0 }}>
            <div className="story-avatar-ring viewed" style={{ position: 'relative', background: 'var(--bg-tertiary)' }}>
              <img src={getMediaUrl(user.avatar)} alt="Your Story" className="story-avatar" style={{ filter: 'grayscale(0.5)' }} />
              <div style={{
                position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--accent-gradient)',
                borderRadius: '50%', width: '22px', height: '22px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-primary)', color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <Plus size={14} strokeWidth={3} />
              </div>
            </div>
            <span className="story-username" style={{ fontWeight: '600' }}>You</span>
          </div>
          {stories.map((storyGroup: any, idx) => (
            storyGroup.user_id !== user.id && (
              <div key={storyGroup.user_id} className="story-item stagger-item" style={{ animationDelay: `${idx * 0.05}s`, flexShrink: 0 }}>
                <div className={`story-avatar-ring ${!storyGroup.has_unviewed ? 'viewed' : ''}`} 
                  style={{ background: !storyGroup.has_unviewed ? 'var(--bg-tertiary)' : 'var(--accent-gradient)' }}>
                  <img src={getMediaUrl(storyGroup.avatar)} alt={storyGroup.user_name} className="story-avatar" style={{ border: '2px solid var(--bg-primary)' }} />
                </div>
                <span className="story-username">{storyGroup.user_name?.split(' ')[0]}</span>
              </div>
            )
          ))}
        </div>

        {/* Posts */}
        <div className="posts-container" style={{ paddingBottom: '2rem' }}>
          {loading && posts.length === 0 && (
            <div style={{ padding: '1rem' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="post-card glass-card shimmer" style={{ 
                  height: '500px', marginBottom: '2rem', borderRadius: '16px', opacity: 0.5 
                }} />
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
              }}>
                <Plus size={32} color="var(--text-tertiary)" />
              </div>
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Your feed is empty</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
                Follow people or create your first post to start seeing updates in your feed.
              </p>
              <button className="follow-btn btn-premium" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/create')}>Create Post</button>
            </div>
          )}

          {posts.map((post, index) => (
            <div key={post.id}>
              {post.is_suggested && (index === 0 || !posts[index-1]?.is_suggested) && (
                <div className="reveal-on-scroll" style={{ padding: '1.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '12px', margin: '1rem', border: '1px solid var(--glass-border-bright)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 className="text-focus-in" style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Suggested for you</h3>
                      <p className="text-focus-in" style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', animationDelay: '0.2s' }}>Based on global trending content</p>
                    </div>
                    <div className="box-glow" style={{ background: 'var(--accent-gradient)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                      TRENDING
                    </div>
                  </div>
                </div>
              )}
              
              <div className="post-card glass-card reveal-on-scroll" style={{ 
                marginBottom: '2rem', borderRadius: '20px', overflow: 'hidden',
                animationDelay: `${(index % 5) * 0.15}s`,
                boxShadow: post.is_suggested ? '0 10px 30px rgba(0,0,0,0.05)' : 'none'
              }}>
                <div className="post-header" style={{ padding: '12px 16px' }}>
                  <div className="post-user-info" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.user_id}`)}>
                    <div className="avatar-premium" style={{ width: '40px', height: '40px' }}>
                      <img src={getMediaUrl(post.avatar)} alt={post.user_name} className="avatar" style={{ width: '100%', height: '100%', margin: 0 }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {post.user_name}
                        {post.is_verified && <div style={{ width: '12px', height: '12px', background: '#0095f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '4px', height: '4px', border: '1.5px solid white', borderTop: 0, borderLeft: 0, transform: 'rotate(45deg)' }}></div></div>}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {post.location || 'Original content'}
                      </span>
                    </div>
                  </div>
                  <button className="icon-btn" style={{ background: 'transparent', padding: 0 }}>
                    <MoreVertical size={20} color="var(--text-secondary)" />
                  </button>
                </div>

                {post.media && post.media.length > 0 && (
                  <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/5', background: '#000' }}>
                    <img src={getMediaUrl(post.media[0].media_url)} alt="Post content" className="post-image"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onDoubleClick={() => !post.is_liked && handleLike(post.id, false)} />
                    {post.is_suggested && (
                      <div style={{ 
                        position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)',
                        color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem',
                        backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        Suggested
                      </div>
                    )}
                  </div>
                )}

                <div className="post-actions" style={{ padding: '12px 16px 8px' }}>
                  <div className="action-icons" style={{ gap: '1rem' }}>
                    <button className="icon-btn" style={{ background: 'transparent', padding: 0, color: post.is_liked ? '#ff3040' : 'var(--text-primary)' }}
                      onClick={() => handleLike(post.id, !!post.is_liked)}>
                      <Heart size={24} fill={post.is_liked ? '#ff3040' : 'none'} strokeWidth={post.is_liked ? 0 : 2} />
                    </button>
                    <button className="icon-btn" style={{ background: 'transparent', padding: 0, color: 'var(--text-primary)' }}>
                      <MessageCircle size={24} />
                    </button>
                    <button className="icon-btn" style={{ background: 'transparent', padding: 0, color: 'var(--text-primary)' }}>
                      <Share2 size={24} />
                    </button>
                  </div>
                  <button className="icon-btn" style={{ background: 'transparent', padding: 0, color: post.is_bookmarked ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                    onClick={() => handleBookmark(post.id, !!post.is_bookmarked)}>
                    <Bookmark size={24} fill={post.is_bookmarked ? 'var(--accent-primary)' : 'none'} />
                  </button>
                </div>

                <div className="post-caption" style={{ padding: '0 16px 16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    {(post.like_count || 0).toLocaleString()} likes
                  </div>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                    <span style={{ fontWeight: '700', marginRight: '6px', color: 'var(--text-primary)' }}>{post.user_name}</span>
                    {post.caption}
                  </p>
                  {post.comment_count > 0 && (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '8px', cursor: 'pointer' }}>
                      View all {post.comment_count} comments
                    </div>
                  )}
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', marginTop: '8px', textTransform: 'uppercase' }}>
                    {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '12px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentTexts[post.id] || ''}
                      onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        fontSize: '0.85rem', color: 'var(--text-primary)', padding: '4px 0'
                      }}
                    />
                    {commentTexts[post.id]?.trim() && (
                      <button className="icon-btn" style={{ background: 'transparent', padding: 0, color: 'var(--accent-primary)', fontWeight: '600', fontSize: '0.85rem' }}
                        onClick={() => handleComment(post.id)}>
                        Post
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Sentinel for Infinite Scroll */}
          <div ref={observerTarget} style={{ height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isFetchingMore && (
              <Loader2 className="animate-spin" size={24} color="var(--accent-primary)" />
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="social-sidebar-right page-transition" style={{ animationDelay: '0.2s' }}>
        <div className="trends-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="trends-header" style={{ marginBottom: 0 }}>Trending Now</h3>
            <div className="shimmer" style={{ width: '20px', height: '20px', borderRadius: '50%', opacity: 0.2 }} />
          </div>
          {trends.length > 0 ? trends.map((trend: any, idx) => (
            <div key={trend.id} className="trend-item stagger-item" style={{ 
              animationDelay: `${idx * 0.1}s`,
              padding: '0.75rem',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}>
              <div className="trend-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                   <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: '700', textTransform: 'uppercase' }}>#{idx + 1} Trending</span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>#{trend.name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{(trend.post_count || 0).toLocaleString()} posts</span>
              </div>
            </div>
          )) : (
            <div className="shimmer" style={{ height: '100px', borderRadius: '12px', opacity: 0.1 }} />
          )}
        </div>

        <div className="suggestions-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="trends-header" style={{ marginBottom: 0 }}>Discover People</h3>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', color: 'var(--accent-primary)', background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '20px' }}
              onClick={() => navigate('/explore')}>See All</span>
          </div>
          {suggestions.map((s: any, idx) => (
            <div key={s.id} className="suggestion-item stagger-item" style={{ animationDelay: `${(idx + 5) * 0.1}s` }}>
              <div className="suggestion-user" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${s.id}`)}>
                <div className="avatar-premium" style={{ width: '38px', height: '38px', padding: '2px' }}>
                  <img src={getMediaUrl(s.avatar)} alt={s.name} className="avatar" style={{ margin: 0, width: '100%', height: '100%' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700' }}>{s.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{s.username ? `@${s.username}` : 'Suggested for you'}</p>
                </div>
              </div>
              <button className="follow-btn btn-premium" style={{ padding: '6px 16px', fontSize: '0.75rem', borderRadius: '10px' }} onClick={() => handleFollow(s.id)}>Follow</button>
            </div>
          ))}
          {suggestions.length === 0 && !loading && (
             <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>You're all caught up!</p>
          )}
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border-bright)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: '1.8' }}>
            About • Help • Press • API • Jobs • Privacy • Terms • Locations • Language • Meta Verified
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1.5rem', fontWeight: '600' }}>© 2026 PRO MAX FROM METAVERSE</p>
        </div>
      </div>
    </>
  );
};

export default HomePage;

