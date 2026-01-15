import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Map, Shield, Users, ArrowRight } from 'lucide-react';
import heroImage from '../assets/home-hero.png';

const HomePage = ({ onNavigate }) => {
  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="glass-card" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '40px', 
        padding: '60px',
        marginBottom: '40px',
        flexWrap: 'wrap-reverse' 
      }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <div style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            background: 'rgba(100, 100, 255, 0.1)', 
            border: '1px solid rgba(100, 100, 255, 0.2)', 
            borderRadius: '20px', 
            color: 'hsl(var(--primary))',
            fontWeight: '600',
            marginBottom: '24px',
            fontSize: '0.9rem'
          }}>
            AI-Powered Accessible Navigation
          </div>
          <h1 style={{ 
            fontSize: '3rem', 
            lineHeight: '1.1', 
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #fff, hsl(var(--primary)))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Navigate the World Without Limits
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'hsl(var(--text-muted))', 
            marginBottom: '32px', 
            lineHeight: '1.6' 
          }}>
            AccessNav is designed to empower mobility-impaired users with safe, customized routing. 
            We analyze real-time data to avoid obstacles like stairs, steep slopes, and construction, 
            providing you with the most accessible path every time.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn-primary" onClick={() => onNavigate('navigation')} style={{ width: 'auto', padding: '16px 32px' }}>
              Start Navigation <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: '1', minWidth: '300px', display: 'flex', justifyContent: 'center' }}>
          <img 
            src={heroImage} 
            alt="Accessible Navigation Illustration" 
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              maxHeight: '400px',
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))'
            }} 
          />
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <FeatureCard 
          icon={<Map size={32} color="hsl(var(--secondary))" />}
          title="Customized Routing"
          description="Routes adapted to your specific mobility profile—whether you use a wheelchair, walker, or cane."
        />
        <FeatureCard 
          icon={<Shield size={32} color="hsl(var(--accent))" />}
          title="Real-time Safety"
          description="Live alerts for temporary hazards, construction zones, and crowd density to keep you safe."
        />
        <FeatureCard 
          icon={<Users size={32} color="hsl(var(--success))" />}
          title="Community Driven"
          description="Crowdsourced updates from fellow users help keep the map accurate for everyone."
        />
      </div>

      {/* FAQ Section */}
      <div className="glass-card">
        <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '2rem' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FAQItem 
            question="How does AccessNav determine the best route?" 
            answer="We combine standard map data with accessibility layers (curb cuts, slope gradients) and real-time user reports to calculate the safest path based on your selected mobility profile."
          />
          <FAQItem 
            question="Can I report a new obstacle?" 
            answer="Yes! While navigating, you can use the 'Report Hazard' button to instantly flag obstacles like broken elevators or sidewalk construction. This helps the entire community."
          />
          <FAQItem 
            question="Does it work offline?" 
            answer="Currently, AccessNav requires an active internet connection to provide real-time updates and dynamic rerouting, but we are working on offline maps for the future."
          />
           <FAQItem 
            question="Is it compatible with screen readers?" 
            answer="Absolutely. We follow WCAG 2.1 guidelines to ensure full compatibility with screen readers and assistive technologies."
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div style={{ 
    padding: '32px', 
    background: 'rgba(255, 255, 255, 0.03)', 
    border: '1px solid rgba(255, 255, 255, 0.05)', 
    borderRadius: '16px',
    transition: 'transform 0.2s' 
  }}>
    <div style={{ marginBottom: '20px' }}>{icon}</div>
    <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>{title}</h3>
    <p style={{ color: 'hsl(var(--text-muted))', lineHeight: '1.5' }}>{description}</p>
  </div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      onClick={() => setIsOpen(!isOpen)}
      style={{ 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: '12px', 
        overflow: 'hidden',
        cursor: 'pointer',
        background: isOpen ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        transition: 'background 0.2s'
      }}
    >
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>{question}</h4>
        {isOpen ? <ChevronUp size={20} color="hsl(var(--primary))" /> : <ChevronDown size={20} color="hsl(var(--text-muted))" />}
      </div>
      {isOpen && (
        <div style={{ padding: '0 20px 20px 20px', color: 'hsl(var(--text-muted))', lineHeight: '1.6' }}>
          {answer}
        </div>
      )}
    </div>
  );
};

export default HomePage;
