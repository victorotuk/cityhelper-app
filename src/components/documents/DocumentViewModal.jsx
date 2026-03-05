import { X, Download } from 'lucide-react';

export default function DocumentViewModal({ doc, onClose }) {
  if (!doc) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="doc-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-header">
          <h3>{doc.name}</h3>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="viewer-content">
          {doc.type?.startsWith('image/') ? (
            <img src={doc.content} alt={doc.name} />
          ) : doc.type?.includes('pdf') ? (
            <iframe src={doc.content} title={doc.name} />
          ) : (
            <div className="text-preview">
              <p>Preview not available for this file type.</p>
              <a href={doc.content} download={doc.name} className="btn btn-primary">
                <Download size={18} />
                Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
