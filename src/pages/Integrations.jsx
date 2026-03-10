import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plug, Wifi, WashingMachine, Flame, Dumbbell, Smartphone, Bell, ChevronRight, Zap } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { APP_CONFIG } from '../lib/config';

const INTEGRATIONS = [
  {
    id: 'smart_washer',
    name: 'Washer & Dryer',
    icon: WashingMachine,
    desc: 'Get reminded when your laundry is done. Never forget clothes in the dryer again.',
    status: 'coming_soon',
    brands: ['Samsung SmartThings', 'LG ThinQ', 'Whirlpool'],
  },
  {
    id: 'smart_stove',
    name: 'Stove & Oven',
    icon: Flame,
    desc: 'Get alerts if your stove has been on too long. Peace of mind when you leave the house.',
    status: 'coming_soon',
    brands: ['Samsung SmartThings', 'GE Profile', 'Bosch Home Connect'],
  },
  {
    id: 'fitness_apps',
    name: 'Fitness & Gym',
    icon: Dumbbell,
    desc: 'Connect your gym membership and fitness apps. We\'ll remind you to stay on track.',
    status: 'coming_soon',
    brands: ['Apple Health', 'Google Fit', 'Strava', 'Peloton'],
  },
  {
    id: 'smart_home',
    name: 'Smart Home Hub',
    icon: Wifi,
    desc: 'Connect your smart home hub for unified reminders across all your devices.',
    status: 'coming_soon',
    brands: ['Apple HomeKit', 'Google Home', 'Amazon Alexa', 'SmartThings'],
  },
  {
    id: 'phone_reminders',
    name: 'Phone Reminders',
    icon: Smartphone,
    desc: 'Persistent text and call reminders for your most critical deadlines.',
    status: 'available',
    brands: [],
  },
  {
    id: 'push_notifications',
    name: 'Push Notifications',
    icon: Bell,
    desc: 'Smart, escalating push notifications based on deadline urgency.',
    status: 'available',
    brands: [],
  },
];

export default function Integrations() {
  const [notified, setNotified] = useState(new Set());

  const handleNotify = (id) => {
    setNotified((prev) => new Set(prev).add(id));
  };

  return (
    <div className="integrations-page">
      <PageHeader
        backTo="/dashboard"
        title="Integrations"
        icon={<Plug size={24} />}
      />

      <main className="integrations-main">
        <div className="integrations-container">
          <div className="integrations-hero">
            <Zap size={32} />
            <h2>Your life, connected</h2>
            <p>
              {APP_CONFIG.name} connects to your appliances and apps so you never miss
              what matters — from laundry cycles to visa deadlines.
            </p>
          </div>

          <div className="integrations-grid">
            {INTEGRATIONS.map((int) => {
              const Icon = int.icon;
              const isAvailable = int.status === 'available';
              const wasNotified = notified.has(int.id);

              return (
                <div key={int.id} className={`integration-card ${int.status}`}>
                  <div className="integration-icon">
                    <Icon size={24} />
                  </div>
                  <div className="integration-info">
                    <h3>
                      {int.name}
                      {!isAvailable && <span className="coming-badge">Coming soon</span>}
                    </h3>
                    <p>{int.desc}</p>
                    {int.brands.length > 0 && (
                      <div className="integration-brands">
                        {int.brands.map((b) => (
                          <span key={b} className="brand-tag">{b}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="integration-action">
                    {isAvailable ? (
                      <Link to="/settings" className="btn btn-sm btn-primary">
                        Set up <ChevronRight size={14} />
                      </Link>
                    ) : wasNotified ? (
                      <span className="notified-badge">We'll let you know</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleNotify(int.id)}
                      >
                        Notify me
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="integrations-vision">
            <h3>The vision</h3>
            <p>
              Imagine: your washer texts you "Laundry done — move to dryer."
              Your stove alerts you after 30 minutes. Your gym app syncs your membership renewal date.
              All in one place, all with smart reminders that save you money and time.
            </p>
            <p className="integrations-vision-sub">
              We're building partnerships with smart home brands and fitness platforms.
              Hit "Notify me" on any integration to be first in line.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
