import React, { useState, useEffect } from 'react';
import api from './api';
import { Map, MessageSquare, Bell, User, Radar, Sun, Moon, Home } from 'lucide-react';
import ProfileSetup from './components/ProfileSetup';
import RouteRequest from './components/RouteRequest';
import RouteView from './components/RouteView';
import ChatInterface from './components/ChatInterface';
import AlertsFeed from './components/AlertsFeed';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import HomePage from './components/HomePage';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // home, navigation, chat, alerts, profile
  const [navStep, setNavStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [request, setRequest] = useState(null);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [darkMode, setDarkMode] = useState(true); // Default: Dark Mode

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
          loadSavedRoutes();
        } catch (err) {
          console.error('Failed to restore session', err);
          localStorage.removeItem('token');
        }
      }
    };
    initAuth();
  }, []);

  const loadSavedRoutes = async () => {
    try {
      const { data } = await api.get('/routes');
      setSavedRoutes(data);
    } catch (err) {
      console.error('Failed to load routes', err);
    }
  };

  const handleLogin = (data) => {
    // data should be { user, token }
    setUser(data.user);
    localStorage.setItem('token', data.token);
    setActiveTab('home');
    loadSavedRoutes();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setActiveTab('home');
    setSavedRoutes([]);
    setProfile(null);
  };

  // Navigation Logic
  const handleProfileComplete = (profileData) => {
    setProfile(profileData);
    setUser(prev => ({ ...prev, profile: profileData }));
    setNavStep(2);
  };

  const handleRouteSearch = (requestData) => {
    setRequest(requestData);
    setNavStep(3);
  };

  const handleSaveRoute = async (routeData) => {
    try {
      const { data } = await api.post('/routes', routeData);
      setSavedRoutes(prev => [data, ...prev]);
      alert('Route saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save route.');
    }
  };

  const handleSelectRoute = (savedRoute) => {
    setRequest({ start: savedRoute.start, dest: savedRoute.dest, stops: savedRoute.stops || [] });
  };

  const handleBack = () => {
    setNavStep(2);
    setRequest(null);
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className={`app-container ${!darkMode ? 'light-mode' : ''}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'hsl(var(--bg-dark))', color: 'hsl(var(--text-main))' }}>

      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 40px',
        background: darkMode ? 'rgba(20, 20, 25, 0.8)' : 'hsl(var(--primary))',
        backdropFilter: 'blur(10px)',
        borderBottom: darkMode ? '1px solid rgba(255,255,255,0.05)' : 'none',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: !darkMode ? '0 4px 20px rgba(100, 80, 255, 0.2)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div
          onClick={() => setActiveTab('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          {/* Logo Icon */}
          <div style={{
            width: '32px',
            height: '32px',
            background: darkMode ? 'hsl(var(--primary))' : 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Map size={20} color={darkMode ? "white" : "hsl(var(--primary))"} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em', margin: 0, color: darkMode ? 'white' : 'white' }}>Accessible Nav</h1>
        </div>

        <nav style={{ display: 'flex', gap: '32px' }}>
          <button
            onClick={() => setActiveTab('home')}
            style={{
              background: 'none',
              border: 'none',
              color: !darkMode
                ? (activeTab === 'home' ? 'white' : 'rgba(255,255,255,0.7)')
                : (activeTab === 'home' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))'),
              fontWeight: activeTab === 'home' ? '700' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem'
            }}
          >
            <Home size={18} /> Home
          </button>

          <button
            onClick={() => {
              setActiveTab('navigation');
              if (navStep === 4) {
                if (request) {
                  setNavStep(3);
                } else {
                  setNavStep(2);
                }
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: !darkMode
                ? (activeTab === 'navigation' ? 'white' : 'rgba(255,255,255,0.7)')
                : (activeTab === 'navigation' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))'),
              fontWeight: activeTab === 'navigation' ? '700' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem'
            }}
          >
            <Map size={18} /> Navigation
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              background: 'none',
              border: 'none',
              color: !darkMode
                ? (activeTab === 'chat' ? 'white' : 'rgba(255,255,255,0.7)')
                : (activeTab === 'chat' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))'),
              fontWeight: activeTab === 'chat' ? '700' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem'
            }}
          >
            <MessageSquare size={18} /> AI Assistant
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            style={{
              background: 'none',
              border: 'none',
              color: !darkMode
                ? (activeTab === 'alerts' ? 'white' : 'rgba(255,255,255,0.7)')
                : (activeTab === 'alerts' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))'),
              fontWeight: activeTab === 'alerts' ? '700' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem'
            }}
          >
            <Bell size={18} /> Obstacle Alerts
          </button>
          <button
            onClick={() => {
              setActiveTab('navigation');
              setNavStep(4);
              if (!request) {
                setRequest({ start: 'Current Location', dest: '' });
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: !darkMode
                ? ((activeTab === 'navigation' && navStep === 4) ? 'white' : 'rgba(255,255,255,0.7)')
                : ((activeTab === 'navigation' && navStep === 4) ? 'hsl(var(--danger))' : 'hsl(var(--text-muted))'),
              fontWeight: (activeTab === 'navigation' && navStep === 4) ? '700' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem'
            }}
          >
            <Radar size={18} /> Nearby Hazards
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: activeTab === 'profile' ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="My Profile"
          >
            <User size={18} />
          </button>
          <button
            onClick={handleLogout}
            style={{ fontSize: '0.8rem', background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: (activeTab === 'navigation' && navStep === 3) ? '20px' : '40px',
        maxWidth: (activeTab === 'navigation' && navStep === 3) ? '100%' : '1200px',
        margin: '0 auto'
      }}>
        {activeTab === 'home' && (
          <HomePage onNavigate={setActiveTab} />
        )}

        {activeTab === 'navigation' && (
          <div className="fade-in">
            {navStep === 1 && <ProfileSetup onComplete={handleProfileComplete} savedProfile={user?.profile} />}
            {navStep === 2 && (
              <RouteRequest
                profile={profile}
                onSearch={handleRouteSearch}
                savedRoutes={savedRoutes}
              />
            )}
            {navStep === 3 && <RouteView request={request} profile={profile} onBack={handleBack} onSave={handleSaveRoute} savedRoutes={savedRoutes} onSelect={handleSelectRoute} darkMode={darkMode} />}
            {navStep === 4 && (
              <RouteView
                request={request}
                profile={profile}
                mode="hazards"
                onBack={handleBack}
                onSave={() => { }}
                savedRoutes={savedRoutes}
                onSelect={handleSelectRoute}
                darkMode={darkMode}
              />
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <ChatInterface />
        )}

        {activeTab === 'alerts' && (
          <AlertsFeed />
        )}

        {activeTab === 'profile' && (
          <ProfilePage user={user} />
        )}

      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px 40px',
        textAlign: 'center',
        color: 'hsl(var(--text-muted))',
        fontSize: '0.85rem',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        © 2026 Accessible Navigation AI. Empowering mobility for everyone.
      </footer>

    </div>
  );
}

export default App;
