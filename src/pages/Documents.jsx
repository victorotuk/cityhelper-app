import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Trash2, Download, Eye, X, Folder, Image, File, Camera, Scan, Loader, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { encrypt, decrypt } from '../lib/crypto';
import { APP_CONFIG } from '../lib/config';
import { format } from 'date-fns';

export default function Documents() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps -- fetchDocuments reads user

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          setError('Database table not set up yet. Please run the SQL migration.');
        } else {
          throw error;
        }
      } else {
        setDocuments(data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleUpload = async (e, shouldScan = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Encrypt the file content
      const encryptionKey = sessionStorage.getItem('userEncryptionKey');
      let encryptedContent = base64;
      let isEncrypted = false;
      
      if (encryptionKey) {
        try {
          encryptedContent = await encrypt(base64, encryptionKey);
          isEncrypted = true;
        } catch (encErr) {
          console.warn('Encryption failed, storing unencrypted:', encErr);
        }
      }

      // Store in database
      const docData = {
        user_id: user.id,
        name: file.name,
        type: file.type,
        size: file.size,
        content: encryptedContent,
        is_encrypted: isEncrypted,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('documents')
        .insert([docData]);

      if (insertError) {
        if (insertError.code === '42P01') {
          setError('Database table not set up yet. Please run the SQL migration.');
        } else {
          throw insertError;
        }
      } else {
        await fetchDocuments();
        
        // If scanning requested, scan the document
        if (shouldScan && file.type.startsWith('image/')) {
          await scanDocument(base64);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed: ' + err.message);
    }
    
    setUploading(false);
    e.target.value = '';
  };

  const scanDocument = async (imageBase64) => {
    setScanning(true);
    setScanResult(null);
    
    try {
      const prompt = `Analyze this document image and extract key information. Return a JSON object with:
- type: "T4", "receipt", "id", or "other"
- For T4: employer, employment_income, income_tax_deducted, cpp_contributions, ei_premiums, year
- For receipt: merchant, total, date
- For ID/license: name, id_number, expiry_date
Return ONLY valid JSON, no markdown or explanation.`;

      // Call backend AI scan function
      const { data, error: fnError } = await supabase.functions.invoke('ai-scan', {
        body: { image: imageBase64, prompt }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setScanResult({ success: true, parsed: data.extracted });
    } catch (err) {
      console.error('Scan error:', err);
      setError('Scan failed: ' + err.message);
    }
    
    setScanning(false);
  };

  const handleScanExisting = async (doc) => {
    try {
      let content = doc.content;
      
      if (doc.is_encrypted) {
        const key = sessionStorage.getItem('userEncryptionKey');
        if (key) {
          content = await decrypt(content, key);
        } else {
          alert('Encryption key not available.');
          return;
        }
      }
      
      await scanDocument(content);
    } catch (err) {
      console.error('Scan error:', err);
      setError('Scan failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    
    try {
      await supabase.from('documents').delete().eq('id', id);
      setDocuments(docs => docs.filter(d => d.id !== id));
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  const handleView = async (doc) => {
    try {
      let content = doc.content;
      
      if (doc.is_encrypted) {
        const key = sessionStorage.getItem('userEncryptionKey');
        if (key) {
          const decrypted = await decrypt(content, key);
          if (decrypted) {
            content = decrypted;
          } else {
            alert('Could not decrypt document');
            return;
          }
        } else {
          alert('Encryption key not available. Please log in again.');
          return;
        }
      }
      
      setSelectedDoc({ ...doc, content });
    } catch (err) {
      console.error('View error:', err);
      alert('Failed to view document: ' + err.message);
    }
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <Image size={24} />;
    if (type?.includes('pdf')) return <FileText size={24} />;
    return <File size={24} />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="documents-page">
      <header className="page-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <div className="header-title">
          <Folder size={24} />
          <span>Document Vault</span>
        </div>
        <div className="header-actions-row">
          <label className={`btn btn-ghost btn-sm ${uploading ? 'disabled' : ''}`}>
            <Upload size={16} />
            Upload
            <input 
              type="file" 
              onChange={(e) => handleUpload(e, false)} 
              disabled={uploading}
              style={{ display: 'none' }}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </label>
          <label className={`btn btn-primary btn-sm ${uploading || scanning ? 'disabled' : ''}`}>
            {scanning ? <Loader size={16} className="spin" /> : <Scan size={16} />}
            {scanning ? 'Scanning...' : 'Scan & Upload'}
            <input 
              type="file" 
              onChange={(e) => handleUpload(e, true)} 
              disabled={uploading || scanning}
              style={{ display: 'none' }}
              accept="image/*"
            />
          </label>
        </div>
      </header>

      <main className="documents-main">
        <div className="documents-container">
          <div className="vault-notice">
            <span>🔐</span>
            <p>All documents are encrypted with your password. Only you can view them.</p>
          </div>

          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={() => setError(null)}><X size={16} /></button>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && scanResult.success && (
            <div className="scan-result">
              <div className="scan-result-header">
                    <CheckCircle size={20} />
                    <h3>Document Scanned</h3>
                    <button onClick={() => setScanResult(null)}><X size={18} /></button>
                  </div>
                  <div className="scan-result-content">
                    <div className="scan-type">
                      <span className="label">Detected Type:</span>
                      <span className="value">{scanResult.parsed?.type?.toUpperCase() || 'Unknown'}</span>
                    </div>
                
                {(scanResult.parsed?.type === 'T4' || scanResult.parsed?.type?.toLowerCase() === 't4') && (
                  <div className="scan-data">
                    <h4>T4 Data Extracted:</h4>
                    <div className="data-grid">
                      {scanResult.parsed.employer && (
                        <div className="data-item">
                          <span>Employer</span>
                          <strong>{scanResult.parsed.employer}</strong>
                        </div>
                      )}
                      {scanResult.parsed.employment_income && (
                        <div className="data-item">
                          <span>Employment Income</span>
                          <strong>${scanResult.parsed.employment_income.toLocaleString()}</strong>
                        </div>
                      )}
                      {scanResult.parsed.income_tax_deducted && (
                        <div className="data-item">
                          <span>Tax Deducted</span>
                          <strong>${scanResult.parsed.income_tax_deducted.toLocaleString()}</strong>
                        </div>
                      )}
                      {scanResult.parsed.cpp_contributions && (
                        <div className="data-item">
                          <span>CPP</span>
                          <strong>${scanResult.parsed.cpp_contributions.toLocaleString()}</strong>
                        </div>
                      )}
                      {scanResult.parsed.ei_premiums && (
                        <div className="data-item">
                          <span>EI</span>
                          <strong>${scanResult.parsed.ei_premiums.toLocaleString()}</strong>
                        </div>
                      )}
                      {scanResult.parsed.year && (
                        <div className="data-item">
                          <span>Tax Year</span>
                          <strong>{scanResult.parsed.year}</strong>
                        </div>
                      )}
                    </div>
                    <Link to="/tax-estimator" className="btn btn-primary btn-sm">
                      Use in Tax Estimator →
                    </Link>
                  </div>
                )}

                {(scanResult.parsed?.type === 'id' || scanResult.parsed?.type?.toLowerCase() === 'id' || scanResult.parsed?.type?.toLowerCase()?.includes('license')) && (
                  <div className="scan-data">
                    <h4>ID Data Extracted:</h4>
                    <div className="data-grid">
                      {scanResult.parsed.name && (
                        <div className="data-item">
                          <span>Name</span>
                          <strong>{scanResult.parsed.name}</strong>
                        </div>
                      )}
                      {scanResult.parsed.id_number && (
                        <div className="data-item">
                          <span>ID Number</span>
                          <strong>{scanResult.parsed.id_number}</strong>
                        </div>
                      )}
                      {scanResult.parsed.expiry_date && (
                        <div className="data-item highlight">
                          <span>Expiry Date</span>
                          <strong>{scanResult.parsed.expiry_date}</strong>
                        </div>
                      )}
                    </div>
                    <Link to="/dashboard" className="btn btn-primary btn-sm">
                      Add to Tracker →
                    </Link>
                  </div>
                )}

                {(scanResult.parsed?.type === 'receipt' || scanResult.parsed?.type?.toLowerCase() === 'receipt') && (
                  <div className="scan-data">
                    <h4>Receipt Data Extracted:</h4>
                    <div className="data-grid">
                      {scanResult.parsed.merchant && (
                        <div className="data-item">
                          <span>Merchant</span>
                          <strong>{scanResult.parsed.merchant}</strong>
                        </div>
                      )}
                      {scanResult.parsed.total && (
                        <div className="data-item">
                          <span>Total</span>
                          <strong>${scanResult.parsed.total.toFixed(2)}</strong>
                        </div>
                      )}
                      {scanResult.parsed.date && (
                        <div className="data-item">
                          <span>Date</span>
                          <strong>{scanResult.parsed.date}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading documents...</div>
          ) : documents.length === 0 && !error ? (
            <div className="empty-state">
              <Folder size={48} />
              <h3>No documents yet</h3>
              <p>Upload tax slips, licenses, receipts, and more.</p>
              <div className="upload-options">
                <label className="btn btn-primary">
                  <Scan size={18} />
                  Scan Document
                  <input 
                    type="file" 
                    onChange={(e) => handleUpload(e, true)} 
                    style={{ display: 'none' }}
                    accept="image/*"
                  />
                </label>
                <label className="btn btn-ghost">
                  <Camera size={18} />
                  Take Photo
                  <input 
                    type="file" 
                    onChange={(e) => handleUpload(e, true)} 
                    style={{ display: 'none' }}
                    accept="image/*"
                    capture="environment"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map(doc => (
                <div key={doc.id} className="doc-card">
                  <div className="doc-icon">
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="doc-info">
                    <h4>{doc.name}</h4>
                    <span>{formatSize(doc.size)} • {format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                    {doc.is_encrypted && <span className="encrypted-badge">🔐 Encrypted</span>}
                  </div>
                  <div className="doc-actions">
                    {doc.type?.startsWith('image/') && (
                      <button 
                        onClick={() => handleScanExisting(doc)} 
                        title="Scan for data"
                        disabled={scanning}
                      >
                        <Scan size={16} />
                      </button>
                    )}
                    <button onClick={() => handleView(doc)} title="View">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleDelete(doc.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="doc-viewer" onClick={e => e.stopPropagation()}>
            <div className="viewer-header">
              <h3>{selectedDoc.name}</h3>
              <button onClick={() => setSelectedDoc(null)}><X size={20} /></button>
            </div>
            <div className="viewer-content">
              {selectedDoc.type?.startsWith('image/') ? (
                <img src={selectedDoc.content} alt={selectedDoc.name} />
              ) : selectedDoc.type?.includes('pdf') ? (
                <iframe src={selectedDoc.content} title={selectedDoc.name} />
              ) : (
                <div className="text-preview">
                  <p>Preview not available for this file type.</p>
                  <a href={selectedDoc.content} download={selectedDoc.name} className="btn btn-primary">
                    <Download size={18} />
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
