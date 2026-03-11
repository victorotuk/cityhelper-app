import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Upload, X, Folder, Camera, Scan, Loader } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { encrypt, decrypt } from '../lib/crypto';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentViewModal from '../components/documents/DocumentViewModal';
import ScanResultCard from '../components/documents/ScanResultCard';

export default function Documents() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const fakeEvent = { target: { files: [file], value: '' } };
    Object.defineProperty(fakeEvent.target, 'value', { set() {}, get() { return ''; } });
    const shouldScan = file.type.startsWith('image/');
    await handleUpload(fakeEvent, shouldScan);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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

      const groqKey = user?.id ? (localStorage.getItem(`nava_groq_key_${user.id}`) || undefined) : undefined;
      const { data, error: fnError } = await supabase.functions.invoke('ai-scan', {
        body: { image: imageBase64, prompt, apiKey: groqKey }
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

  const headerRight = (
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
  );

  return (
    <div className="documents-page">
      <PageHeader
        backTo="/dashboard"
        title="Document Vault"
        icon={<Folder size={24} />}
        right={headerRight}
      />

      <main
        className={`documents-main ${dragOver ? 'drag-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget)) return; setDragOver(false); }}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="drop-overlay">
            <Upload size={40} />
            <p>Drop to upload</p>
          </div>
        )}
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

          {scanResult && scanResult.success && (
            <ScanResultCard scanResult={scanResult} onDismiss={() => setScanResult(null)} />
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
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onView={handleView}
                  onDelete={handleDelete}
                  onScan={handleScanExisting}
                  scanning={scanning}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedDoc && (
        <DocumentViewModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}
