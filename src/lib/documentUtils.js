/**
 * Document display helpers (size formatting, etc.).
 * Icon selection for file type is in DocumentCard to keep JSX in components.
 */

export function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
