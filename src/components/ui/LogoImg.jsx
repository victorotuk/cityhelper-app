import { APP_CONFIG } from '../../lib/config';
import { useThemeStore } from '../../stores/themeStore';

/**
 * Theme-aware logo image: uses logoImageDark on dark theme, logoImageLight on light.
 * Use for headers, nav, and anywhere the Nava logo is shown.
 * @param variant - Override: 'light' for dark backgrounds (e.g. landing nav), 'dark' for light backgrounds
 */
export default function LogoImg({ alt = 'Nava', className, variant, ...imgProps }) {
  const theme = useThemeStore((s) => s.theme);
  const effective = variant || (theme === 'dark' ? 'dark' : 'light');
  const src =
    effective === 'dark'
      ? (APP_CONFIG.logoImageDark || APP_CONFIG.logoImage)
      : (APP_CONFIG.logoImageLight || APP_CONFIG.logoImage);

  if (!src) {
    return <span className={className}>{APP_CONFIG.logo}</span>;
  }
  return <img src={src} alt={alt} className={className} {...imgProps} />;
}
