import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { APPLICATION_TYPES, APPLICATION_FIELDS } from './apply/applyConfig';
import ApplyTypeSelect from './apply/ApplyTypeSelect';
import ApplyFormStep from './apply/ApplyFormStep';
import ApplyReviewStep from './apply/ApplyReviewStep';
import ApplyGuideStep from './apply/ApplyGuideStep';

export default function Apply() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');

  const [selectedType, setSelectedType] = useState(typeParam || null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedApplication, setSavedApplication] = useState(null);

  const appType = selectedType ? APPLICATION_TYPES[selectedType] : null;
  const fields = selectedType ? APPLICATION_FIELDS[selectedType] || [] : [];

  const loadSavedApplication = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', selectedType)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setSavedApplication(data);
        setFormData(data.form_data || {});
      }
    } catch {
      // No saved application
    }
  };

  useEffect(() => {
    if (user && selectedType) {
      queueMicrotask(() => loadSavedApplication());
    }
  }, [user, selectedType]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveApplication = async () => {
    setSaving(true);
    try {
      const appData = {
        user_id: user.id,
        type: selectedType,
        form_data: formData,
        status: 'draft',
        updated_at: new Date().toISOString(),
      };
      if (savedApplication) {
        await supabase.from('applications').update(appData).eq('id', savedApplication.id);
      } else {
        const { data } = await supabase
          .from('applications')
          .insert([{ ...appData, created_at: new Date().toISOString() }])
          .select()
          .single();
        setSavedApplication(data);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const copyToClipboard = (value, fieldId) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setCurrentStep(1);
  };

  const handleContinueToReview = async () => {
    await saveApplication();
    setCurrentStep(2);
  };

  const handleStartGuide = () => setCurrentStep(3);

  const isFormComplete = () =>
    fields.filter((f) => f.required).every((f) => formData[f.id]?.trim());

  return (
    <div className="apply-page">
      <header className="page-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <div className="header-title">
          <FileText size={24} />
          <span>Apply for Permits</span>
        </div>
        <div style={{ width: 80 }} />
      </header>

      <main className="apply-main">
        <div className="apply-container">
          {currentStep === 0 && <ApplyTypeSelect onSelectType={handleSelectType} />}

          {currentStep === 1 && appType && (
            <ApplyFormStep
              appType={appType}
              formData={formData}
              saving={saving}
              onFieldChange={handleFieldChange}
              onSaveDraft={saveApplication}
              onContinueToReview={handleContinueToReview}
              onBack={() => {
                setCurrentStep(0);
                setSelectedType(null);
              }}
              isFormComplete={isFormComplete}
            />
          )}

          {currentStep === 2 && appType && (
            <ApplyReviewStep
              appType={appType}
              formData={formData}
              onEdit={setCurrentStep}
              onStartGuide={handleStartGuide}
            />
          )}

          {currentStep === 3 && appType && (
            <ApplyGuideStep
              appType={appType}
              formData={formData}
              copiedField={copiedField}
              onCopyField={copyToClipboard}
              fields={fields}
            />
          )}
        </div>
      </main>
    </div>
  );
}
