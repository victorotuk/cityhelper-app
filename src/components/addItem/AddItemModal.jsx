import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AddItemCategoryPicker from './AddItemCategoryPicker';
import AddItemFormFields from './AddItemFormFields';

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

  const itemCountry = countryOverride ?? activeCountry ?? '';

  useEffect(() => {
    if (initialValues) {
      /* Sync form when initialValues changes (e.g. from Share). */
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const emails = alertEmails.trim().split(/[\s,;]+/).filter(Boolean);
    onAdd({
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
    });
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{selectedCategory ? 'Add Item' : 'What are you tracking?'}</h2>
          <button type="button" className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {!selectedCategory ? (
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
            onBack={() => setSelectedCategory(null)}
          />
        )}
      </div>
    </div>
  );
}
