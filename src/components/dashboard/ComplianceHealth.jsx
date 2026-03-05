/**
 * Dashboard compliance health score and stats.
 */

export default function ComplianceHealth({ items, groupedItems }) {
  const total = items.length;
  if (total === 0) return null;

  const overdueCount = groupedItems.overdue.length;
  const urgentCount = groupedItems.urgent.length;
  const warningCount = groupedItems.warning.length;
  const okCount = groupedItems.ok.length;

  const score = Math.max(0, Math.round(
    100 - (overdueCount * 25) - (urgentCount * 10) - (warningCount * 3)
  ));

  const getMessage = (s) => {
    if (s === 100) return "Everything's in order. You're on top of it.";
    if (s >= 80) return "Looking good. A few things to keep an eye on.";
    if (s >= 50) return "Some items need your attention soon.";
    if (s >= 25) return "Several deadlines are overdue or urgent.";
    return "You have critical items that need immediate attention.";
  };

  return (
    <div className="compliance-health compliance-health-gradient">
      <div className="health-score">
        <span className="health-number">{score}</span>
        <span className="health-label">Health</span>
      </div>
      <div className="health-details">
        <p className="health-message">{getMessage(score)}</p>
        <div className="health-stats">
          {overdueCount > 0 && <span className="health-stat overdue">{overdueCount} overdue</span>}
          {urgentCount > 0 && <span className="health-stat urgent">{urgentCount} urgent</span>}
          {warningCount > 0 && <span className="health-stat warning">{warningCount} soon</span>}
          <span className="health-stat ok">{okCount} good</span>
        </div>
      </div>
    </div>
  );
}
