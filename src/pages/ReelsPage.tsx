import { useState, useEffect, useRef } from 'react';
import { apiFetch, API_URL } from '../context/AuthContext';
import { Heart, MessageCircle, Play, Volume2, Share2, MoreHorizontal } from 'lucide-react';

const ReelsPage = () => {
  const [reels, setReels] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const res = await apiFetch('/api/reels');
        const data = await res.json();
        setReels(data.reels || []);
      } catch (e) { console.error(e); }
    };
    fetchReels();
  }, []);

  const handleLike = async (reelId: number, isLiked: boolean) => {
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const res = await apiFetch(`/api/reels/${reelId}/like`, { method });
      const data = await res.json();
      setReels(prev => prev.map(r => r.id === reelId ? { ...r, is_liked: data.liked, like_count: data.count } : r));
    } catch (e) { console.error(e); }
  };

  const handleFollow = async (userId: number) => {
    try {
      await apiFetch(`/api/users/${userId}/follow`, { method: 'POST' });
      setReels(prev => prev.map(r => r.user_id === userId ? { ...r, is_following: true } : r));
    } catch (e) { console.error(e); }
  };

  const getMediaUrl = (url: string) => url?.startsWith('/') ? `${API_URL}${url}` : url;

  return (
    <div className="reels-page-wrapper">
      <div className="reels-container" ref={containerRef}>
        {reels.length === 0 && (
          <div className="no-reels-placeholder">
            <div className="placeholder-content">
              <div className="icon-pulse">
                <Play size={48} />
              </div>
              <h3>Explore Reels</h3>
              <p>Be the first to create a reel!</p>
              <button className="create-reel-btn">Create Reel</button>
            </div>
          </div>
        )}

        {reels.map((reel, idx) => (
          <div key={reel.id} className="reel-item">
            {/* Background / Video Layer */}
            <div 
              className="reel-video-container"
              style={{
                background: `linear-gradient(to bottom, hsl(${idx * 45}, 70%, 15%), #000)`,
              }}
            >
              <div className="video-placeholder-overlay">
                <Play size={64} className="play-hint-icon" />
              </div>
              {reel.video_url && (
                <video 
                  src={getMediaUrl(reel.video_url)} 
                  className="reel-actual-video"
                  loop
                  muted
                  playsInline
                />
              )}
            </div>

            {/* Bottom Content Overlay */}
            <div className="reel-overlay-content">
              <div className="reel-info-section">
                <div className="reel-user-row">
                  <div className="avatar-ring-premium">
                    <img src={getMediaUrl(reel.avatar)} alt={reel.user_name} className="reel-user-avatar" />
                  </div>
                  <span className="reel-username">{reel.user_name}</span>
                  {!reel.is_following && (
                    <button className="reel-follow-btn" onClick={() => handleFollow(reel.user_id)}>Follow</button>
                  )}
                </div>
                
                <div className="reel-caption-container">
                  <p className="reel-caption">{reel.caption}</p>
                </div>

                {reel.audio_name && (
                  <div className="reel-audio-track">
                    <div className="audio-marquee">
                      <Volume2 size={14} />
                      <span>{reel.audio_name} • Original Audio</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Side Actions */}
            <div className="reel-side-actions">
              <div className="action-item-group">
                <button 
                  className={`action-btn ${reel.is_liked ? 'liked' : ''}`}
                  onClick={() => handleLike(reel.id, !!reel.is_liked)}
                >
                  <Heart size={28} fill={reel.is_liked ? '#ff3040' : 'none'} color={reel.is_liked ? '#ff3040' : 'white'} />
                </button>
                <span className="action-count">{reel.like_count || 0}</span>
              </div>

              <div className="action-item-group">
                <button className="action-btn">
                  <MessageCircle size={28} color="white" />
                </button>
                <span className="action-count">{reel.comment_count || 0}</span>
              </div>

              <div className="action-item-group">
                <button className="action-btn">
                  <Share2 size={28} color="white" />
                </button>
              </div>

              <div className="action-item-group">
                <button className="action-btn">
                  <MoreHorizontal size={28} color="white" />
                </button>
              </div>

              <div className="reel-audio-disc-container">
                <div className="spinning-audio-disc">
                   <img src={getMediaUrl(reel.avatar)} alt="" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .reels-page-wrapper {
          height: 100vh;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          background: #000;
          position: relative;
          overflow: hidden;
        }

        .reels-container {
          height: 100%;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          -webkit-overflow-scrolling: touch;
        }

        .reels-container::-webkit-scrollbar {
          display: none;
        }

        .reel-item {
          height: 100vh;
          width: 100%;
          scroll-snap-align: start;
          position: relative;
          background: #000;
        }

        .reel-video-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .video-placeholder-overlay {
          position: absolute;
          z-index: 1;
          opacity: 0.3;
        }

        .reel-actual-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .reel-overlay-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 100px 16px 24px;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          pointer-events: none;
        }

        .reel-info-section {
          pointer-events: auto;
        }

        .reel-user-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .avatar-ring-premium {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }

        .reel-user-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #000;
        }

        .reel-username {
          color: #fff;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .reel-follow-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.4);
          color: #fff;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reel-follow-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: #fff;
        }

        .reel-caption {
          color: #fff;
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 12px;
          max-width: 85%;
        }

        .reel-audio-track {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-size: 0.85rem;
          background: rgba(255,255,255,0.1);
          padding: 4px 12px;
          border-radius: 12px;
          width: fit-content;
          max-width: 200px;
          overflow: hidden;
        }

        .audio-marquee {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .reel-side-actions {
          position: absolute;
          right: 12px;
          bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          z-index: 10;
        }

        .action-item-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .action-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          transition: transform 0.2s;
        }

        .action-btn:active {
          transform: scale(0.8);
        }

        .action-count {
          color: #fff;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .reel-audio-disc-container {
          margin-top: 10px;
        }

        .spinning-audio-disc {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 4px solid #333;
          animation: spin 3s linear infinite;
          overflow: hidden;
        }

        .spinning-audio-disc img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .no-reels-placeholder {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
        }

        .placeholder-content {
          text-align: center;
          padding: 24px;
        }

        .icon-pulse {
          animation: pulse 2s infinite;
          margin-bottom: 16px;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.5; }
        }

        .create-reel-btn {
          margin-top: 20px;
          background: #fff;
          color: #000;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ReelsPage;

