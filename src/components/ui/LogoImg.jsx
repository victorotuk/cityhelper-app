import { APP_CONFIG } from '../../lib/config';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Theme-aware logo image: uses logoImageDark on dark theme, logoImageLight on light.
 * Use for headers, nav, and anywhere the Nava logo is shown.
 */
export default function LogoImg({ alt = 'Nava', className, ...imgProps }) {
  const theme = useThemeStore((s) => s.theme);
  const src =
    theme === 'dark'
      ? (APP_CONFIG.logoImageDark || APP_CONFIG.logoImage)
      : (APP_CONFIG.logoImageLight || APP_CONFIG.logoImage);

  if (!src) {
    return <span className={className}>{APP_CONFIG.logo}</span>;
  }
  return <img src={src} alt={alt} className={className} {...imgProps} />;
}
