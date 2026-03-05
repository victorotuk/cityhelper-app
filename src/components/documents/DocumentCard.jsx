import { Image, FileText, File, Eye, Trash2, Scan } from 'lucide-react';
import { format } from 'date-fns';
import { formatSize } from '../../lib/documentUtils';

function getFileIcon(type) {
  if (type?.startsWith('image/')) return <Image size={24} />;
  if (type?.includes('pdf')) return <FileText size={24} />;
  return <File size={24} />;
}

export default function DocumentCard({ doc, onView, onDelete, onScan, scanning }) {
  return (
    <div className="doc-card">
      <div className="doc-icon">{getFileIcon(doc.type)}</div>
      <div className="doc-info">
        <h4>{doc.name}</h4>
        <span>
          {formatSize(doc.size)} • {format(new Date(doc.created_at), 'MMM d, yyyy')}
        </span>
        {doc.is_encrypted && <span className="encrypted-badge">🔐 Encrypted</span>}
      </div>
      <div className="doc-actions">
        {doc.type?.startsWith('image/') && (
          <button onClick={() => onScan(doc)} title="Scan for data" disabled={scanning}>
            <Scan size={16} />
          </button>
        )}
        <button onClick={() => onView(doc)} title="View">
          <Eye size={16} />
        </button>
        <button onClick={() => onDelete(doc.id)} title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
