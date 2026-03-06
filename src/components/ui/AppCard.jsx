import { CARD_CLASS, CARD_HEADER_CLASS, CARD_BODY_CLASS } from '../../styles/theme';

/**
 * Card matching Track Item / add modal theme: gradient left bar, bg-card, border-visible.
 * Use for settings sections, setup steps, and any panel that should match the main app UI.
 */
export default function AppCard({ children, header, className = '', noGradient = false }) {
  const classes = [CARD_CLASS, noGradient && 'app-card--no-bar', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      {header && <div className={CARD_HEADER_CLASS}>{header}</div>}
      <div className={CARD_BODY_CLASS}>{children}</div>
    </div>
  );
}
