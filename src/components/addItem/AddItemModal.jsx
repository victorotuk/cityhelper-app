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

  const handleAutoDetect = async (file) => {
    setScanning(true);
    setScanError('');
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke('ai-scan', {
        body: { image: base64, prompt: AUTO_DETECT_PROMPT },
      });
      if (error) throw error;
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
      if (ext && ext.readable === false) {
        const msg = ext.message || 'This image is too blurry or unclear to read. Try a clearer photo or choose a category manually.';
        setScanError(msg);
        if (userId && getVoicePreference(userId)) speak(msg);
        setScanning(false);
        return;
      }
      const nameLower = (ext.name || '').toLowerCase();
      const looksLikeDriverLicense = /driver|licen[c]?e|permit|ontario.*licence/i.test(nameLower) || (ext.notes || '').toLowerCase().includes('driver');
      let category = ext.category && APP_CONFIG.categories.find(c => c.id === ext.category) ? ext.category : null;
      if (!category && looksLikeDriverLicense) category = 'driving';
      if (category) setSelectedCategory(category);
      if (ext.name) setName(ext.name);
      if (ext.expiryDate) setDueDate(ext.expiryDate);
      else if (ext.dueDate) setDueDate(ext.dueDate);
      const notesParts = [];
      if (ext.number) notesParts.push(`Number: ${ext.number}`);
      if (ext.amount) notesParts.push(`Amount: ${ext.amount}`);
      if (ext.notes) notesParts.push(ext.notes);
      if (notesParts.length) setNotes(notesParts.join('\n'));
      if (category) {
        setShowScanConfirm(true);
      } else {
        setShowCategories(true);
      }
    } catch (err) {
      console.error('[AddItem] Auto-detect failed:', err);
      setScanError('Could not identify document. Choose a category manually.');
      setShowCategories(true);
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleAutoDetect(file);
    e.target.value = '';
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

  const showScanFirst = !selectedCategory && !showCategories && !showScanConfirm;
  const categoryMeta = selectedCategory ? APP_CONFIG.categories.find(c => c.id === selectedCategory) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {showScanConfirm ? 'Confirm & track' : selectedCategory && !showScanConfirm ? 'Add Item' : showScanFirst ? 'Track something' : 'What are you tracking?'}
          </h2>
          <button type="button" className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {showScanConfirm ? (
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
