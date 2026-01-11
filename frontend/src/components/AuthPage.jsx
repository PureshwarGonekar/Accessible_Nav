import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';
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
        // data = { message, token, user }
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
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'hsl(var(--bg-app))',
      padding: '20px'
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'hsl(var(--primary))', marginBottom: '10px' }}>Accessible Nav</h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>
            {isLogin ? 'Welcome back! Please login.' : 'Create an account to get started.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={18} />
                <input 
                  type="text" 
                  name="name" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input 
                type="email" 
                name="email" 
                placeholder="you@example.com" 
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input 
                type="password" 
                name="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div style={{ color: 'hsl(var(--danger))', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {isLogin ? 'Login' : 'Sign Up'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'hsl(var(--primary))', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
