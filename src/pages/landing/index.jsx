import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import LandingNav from './LandingNav';
import LandingHero from './LandingHero';
import LandingFeatures from './LandingFeatures';
import LandingCta from './LandingCta';
import LandingFooter from './LandingFooter';

export default function Landing() {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-page">
      <LandingNav />
      <main className="landing-main">
        <LandingHero />
        <LandingFeatures />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
