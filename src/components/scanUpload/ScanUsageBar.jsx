import { AlertTriangle } from 'lucide-react';

export default function ScanUsageBar({ count, limit }) {
  if (count == null || limit == null) return null;
  const usageText = `${count}/${limit} scans used this month`;
  const nearLimit = count >= limit * 0.8;
  const atLimit = count >= limit;

  return (
    <div className={`scan-usage ${nearLimit ? 'scan-usage-warn' : ''} ${atLimit ? 'scan-usage-limit' : ''}`}>
      {nearLimit && <AlertTriangle size={14} />}
      <span>{usageText}</span>
    </div>
  );
}
