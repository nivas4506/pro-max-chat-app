import React, { useState } from 'react';
import { Mail, Lock, User, Phone, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const { login: onLogin } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupData, setSignupData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error || 'Google login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  // Get the latest generated 3D illustration
  const illustrationUrl = '/auth_illustration.png';

  return (
    <div className="auth-page page-transition">
      <div className={`auth-container ${isSignup ? 'signup-mode' : ''}`}>
        <div className="forms-container">
          {/* Login Side */}
          <div className="auth-side login-side">
            <div className="auth-card">
              <div className="auth-header">
                <h1>Welcome Back</h1>
                <p>Sign in to access your secure messages</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin 
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login Failed')}
                  theme="outline"
                  shape="pill"
                  width="100%"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-tertiary)' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                <span style={{ padding: '0 10px', fontSize: '0.8rem' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <div className="input-group">
                  <i><Mail size={18} /></i>
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required 
                  />
                </div>

                <div className="input-group">
                  <i><Lock size={18} /></i>
                  <input 
                    type="password" 
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required 
                  />
                </div>

                <button type="submit" className="auth-btn magnetic-item" disabled={loading} style={{ position: 'relative', overflow: 'hidden' }}>
                  {loading ? 'Processing...' : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      Sign In <LogIn size={18} />
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Signup Side */}
          <div className="auth-side signup-side">
            <div className="auth-card">
              <div className="auth-header">
                <h1>Create Account</h1>
                <p>Join the next generation of messaging</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin 
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login Failed')}
                  theme="outline"
                  shape="pill"
                  width="100%"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-tertiary)' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                <span style={{ padding: '0 10px', fontSize: '0.8rem' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
              </div>

              <form onSubmit={handleSignup} className="auth-form">
                <div className="input-group">
                  <i><User size={18} /></i>
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={signupData.name}
                    onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                    required 
                  />
                </div>

                <div className="input-group">
                  <i><Phone size={18} /></i>
                  <input 
                    type="tel" 
                    placeholder="Phone Number"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                    required 
                  />
                </div>

                <div className="input-group">
                  <i><Mail size={18} /></i>
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    value={signupData.email}
                    onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                    required 
                  />
                </div>

                <div className="input-group">
                  <i><Lock size={18} /></i>
                  <input 
                    type="password" 
                    placeholder="Create Password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                    required 
                  />
                </div>

                <button type="submit" className="auth-btn magnetic-item" disabled={loading}>
                  {loading ? 'Processing...' : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      Get Started <UserPlus size={18} />
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="overlay-container">
          <div className="overlay vibrant-bg">
            <img src={illustrationUrl} alt="3D Illustration" className="overlay-img float-animation" />
            <div className="overlay-panel overlay-left glass-panel-premium">
              <h1 className="text-focus-in text-glow" style={{ animationDelay: '0.2s' }}>Hello there!</h1>
              <p className="text-focus-in" style={{ animationDelay: '0.4s' }}>Already have an account? Sign in and continue your conversations.</p>
              <button className="ghost-btn magnetic-item shimmer-glint" onClick={() => setIsSignup(false)}>
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-right glass-panel-premium">
              <h1 className="text-focus-in text-glow" style={{ animationDelay: '0.2s' }}>Join Us!</h1>
              <p className="text-focus-in" style={{ animationDelay: '0.4s' }}>Experience the most secure and beautifully designed chat app in the world.</p>
              <button className="ghost-btn magnetic-item shimmer-glint" onClick={() => setIsSignup(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
