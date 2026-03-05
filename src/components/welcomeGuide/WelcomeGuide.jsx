import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  ROLE_CATEGORIES,
  FOCUS_AREA_CATEGORIES,
  ORG_TYPE_CATEGORIES,
  ORG_FOCUS_AREA_CATEGORIES,
  LIFE_MOMENT_CATEGORIES,
} from './quizConfig';
import WelcomeStepWelcome from './WelcomeStepWelcome';
import WelcomeStepAccountType from './WelcomeStepAccountType';
import WelcomeStepRoles from './WelcomeStepRoles';
import WelcomeStepFocusAreas from './WelcomeStepFocusAreas';
import WelcomeStepLifeMoments from './WelcomeStepLifeMoments';
import WelcomeStepOtherNeeds from './WelcomeStepOtherNeeds';
import WelcomeStepOrgInfo from './WelcomeStepOrgInfo';
import WelcomeStepOrgFocusAreas from './WelcomeStepOrgFocusAreas';

export default function WelcomeGuide({ userId, onComplete, existingPersona, isRetake }) {
  const existingType = existingPersona?.accountType || 'personal';
  const startStep = isRetake ? 'account_type' : 'welcome';

  const [step, setStep] = useState(startStep);
  const [accountType, setAccountType] = useState(existingType);

  const [selectedRoles, setSelectedRoles] = useState(existingPersona?.roles || []);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState(existingPersona?.focusAreas ?? existingPersona?.struggles ?? []);
  const [lifeMoments, setLifeMoments] = useState(existingPersona?.lifeMoments || []);
  const [otherNeeds, setOtherNeeds] = useState(existingPersona?.otherNeeds || '');
  const [otherRoleDetail, setOtherRoleDetail] = useState(existingPersona?.otherRoleDetail || '');
  const [otherFocusAreaDetail, setOtherFocusAreaDetail] = useState(existingPersona?.otherFocusAreaDetail || '');
  const [otherLifeMomentDetail, setOtherLifeMomentDetail] = useState(existingPersona?.otherLifeMomentDetail || '');

  const [orgName, setOrgName] = useState(existingPersona?.orgInfo?.name || '');
  const [orgType, setOrgType] = useState(existingPersona?.orgInfo?.type || '');
  const [orgFocusAreas, setOrgFocusAreas] = useState(existingPersona?.orgFocusAreas ?? existingPersona?.orgStruggles ?? []);
  const [orgOtherNeeds, setOrgOtherNeeds] = useState(existingPersona?.orgOtherNeeds || '');
  const [orgOtherFocusAreaDetail, setOrgOtherFocusAreaDetail] = useState(existingPersona?.orgOtherFocusAreaDetail || '');
  const [orgTypeOtherDetail, setOrgTypeOtherDetail] = useState(existingPersona?.orgTypeOtherDetail || '');

  const [saving, setSaving] = useState(false);

  const toggleItem = (setter) => (id) => {
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const getRecommendedCategories = () => {
    const catSet = new Set();
    if (accountType === 'personal') {
      selectedRoles.forEach((r) => (ROLE_CATEGORIES[r] || []).forEach((c) => catSet.add(c)));
      selectedFocusAreas.forEach((s) => (FOCUS_AREA_CATEGORIES[s] || []).forEach((c) => catSet.add(c)));
      lifeMoments.filter((m) => m !== 'none').forEach((m) => (LIFE_MOMENT_CATEGORIES[m] || []).forEach((c) => catSet.add(c)));
    } else {
      const effectiveOrgType = orgType || (orgTypeOtherDetail.trim() ? 'other' : '');
      (ORG_TYPE_CATEGORIES[effectiveOrgType] || []).forEach((c) => catSet.add(c));
      orgFocusAreas.forEach((s) => (ORG_FOCUS_AREA_CATEGORIES[s] || []).forEach((c) => catSet.add(c)));
    }
    return [...catSet];
  };

  const handleFinish = async () => {
    setSaving(true);
    const persona = {
      accountType,
      completedOnboarding: true,
      onboardedAt: new Date().toISOString(),
      recommendedCategories: getRecommendedCategories(),
      ...(accountType === 'personal'
        ? {
            roles: selectedRoles,
            focusAreas: selectedFocusAreas,
            lifeMoments: lifeMoments.filter((m) => m !== 'none'),
            otherNeeds: otherNeeds.trim() || null,
            otherRoleDetail: otherRoleDetail.trim() || null,
            otherFocusAreaDetail: otherFocusAreaDetail.trim() || null,
            otherLifeMomentDetail: otherLifeMomentDetail.trim() || null,
          }
        : {
            orgInfo: { name: orgName, type: orgType || (orgTypeOtherDetail.trim() ? 'other' : '') },
            orgFocusAreas,
            orgOtherNeeds: orgOtherNeeds.trim() || null,
            orgOtherFocusAreaDetail: orgOtherFocusAreaDetail.trim() || null,
            orgTypeOtherDetail: orgTypeOtherDetail.trim() || null,
          }),
    };
    try {
      await supabase.from('user_settings').upsert(
        {
          user_id: userId,
          persona,
          account_type: accountType,
          ...(accountType === 'organization' ? { org_info: { name: orgName, type: orgType || (orgTypeOtherDetail.trim() ? 'other' : '') } } : {}),
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    } catch (err) {
      console.error('Failed to save persona:', err);
    }
    localStorage.setItem(`welcomeGuide_${userId}`, 'true');
    setSaving(false);
    onComplete?.(persona);
  };

  const handleSkip = () => {
    if (!isRetake) localStorage.setItem(`welcomeGuide_${userId}`, 'true');
    onComplete?.(null);
  };

  const stepOrder =
    accountType === 'personal'
      ? ['welcome', 'account_type', 'roles', 'focus_areas', 'life_moments', 'other_needs']
      : ['welcome', 'account_type', 'org_info', 'org_focus_areas', 'other_needs'];

  const visibleSteps = isRetake ? stepOrder.slice(1) : stepOrder;
  const currentIdx = visibleSteps.indexOf(step);

  const canGoNext = () => {
    switch (step) {
      case 'account_type':
        return !!accountType;
      case 'roles':
        return selectedRoles.length > 0 || otherRoleDetail.trim().length > 0;
      case 'focus_areas':
        return selectedFocusAreas.length > 0 || otherFocusAreaDetail.trim().length > 0;
      case 'life_moments':
        return true;
      case 'org_info':
        return orgName.trim() && (orgType || orgTypeOtherDetail.trim().length > 0);
      case 'org_focus_areas':
        return orgFocusAreas.length > 0 || orgOtherFocusAreaDetail.trim().length > 0;
      case 'other_needs':
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (step === 'account_type') setStep(accountType === 'personal' ? 'roles' : 'org_info');
    else if (step === 'roles') setStep('focus_areas');
    else if (step === 'focus_areas') setStep('life_moments');
    else if (step === 'life_moments') setStep('other_needs');
    else if (step === 'org_info') setStep('org_focus_areas');
    else if (step === 'org_focus_areas') setStep('other_needs');
  };

  const goBack = () => {
    if (step === 'roles' || step === 'org_info') setStep('account_type');
    else if (step === 'focus_areas') setStep('roles');
    else if (step === 'life_moments') setStep('focus_areas');
    else if (step === 'other_needs') setStep(accountType === 'personal' ? 'life_moments' : 'org_focus_areas');
    else if (step === 'org_focus_areas') setStep('org_info');
    else if (step === 'account_type' && !isRetake) setStep('welcome');
  };

  return (
    <div className="welcome-guide-overlay">
      <div className="welcome-guide onboarding-quiz">
        <button type="button" className="guide-close" onClick={handleSkip} aria-label="Skip">
          <X size={20} />
        </button>

        <div className="guide-progress">
          {visibleSteps.map((s, i) => (
            <div key={s} className={`progress-dot ${s === step ? 'active' : ''} ${i < currentIdx ? 'completed' : ''}`} />
          ))}
        </div>

        {step === 'welcome' && (
          <WelcomeStepWelcome onSkip={handleSkip} onNext={() => setStep('account_type')} />
        )}

        {step === 'account_type' && (
          <WelcomeStepAccountType
            accountType={accountType}
            setAccountType={setAccountType}
            isRetake={isRetake}
            onBack={isRetake ? handleSkip : () => setStep('welcome')}
            onNext={goNext}
            canGoNext={canGoNext()}
          />
        )}

        {step === 'roles' && (
          <WelcomeStepRoles
            selectedRoles={selectedRoles}
            toggleRole={toggleItem(setSelectedRoles)}
            otherRoleDetail={otherRoleDetail}
            setOtherRoleDetail={setOtherRoleDetail}
            onBack={goBack}
            onNext={goNext}
            canGoNext={canGoNext()}
          />
        )}

        {step === 'focus_areas' && (
          <WelcomeStepFocusAreas
            selectedFocusAreas={selectedFocusAreas}
            toggleFocusArea={toggleItem(setSelectedFocusAreas)}
            otherFocusAreaDetail={otherFocusAreaDetail}
            setOtherFocusAreaDetail={setOtherFocusAreaDetail}
            onBack={goBack}
            onNext={goNext}
            canGoNext={canGoNext()}
          />
        )}

        {step === 'life_moments' && (
          <WelcomeStepLifeMoments
            lifeMoments={lifeMoments}
            setLifeMoments={setLifeMoments}
            otherLifeMomentDetail={otherLifeMomentDetail}
            setOtherLifeMomentDetail={setOtherLifeMomentDetail}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === 'other_needs' && (
          <WelcomeStepOtherNeeds
            accountType={accountType}
            orgName={orgName}
            otherNeeds={otherNeeds}
            setOtherNeeds={setOtherNeeds}
            orgOtherNeeds={orgOtherNeeds}
            setOrgOtherNeeds={setOrgOtherNeeds}
            onBack={goBack}
            onFinish={handleFinish}
            saving={saving}
          />
        )}

        {step === 'org_info' && (
          <WelcomeStepOrgInfo
            orgName={orgName}
            setOrgName={setOrgName}
            orgType={orgType}
            setOrgType={setOrgType}
            orgTypeOtherDetail={orgTypeOtherDetail}
            setOrgTypeOtherDetail={setOrgTypeOtherDetail}
            onBack={goBack}
            onNext={goNext}
            canGoNext={canGoNext()}
          />
        )}

        {step === 'org_focus_areas' && (
          <WelcomeStepOrgFocusAreas
            orgFocusAreas={orgFocusAreas}
            toggleOrgFocusArea={toggleItem(setOrgFocusAreas)}
            orgOtherFocusAreaDetail={orgOtherFocusAreaDetail}
            setOrgOtherFocusAreaDetail={setOrgOtherFocusAreaDetail}
            onBack={goBack}
            onNext={goNext}
            canGoNext={canGoNext()}
          />
        )}
      </div>
    </div>
  );
}
