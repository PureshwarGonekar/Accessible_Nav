import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../api';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // LOGIN LOGIC
        const { data } = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        onLogin(data);
      } else {
        // SIGN UP LOGIC
        if (!formData.name || !formData.email || !formData.password) {
          setError('All fields are required.');
          return;
        }

        const { data } = await api.post('/auth/signup', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        onLogin(data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div className="auth-container">
      {/* Background Blobs */}
      <div className="auth-bg-blob blob-1"></div>
      <div className="auth-bg-blob blob-2"></div>

      <div className="glass-card fade-in-up" style={{ width: '100%', maxWidth: '440px' }}>
        <div className="auth-header">
          <h1 className="auth-title">Accessible Nav</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Welcome back! Please login.' : 'Create an account to get started.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  name="name" 
                  className="input-field"
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={handleChange}
                />
                <User size={20} className="input-icon" />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-wrapper">
              <input 
                type="email" 
                name="email" 
                className="input-field"
                placeholder="you@example.com" 
                value={formData.email}
                onChange={handleChange}
              />
              <Mail size={20} className="input-icon" />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <input 
                type="password" 
                name="password" 
                className="input-field"
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
              />
              <Lock size={20} className="input-icon" />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} style={{ marginRight: '8px' }} />
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary">
            {isLogin ? 'Login' : 'create Account'} <ArrowRight size={20} />
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="btn-link"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
