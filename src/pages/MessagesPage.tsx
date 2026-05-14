import { useState, useEffect, useRef } from 'react';
import { useAuth, apiFetch, API_URL } from '../context/AuthContext';
import { Send, Image, Search } from 'lucide-react';
import { io } from 'socket.io-client';

const MessagesPage = () => {
  const { user, token } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typing, setTyping] = useState(false);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io(API_URL);
    if (user) socketRef.current.emit('join', user.id);

    socketRef.current.on('receive_message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
    });
    socketRef.current.on('user_typing', () => setTyping(true));
    socketRef.current.on('user_stop_typing', () => setTyping(false));

    return () => { socketRef.current?.disconnect(); };
  }, [user]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await apiFetch('/api/users/suggestions/list');
        const data = await res.json();
        setContacts(data || []);
      } catch (e) { console.error(e); }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!selectedChat) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/api/messages/${selectedChat.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setMessages(data || []);
      } catch (e) { console.error(e); }
    };
    fetchMessages();
  }, [selectedChat, token]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !user) return;
    socketRef.current.emit('send_message', {
      text: newMessage, sender_id: user.id, receiver_id: selectedChat.id
    });
    setMessages(prev => [...prev, { text: newMessage, sender_id: user.id, receiver_id: selectedChat.id, created_at: new Date() }]);
    setNewMessage('');
    socketRef.current.emit('stop_typing', { senderId: user.id, receiverId: selectedChat.id });
  };

  const handleTyping = (val: string) => {
    setNewMessage(val);
    if (selectedChat && user) {
      socketRef.current.emit(val ? 'typing' : 'stop_typing', { senderId: user.id, receiverId: selectedChat.id });
    }
  };

  const getMediaUrl = (url: string) => url?.startsWith('/') ? `${API_URL}${url}` : url;

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="social-main-feed page-transition" style={{ display: 'flex', padding: 0, maxWidth: '100%', height: 'calc(100vh - 20px)' }}>
      {/* Chat List */}
      <div style={{ width: '350px', borderRight: '1px solid var(--glass-border-bright)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--glass-border-bright)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Messages</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '0.5rem 0.75rem' }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelectedChat(c)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem',
                cursor: 'pointer', transition: 'background 0.15s',
                background: selectedChat?.id === c.id ? 'var(--bg-secondary)' : 'transparent'
              }}>
              <img src={getMediaUrl(c.avatar)} alt="" className="avatar-premium" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{c.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Tap to start chatting</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
        {selectedChat ? (
          <>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border-bright)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={getMediaUrl(selectedChat.avatar)} alt="" className="avatar-premium" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h4 style={{ fontWeight: '600' }}>{selectedChat.name}</h4>
                {typing && <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>typing...</span>}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {messages.map((msg, i) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={i} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{
                      padding: '0.75rem 1rem', borderRadius: '18px',
                      background: isMine ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      backdropFilter: 'blur(10px)',
                      border: isMine ? 'none' : '1px solid var(--glass-border-bright)',
                      color: isMine ? 'white' : 'var(--text-primary)', fontSize: '0.9rem',
                      borderBottomRightRadius: isMine ? '4px' : '18px',
                      borderBottomLeftRadius: isMine ? '18px' : '4px'
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px', display: 'block', textAlign: isMine ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--glass-border-bright)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button className="icon-btn" style={{ background: 'transparent', padding: 0 }}><Image size={24} color="var(--text-tertiary)" /></button>
              <input type="text" value={newMessage} onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Message..." style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '22px', border: '1px solid var(--glass-border-bright)',
                  background: 'var(--bg-secondary)', outline: 'none', fontSize: '0.9rem'
                }} />
              {newMessage.trim() && (
                <button className="icon-btn" onClick={sendMessage} style={{ background: 'transparent', padding: 0, color: 'var(--accent-primary)' }}>
                  <Send size={24} className="icon-pulse" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--text-tertiary)' }}>
            <h3>Your Messages</h3>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
