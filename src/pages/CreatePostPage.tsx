import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../context/AuthContext';
import { Image, Video, MapPin, Hash, X, ArrowLeft } from 'lucide-react';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isStory = searchParams.get('type') === 'story';
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected]);
    selected.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      if (isStory) {
        formData.append('media', files[0]);
        formData.append('caption', caption);
        await apiFetch('/api/stories', { method: 'POST', body: formData });
      } else {
        files.forEach(f => formData.append('media', f));
        formData.append('caption', caption);
        formData.append('location', location);
        await apiFetch('/api/posts', { method: 'POST', body: formData });
      }
      navigate('/');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="social-main-feed" style={{ maxWidth: '700px' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border-bright)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', padding: 0 }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            {isStory ? 'New Story' : 'Create New Post'}
          </h2>
        </div>
        <button className="follow-btn" onClick={handleSubmit} disabled={loading || files.length === 0}
          style={{ opacity: files.length === 0 ? 0.5 : 1 }}>
          {loading ? 'Posting...' : isStory ? 'Share Story' : 'Share'}
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* File Upload Area */}
        {previews.length === 0 ? (
          <div onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--glass-border-bright)', borderRadius: '16px',
              padding: '4rem 2rem', textAlign: 'center', cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <Image size={48} color="var(--text-tertiary)" />
              <Video size={48} color="var(--text-tertiary)" />
            </div>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Drag photos and videos here
            </h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>or click to select files</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: previews.length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '8px', marginBottom: '1.5rem' }}>
            {previews.map((p, i) => (
              <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                <img src={p} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                <button onClick={() => removeFile(i)}
                  style={{
                    position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)',
                    border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}>
                  <X size={16} color="white" />
                </button>
              </div>
            ))}
            {!isStory && (
              <div onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed var(--glass-border-bright)', borderRadius: '12px',
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-tertiary)'
                }}>
                <Image size={32} />
              </div>
            )}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*,video/*" multiple={!isStory}
          onChange={handleFiles} style={{ display: 'none' }} />

        {/* Caption */}
        <div style={{ marginTop: '1.5rem' }}>
          <textarea value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="Write a caption..." rows={4}
            style={{
              width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border-bright)',
              background: 'var(--bg-secondary)', resize: 'none', fontSize: '0.95rem', outline: 'none',
              fontFamily: 'inherit', color: 'var(--text-primary)'
            }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', textAlign: 'right' }}>
            {caption.length}/2200
          </p>
        </div>

        {/* Location */}
        {!isStory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0', borderTop: '1px solid var(--glass-border-bright)', marginTop: '1rem' }}>
            <MapPin size={20} color="var(--text-tertiary)" />
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Add location"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem' }} />
          </div>
        )}

        {/* Hashtag hint */}
        {caption.includes('#') && (
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
              <Hash size={16} />
              <span>Hashtags will be automatically indexed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePostPage;
