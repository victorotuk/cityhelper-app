import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AUTO_DETECT_PROMPT } from '../../lib/addItemExtractPrompts';
import { APP_CONFIG } from '../../lib/config';
import AddItemCategoryPicker from './AddItemCategoryPicker';
import AddItemFormFields from './AddItemFormFields';
import AddItemScanFirst from './AddItemScanFirst';
import AddItemScanConfirm from './AddItemScanConfirm';
import { getVoicePreference, speak } from '../../lib/voice';
import { pdfFirstPageToImageUrl, pdfAllPagesToImageUrls } from '../../lib/pdfToImage';

export default function AddItemModal({
  onClose,
  onAdd,
  selectedCategory,
  setSelectedCategory,
  accountType,
  onSuggest,
  initialValues,
  userId,
  activeCountry,
  userCountries,
}) {
  const [name, setName] = useState(initialValues?.name || '');
  const [dueDate, setDueDate] = useState(initialValues?.due_date || '');
  const [notes, setNotes] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [recurrenceInterval, setRecurrenceInterval] = useState('');
  const [documentId, setDocumentId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [alertEmails, setAlertEmails] = useState('');
  const [activeGroup, setActiveGroup] = useState(accountType === 'organization' ? 'business' : 'personal');
  const [countryOverride, setCountryOverride] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showScanConfirm, setShowScanConfirm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [tracking, setTracking] = useState(false);
  /** Multi-page PDF: array of { name, category, dueDate, notes } per page */
  const [pdfMultiItems, setPdfMultiItems] = useState([]);
  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  const itemCountry = countryOverride ?? activeCountry ?? '';

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || '');
      setDueDate(initialValues.due_date || '');
      setCountryOverride(initialValues.country || null);
    }
  }, [initialValues?.name, initialValues?.due_date, initialValues?.country]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedCategory || !userId) return;
    supabase
      .from('documents')
      .select('id, name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setDocuments(data || []));
  }, [selectedCategory, userId]);

  const categoryAliases = { driver_license: 'driving', drivers_license: 'driving', driving: 'driving', licence: 'driving', license: 'driving', drivers_licence: 'driving', driver_licence: 'driving' };

  function normalizeExtraction(ext) {
    if (!ext || typeof ext !== 'object') return null
    const nameLower = (ext.name || '').toLowerCase()
    const notesLower = (ext.notes || '').toLowerCase()
    const looksLikeDriverLicense = /driver|licen[c]?e|permit|photo\s*card|id\s*card|g1|g2|ontario\s*(photo|licen|id)/i.test(nameLower) || notesLower.includes('driver') || notesLower.includes('licen')
    const rawCat = (ext.category || '').toString().toLowerCase().replace(/\s+/g, '_').replace(/'/g, '')
    let category = ext.category && APP_CONFIG.categories.find(c => c.id === ext.category) ? ext.category : (categoryAliases[rawCat] || null)
    if (!category && looksLikeDriverLicense) category = 'driving'
    if (!category && (ext.name || ext.expiryDate || ext.dueDate)) category = 'other'
    const notesParts = []
    if (ext.number) notesParts.push(`Number: ${ext.number}`)
    if (ext.amount) notesParts.push(`Amount: ${ext.amount}`)
    if (ext.notes) notesParts.push(ext.notes)
    const notes = notesParts.length ? notesParts.join('\n') : (ext.notes || '')
    return {
      name: ext.name || 'Document',
      category: category || 'other',
      dueDate: ext.expiryDate || ext.dueDate || '',
      notes,
    }
  }

  const handleAutoDetect = async (file) => {
    setScanning(true);
    setScanError('');
    setPdfMultiItems([]);
    try {
      const groqKey = userId ? (localStorage.getItem(`nava_groq_key_${userId}`) || localStorage.getItem(`nava_ai_key_${userId}`)) || undefined : undefined;

      if (file.type === 'application/pdf') {
        const { count, imageUrls } = await pdfAllPagesToImageUrls(file);
        if (count === 1) {
          const { data, error } = await supabase.functions.invoke('ai-scan', {
            body: { image: imageUrls[0], prompt: AUTO_DETECT_PROMPT, apiKey: groqKey },
          });
          if (error) {
            let errMsg = error?.message || 'Scan failed';
            try { errMsg = (await error?.context?.json?.())?.error || errMsg; } catch { /* use default */ }
            throw new Error(errMsg);
          }
          if (data?.error) throw new Error(data.error);
          if (data?.limit_reached) {
            setScanError(`Scan limit reached. Choose a category manually.`);
            setScanning(false);
            setShowCategories(true);
            return;
          }
          let ext = data?.extracted || {};
          if (typeof ext === 'string') {
            try { const m = ext.match(/\{[\s\S]*\}/); if (m) ext = JSON.parse(m[0]); } catch { /* keep */ }
          }
          if ((!ext || typeof ext !== 'object' || !Object.keys(ext).length) && data?.raw) {
            try { const m = String(data.raw).match(/\{[\s\S]*\}/); if (m) ext = JSON.parse(m[0]) || ext; } catch { /* keep */ }
          }
          if (ext?.readable === false) {
            setScanError(ext.message || 'This page is unclear. Try another file or choose a category manually.');
            setScanning(false);
            return;
          }
          const item = normalizeExtraction(ext);
          if (item) {
            setSelectedCategory(item.category);
            setName(item.name);
            setDueDate(item.dueDate);
            setNotes(item.notes);
            setShowScanConfirm(true);
          } else {
            setScanError('We couldn\'t read that page. Try another file or choose "Browse categories".');
          }
          setScanning(false);
          return;
        }
        // Multi-page PDF: scan each page and collect items
        const items = [];
        for (let i = 0; i < imageUrls.length; i++) {
          const { data, error } = await supabase.functions.invoke('ai-scan', {
            body: { image: imageUrls[i], prompt: AUTO_DETECT_PROMPT, apiKey: groqKey },
          });
          if (error || data?.error) {
            items.push({ name: `Page ${i + 1}`, category: 'other', dueDate: '', notes: 'Could not read this page.' });
            continue;
          }
          if (data?.limit_reached) {
            setScanError(`Scan limit reached after page ${i + 1}. Track what we found or choose a category manually.`);
            break;
          }
          let ext = data?.extracted || {};
          if (typeof ext === 'string') {
            try { const m = ext.match(/\{[\s\S]*\}/); if (m) ext = JSON.parse(m[0]); } catch { /* keep */ }
          }
          if ((!ext || typeof ext !== 'object' || !Object.keys(ext).length) && data?.raw) {
            try { const m = String(data.raw).match(/\{[\s\S]*\}/); if (m) ext = JSON.parse(m[0]) || ext; } catch { /* keep */ }
          }
          const item = normalizeExtraction(ext);
          items.push(item || { name: `Page ${i + 1}`, category: 'other', dueDate: '', notes: '' });
        }
        setPdfMultiItems(items);
        setScanning(false);
        return;
      }

      // Image (not PDF)
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke('ai-scan', {
        body: { image: base64, prompt: AUTO_DETECT_PROMPT, apiKey: groqKey },
      });
      if (error) {
        let errMsg = error?.message || 'Scan failed';
        try { errMsg = (await error?.context?.json?.())?.error || errMsg; } catch { /* use default */ }
        throw new Error(errMsg);
      }
      if (data?.error) throw new Error(data.error);
      if (data?.limit_reached) {
        setScanError(`Scan limit reached (${data.scan_count}/${data.scan_limit}). Choose a category manually.`);
        setScanning(false);
        setShowCategories(true);
        return;
      }
      let ext = data?.extracted || {};
      if (typeof ext === 'string') {
        try {
          const match = ext.match(/\{[\s\S]*\}/);
          if (match) ext = JSON.parse(match[0]);
        } catch { /* keep ext as-is */ }
      }
      if ((!ext || typeof ext !== 'object' || Object.keys(ext).length === 0) && data?.raw) {
        try {
          const match = String(data.raw).match(/\{[\s\S]*\}/);
          if (match) ext = JSON.parse(match[0]) || ext;
        } catch { /* keep ext as-is */ }
      }
      if (ext && ext.readable === false) {
        const msg = ext.message || 'This image is too blurry or unclear to read. Try a clearer photo or choose a category manually.';
        setScanError(msg);
        if (userId && getVoicePreference(userId)) speak(msg);
        setScanning(false);
        return;
      }
      const item = normalizeExtraction(ext);
      if (item) {
        setSelectedCategory(item.category);
        setName(item.name);
        setDueDate(item.dueDate);
        setNotes(item.notes);
        setShowScanConfirm(true);
      } else {
        setScanError('We couldn\'t read that image. Try another photo or choose "Browse categories" to pick manually.');
      }
    } catch (err) {
      console.error('[AddItem] Auto-detect failed:', err);
      setScanError(err?.message || 'Could not identify document. Try another photo or choose "Browse categories" below.');
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleAutoDetect(file);
    e.target.value = '';
  };

  const handleCapture = (blob) => {
    if (!blob) return;
    const file = blob instanceof File ? blob : new File([blob], 'capture.jpg', { type: blob.type || 'image/jpeg' });
    handleAutoDetect(file);
  };

  const buildItem = () => {
    const emails = alertEmails.trim().split(/[\s,;]+/).filter(Boolean);
    return {
      name,
      category: selectedCategory,
      due_date: dueDate || null,
      notes: notes || null,
      pay_url: payUrl.trim() || null,
      pay_phone: payPhone.trim() || null,
      recurrence_interval: recurrenceInterval || null,
      document_id: documentId || null,
      alert_emails: emails.length ? emails : null,
      country: itemCountry || activeCountry || null,
    };
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    onAdd(buildItem());
  };

  const handleTrackIt = async () => {
    if (!selectedCategory) return;
    setTracking(true);
    try {
      await Promise.resolve(onAdd(buildItem()));
      onClose();
    } catch (err) {
      console.error('[AddItem] Track it failed:', err);
    } finally {
      setTracking(false);
    }
  };

  const handleExtracted = (data) => {
    if (data.courseName) setName(data.courseName);
    else if (data.documentType) setName(data.documentType);
    else if (data.name && !name) setName(data.name);

    if (data.examDate) setDueDate(data.examDate);
    else if (data.expiryDate) setDueDate(data.expiryDate);
    else if (data.dueDate) setDueDate(data.dueDate);
    else if (data.endDate) setDueDate(data.endDate);

    const notesParts = [];
    if (data.number) notesParts.push(`Number: ${data.number}`);
    if (data.cardNumber) notesParts.push(`Card #: ${data.cardNumber}`);
    if (data.licenseNumber) notesParts.push(`License #: ${data.licenseNumber}`);
    if (data.issueDate) notesParts.push(`Issued: ${data.issueDate}`);
    if (data.instructor) notesParts.push(`Instructor: ${data.instructor}`);
    if (data.semester) notesParts.push(`Semester: ${data.semester}`);
    if (data.employer) notesParts.push(`Employer: ${data.employer}`);
    if (data.position) notesParts.push(`Position: ${data.position}`);
    if (data.businessName) notesParts.push(`Business: ${data.businessName}`);
    if (data.creditor) notesParts.push(`Creditor: ${data.creditor}`);
    if (data.amount) notesParts.push(`Amount: ${data.amount}`);
    if (data.employeeName) notesParts.push(`Employee: ${data.employeeName}`);
    if (Array.isArray(data.items) && data.items.length) {
      notesParts.push('--- Extracted Dates ---');
      data.items.forEach((it) => notesParts.push(`${it.name}: ${it.date}`));
    }
    if (Array.isArray(data.shifts) && data.shifts.length) {
      notesParts.push('--- Schedule ---');
      data.shifts.forEach((s) => notesParts.push(`${s.day}: ${s.startTime} - ${s.endTime}`));
    }
    if (notesParts.length) setNotes(notesParts.join('\n'));
  };

  const handlePasteSuggest = (s) => {
    if (s.name) setName(s.name);
    if (s.due_date) setDueDate(s.due_date);
    if (s.category) setSelectedCategory(s.category);
  };

  const showPdfMulti = pdfMultiItems.length > 0;
  const showScanFirst = !selectedCategory && !showCategories && !showScanConfirm && !showPdfMulti;
  const categoryMeta = selectedCategory ? APP_CONFIG.categories.find(c => c.id === selectedCategory) : null;

  const handleTrackPdfPage = (index) => {
    const item = pdfMultiItems[index];
    if (!item) return;
    onAdd({
      name: item.name,
      category: item.category,
      due_date: item.dueDate || null,
      notes: item.notes || null,
      pay_url: null,
      pay_phone: null,
      recurrence_interval: null,
      document_id: documentId || null,
      alert_emails: null,
      country: itemCountry || activeCountry || null,
    });
    setPdfMultiItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTrackAllPdfPages = async () => {
    setTracking(true);
    try {
      for (const item of pdfMultiItems) {
        await Promise.resolve(onAdd({
          name: item.name,
          category: item.category,
          due_date: item.dueDate || null,
          notes: item.notes || null,
          pay_url: null,
          pay_phone: null,
          recurrence_interval: null,
          document_id: documentId || null,
          alert_emails: null,
          country: itemCountry || activeCountry || null,
        }));
      }
      setPdfMultiItems([]);
      onClose();
    } catch (err) {
      console.error('[AddItem] Track all failed:', err);
    } finally {
      setTracking(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {showPdfMulti ? 'Items from PDF' : showScanConfirm ? 'Confirm & track' : selectedCategory && !showScanConfirm ? 'Add Item' : showScanFirst ? 'Track something' : 'What are you tracking?'}
          </h2>
          <button type="button" className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {showPdfMulti ? (
          <div className="add-item-pdf-multi">
            <p className="text-secondary">We found {pdfMultiItems.length} item{pdfMultiItems.length !== 1 ? 's' : ''} from your PDF.</p>
            <ul className="pdf-multi-list">
              {pdfMultiItems.map((item, index) => (
                <li key={index} className="pdf-multi-row">
                  <span className="pdf-multi-label">Page {index + 1}:</span>
                  <span className="pdf-multi-name">{item.name}</span>
                  {item.dueDate ? <span className="pdf-multi-date">{item.dueDate}</span> : null}
                  <span className="pdf-multi-cat">{APP_CONFIG.categories.find(c => c.id === item.category)?.name || item.category}</span>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleTrackPdfPage(index)}>Track</button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-2">
              <button type="button" className="btn btn-primary" onClick={handleTrackAllPdfPages} disabled={tracking}>
                {tracking ? 'Adding…' : 'Track all'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setPdfMultiItems([])}>Scan something else</button>
            </div>
          </div>
        ) : showScanConfirm ? (
          <AddItemScanConfirm
            userId={userId}
            categoryId={selectedCategory}
            categoryName={categoryMeta?.name}
            name={name}
            dueDate={dueDate}
            notes={notes}
            onTrackIt={handleTrackIt}
            onEditDetails={() => setShowScanConfirm(false)}
            tracking={tracking}
          />
        ) : showScanFirst ? (
          <AddItemScanFirst
            userId={userId}
            cameraRef={cameraRef}
            fileRef={fileRef}
            scanning={scanning}
            scanError={scanError}
            onFileChange={handleFileChange}
            onCapture={handleCapture}
            onBrowseCategories={() => setShowCategories(true)}
          />
        ) : !selectedCategory ? (
          <AddItemCategoryPicker
            activeGroup={activeGroup}
            setActiveGroup={setActiveGroup}
            setSelectedCategory={setSelectedCategory}
            onPasteSuggest={handlePasteSuggest}
            onSuggest={onSuggest}
          />
        ) : (
          <AddItemFormFields
            selectedCategory={selectedCategory}
            name={name}
            setName={setName}
            dueDate={dueDate}
            setDueDate={setDueDate}
            notes={notes}
            setNotes={setNotes}
            payUrl={payUrl}
            setPayUrl={setPayUrl}
            payPhone={payPhone}
            setPayPhone={setPayPhone}
            recurrenceInterval={recurrenceInterval}
            setRecurrenceInterval={setRecurrenceInterval}
            documentId={documentId}
            setDocumentId={setDocumentId}
            documents={documents}
            alertEmails={alertEmails}
            setAlertEmails={setAlertEmails}
            itemCountry={itemCountry}
            setCountryOverride={setCountryOverride}
            userCountries={userCountries}
            onExtracted={handleExtracted}
            onSubmit={handleSubmit}
            onBack={() => { setSelectedCategory(null); setShowCategories(false); }}
          />
        )}
      </div>
    </div>
  );
}
