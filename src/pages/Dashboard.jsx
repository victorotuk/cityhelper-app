import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useComplianceStore } from '../stores/complianceStore';
import { APP_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';
import { format, differenceInDays, parseISO } from 'date-fns';
import { 
  Plus, 
  LogOut, 
  Calendar, 
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  FileText,
  Trash2,
  Calculator,
  Folder,
  Menu,
  Settings,
  CalendarPlus,
  Download,
  Copy,
  CreditCard,
  ChevronDown,
  Globe,
  ExternalLink,
  RefreshCw,
  Phone
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import WelcomeGuide from '../components/WelcomeGuide';
import DisputeTicket from '../components/DisputeTicket';
import PayTicket from '../components/PayTicket';
import { parseTicketFromNotes } from '../lib/payTicketUtils';
import ScanUpload from '../components/ScanUpload';
import { addToGoogleCalendar, exportAllToCalendar } from '../lib/calendar';

export default function Dashboard() {
  const { user, signOut } = useAuthStore();
  const { items, loading, fetchItems, addItem, deleteItem } = useComplianceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payInitialValues, setPayInitialValues] = useState({});
  const [showCountryRequired, setShowCountryRequired] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  const [userCountries, setUserCountries] = useState([]); // primary + other countries
  const [activeCountry, setActiveCountry] = useState(null); // current switch (for multi-country)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [persona, setPersona] = useState(null);
  const navigate = useNavigate();

  const COUNTRY_LABELS = { ca: 'Canada', us: 'United States' };
  const COUNTRY_FLAGS = { ca: '🇨🇦', us: '🇺🇸' };

  // Fetch user country settings + persona
  const refreshCountry = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_settings').select('country, countries, persona').eq('user_id', user.id).single();
    if (data?.persona) setPersona(data.persona);
    const primary = data?.country || null;
    const others = Array.isArray(data?.countries) ? data.countries : [];
    const list = primary ? [primary, ...others].filter((c, i, a) => a.indexOf(c) === i) : others.filter((c, i, a) => a.indexOf(c) === i);
    setUserCountry(primary);
    setUserCountries(list);
    const stored = localStorage.getItem(`cityhelper_active_country_${user.id}`);
    const valid = list.includes(stored);
    setActiveCountry(valid ? stored : (primary || list[0] || null));
    if (stored && !valid) localStorage.setItem(`cityhelper_active_country_${user.id}`, primary || list[0] || '');
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchItems(user.id);
    queueMicrotask(() => refreshCountry());
    
    // Check if new user (show welcome guide)
    const hasSeenGuide = localStorage.getItem(`welcomeGuide_${user.id}`);
    if (!hasSeenGuide) queueMicrotask(() => setShowWelcome(true));
    
    // Update last_active for reminder tracking
    const updateLastActive = async () => {
      try {
        await supabase
          .from('user_settings')
          .upsert({ 
            user_id: user.id, 
            last_active: new Date().toISOString() 
          }, { 
            onConflict: 'user_id' 
          });
      } catch {
        // Silently fail - not critical
      }
    };
    updateLastActive();

    // Re-fetch country when user returns from Settings (tab/window focus)
    const handleFocus = () => refreshCountry();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, navigate, fetchItems]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAddItem = async (item) => {
    try {
      await addItem({
        ...item,
        user_id: user.id,
        created_at: new Date().toISOString()
      });
      setShowAddModal(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Failed to add item:', err);
      alert('Error adding item: ' + err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Delete this item?')) {
      await deleteItem(id);
    }
  };

  const requireCountryForTracking = (then) => {
    if (!userCountry) {
      setShowCountryRequired(true);
      return;
    }
    then();
  };

  const handleOpenAddModal = () => requireCountryForTracking(() => setShowAddModal(true));

  const setActiveCountryAndSave = (code) => {
    setActiveCountry(code);
    if (user?.id) localStorage.setItem(`cityhelper_active_country_${user.id}`, code);
    setShowCountryDropdown(false);
  };

  const handleCopyItem = (item) => {
    const catId = ['personal_trust', 'business_trust'].includes(item.category) ? 'trust' : item.category;
    const category = APP_CONFIG.categories.find(c => c.id === catId);
    const text = `${item.name}\nCategory: ${category?.name || 'General'}\nDue: ${item.due_date ? format(parseISO(item.due_date), 'MMMM d, yyyy') : 'No date set'}\n${item.notes ? `Notes: ${item.notes}` : ''}`;
    navigator.clipboard.writeText(text);
    // Show brief feedback
    const btn = document.activeElement;
    if (btn) {
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1500);
    }
  };

  const getStatusInfo = (dueDate) => {
    if (!dueDate) return { status: 'ok', label: 'No date', color: '#64748b', days: null };
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return { status: 'overdue', label: `${Math.abs(days)}d overdue`, color: '#dc2626', days };
    if (days <= 14) return { status: 'urgent', label: `${days}d left`, color: '#dc2626', days };
    if (days <= 30) return { status: 'warning', label: `${days}d left`, color: '#f59e0b', days };
    return { status: 'ok', label: `${days}d left`, color: '#10b981', days };
  };

  const groupedItems = {
    overdue: items.filter(i => getStatusInfo(i.due_date).status === 'overdue'),
    urgent: items.filter(i => getStatusInfo(i.due_date).status === 'urgent'),
    warning: items.filter(i => getStatusInfo(i.due_date).status === 'warning'),
    ok: items.filter(i => getStatusInfo(i.due_date).status === 'ok')
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <Link to="/dashboard" className="header-brand">
          <span className="header-logo">{APP_CONFIG.logo}</span>
          <span className="header-name">{APP_CONFIG.name}</span>
        </Link>
        <div className="header-actions">
          {userCountries.length >= 2 && (
            <div className="country-switcher-wrap">
              <button
                type="button"
                className="btn btn-ghost btn-sm country-switcher"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                aria-expanded={showCountryDropdown}
                aria-haspopup="listbox"
              >
                <Globe size={16} />
                <span>{COUNTRY_FLAGS[activeCountry] || ''} {COUNTRY_LABELS[activeCountry] || activeCountry}</span>
                <ChevronDown size={16} className={showCountryDropdown ? 'open' : ''} />
              </button>
              {showCountryDropdown && (
                <>
                  <div className="country-dropdown-backdrop" onClick={() => setShowCountryDropdown(false)} />
                  <div className="country-dropdown" role="listbox">
                    {userCountries.map(code => (
                      <button
                        key={code}
                        type="button"
                        className={`country-dropdown-item ${activeCountry === code ? 'active' : ''}`}
                        onClick={() => setActiveCountryAndSave(code)}
                        role="option"
                        aria-selected={activeCountry === code}
                      >
                        <span>{COUNTRY_FLAGS[code] || ''}</span>
                        <span>{COUNTRY_LABELS[code] || code}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <span className="header-email">
            {persona?.accountType === 'organization' && persona?.orgInfo?.name
              ? persona.orgInfo.name
              : user?.email}
          </span>
          <NotificationBell />
          <Link to="/settings" className="btn btn-ghost btn-sm" title="Settings">
            <Settings size={18} />
          </Link>
          <button className="btn btn-ghost btn-sm menu-toggle" onClick={() => setShowMenu(!showMenu)}>
            <Menu size={18} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="mobile-menu">
          <Link to="/apply" onClick={() => setShowMenu(false)}>
            <FileText size={18} /> Apply for Permits
          </Link>
          <Link to="/tax-estimator" onClick={() => setShowMenu(false)}>
            <Calculator size={18} /> Tax Estimator
          </Link>
          <Link to="/documents" onClick={() => setShowMenu(false)}>
            <Folder size={18} /> Documents
          </Link>
          <Link to="/settings" onClick={() => setShowMenu(false)}>
            <Settings size={18} /> Settings
          </Link>
        </div>
      )}

      {/* Main */}
      <main className="dashboard-main">
        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="quick-action primary" onClick={handleOpenAddModal}>
            <Plus size={20} />
            <span>Track Item</span>
          </button>
          <Link to="/documents" className="quick-action">
            <Folder size={20} />
            <span>Documents</span>
          </Link>
          <Link to="/tax-estimator" className="quick-action">
            <Calculator size={20} />
            <span>Tax Estimator</span>
          </Link>
          <Link to="/apply" className="quick-action">
            <FileText size={20} />
            <span>Apply</span>
          </Link>
          <button 
            className="quick-action" 
            onClick={() => exportAllToCalendar(items)}
            disabled={items.length === 0}
          >
            <Download size={20} />
            <span>Export Calendar</span>
          </button>
        </div>

        {/* Compliance Health */}
        <ComplianceHealth items={items} groupedItems={groupedItems} />

        {/* Personalized suggestions */}
        {persona?.recommendedCategories && items.length > 0 && (
          <SuggestedForYou
            persona={persona}
            items={items}
            onAdd={(catId) => { requireCountryForTracking(() => { setShowAddModal(true); setSelectedCategory(catId); }); }}
          />
        )}

        {/* Items list */}
        <div className="items-list">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : items.length === 0 ? (
            <EmptyState requireCountryForTracking={requireCountryForTracking} setShowAddModal={setShowAddModal} setSelectedCategory={setSelectedCategory} persona={persona} />
          ) : (
            <>
              {(groupedItems.overdue.length > 0 || groupedItems.urgent.length > 0) && (
                <div className="items-section urgent">
                  <h3><AlertTriangle size={18} /> Needs Attention</h3>
                  {[...groupedItems.overdue, ...groupedItems.urgent].map(item => (
                    <ItemCard key={item.id} item={item} getStatusInfo={getStatusInfo} onDelete={handleDeleteItem} onAddToCalendar={addToGoogleCalendar} onCopy={handleCopyItem} onPay={catId => catId === 'parking' ? () => { setPayInitialValues(parseTicketFromNotes(item.notes)); setShowPayModal(true); } : null} onRenew={(url) => url && window.open(url, '_blank')} userCountry={activeCountry} />
                  ))}
                </div>
              )}

              {groupedItems.warning.length > 0 && (
                <div className="items-section warning">
                  <h3><Clock size={18} /> Coming Up (30 days)</h3>
                  {groupedItems.warning.map(item => (
                    <ItemCard key={item.id} item={item} getStatusInfo={getStatusInfo} onDelete={handleDeleteItem} onAddToCalendar={addToGoogleCalendar} onCopy={handleCopyItem} onPay={catId => catId === 'parking' ? () => { setPayInitialValues(parseTicketFromNotes(item.notes)); setShowPayModal(true); } : null} onRenew={(url) => url && window.open(url, '_blank')} userCountry={activeCountry} />
                  ))}
                </div>
              )}

              {groupedItems.ok.length > 0 && (
                <div className="items-section ok">
                  <h3><CheckCircle size={18} /> All Good</h3>
                  {groupedItems.ok.map(item => (
                    <ItemCard key={item.id} item={item} getStatusInfo={getStatusInfo} onDelete={handleDeleteItem} onAddToCalendar={addToGoogleCalendar} onCopy={handleCopyItem} onPay={catId => catId === 'parking' ? () => { setPayInitialValues(parseTicketFromNotes(item.notes)); setShowPayModal(true); } : null} onRenew={(url) => url && window.open(url, '_blank')} userCountry={activeCountry} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Country required — inline picker so users don't leave Dashboard */}
      {showCountryRequired && (
        <div className="modal-overlay" onClick={() => setShowCountryRequired(false)}>
          <div className="modal country-required-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select your country</h2>
              <button className="btn-icon" onClick={() => setShowCountryRequired(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p className="modal-body-text">
                Which country do you need to track compliance for?
              </p>
              <div className="country-picker-inline">
                {[{ id: 'ca', name: 'Canada', flag: '🇨🇦' }, { id: 'us', name: 'United States', flag: '🇺🇸' }].map(c => (
                  <button
                    key={c.id}
                    className="country-pick-btn"
                    onClick={async () => {
                      const { error: saveErr } = await supabase.from('user_settings').upsert({
                        user_id: user.id,
                        country: c.id,
                        updated_at: new Date().toISOString()
                      }, { onConflict: 'user_id' });
                      if (saveErr) {
                        console.error('[Dashboard] Country save failed:', saveErr);
                        alert('Could not save country: ' + saveErr.message);
                        return;
                      }
                      setUserCountry(c.id);
                      setActiveCountry(c.id);
                      setUserCountries(prev => prev.includes(c.id) ? prev : [c.id, ...prev]);
                      localStorage.setItem(`cityhelper_active_country_${user.id}`, c.id);
                      setShowCountryRequired(false);
                      // Now open the add modal since that's what they wanted
                      setShowAddModal(true);
                    }}
                  >
                    <span className="country-pick-flag">{c.flag}</span>
                    <span className="country-pick-name">{c.name}</span>
                  </button>
                ))}
              </div>
              <p className="modal-body-text soft" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '12px' }}>
                You can add more countries anytime in Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddItemModal 
          onClose={() => { setShowAddModal(false); setSelectedCategory(null); }}
          onAdd={handleAddItem}
          selectedCategory={selectedCategory}
          accountType={persona?.accountType}
          setSelectedCategory={setSelectedCategory}
        />
      )}

      {/* Dispute Ticket Modal */}
      {showDisputeModal && (
        <DisputeTicket 
          onClose={() => setShowDisputeModal(false)}
          onAddItem={async (item) => {
            await addItem(item);
            setShowDisputeModal(false);
          }}
        />
      )}

      {/* Pay Ticket Modal */}
      {showPayModal && (
        <PayTicket onClose={() => setShowPayModal(false)} initialValues={payInitialValues} />
      )}

      {/* Welcome Guide for new users */}
      {showWelcome && (
        <WelcomeGuide 
          userId={user.id} 
          onComplete={(p) => { setShowWelcome(false); if (p) setPersona(p); }} 
        />
      )}
    </div>
  );
}

const PROVINCE_NAME_TO_CODE = {
  ontario: 'ON', 'british columbia': 'BC', 'b.c.': 'BC', bc: 'BC',
  alberta: 'AB', ab: 'AB', quebec: 'QC', qc: 'QC', manitoba: 'MB', mb: 'MB',
  saskatchewan: 'SK', sk: 'SK', 'nova scotia': 'NS', ns: 'NS',
  'new brunswick': 'NB', nb: 'NB', 'newfoundland': 'NL', nl: 'NL',
  'prince edward island': 'PE', pei: 'PE', pe: 'PE',
  yukon: 'YT', yt: 'YT', 'northwest territories': 'NT', nt: 'NT',
  nunavut: 'NU', nu: 'NU',
  'new york': 'NY', ny: 'NY', california: 'CA', ca: 'CA', texas: 'TX', tx: 'TX',
  florida: 'FL', fl: 'FL', illinois: 'IL', il: 'IL', pennsylvania: 'PA', pa: 'PA',
  arizona: 'AZ', az: 'AZ', washington: 'WA', wa: 'WA', massachusetts: 'MA', ma: 'MA'
};

/** Get renewal URL for an item. Returns URL or null. */
function getRenewalUrl(itemName, country) {
  const portals = APP_CONFIG.renewalPortals?.[country];
  if (!portals) return null;
  const name = (itemName || '').trim();
  for (const [key, val] of Object.entries(portals)) {
    if (name === key || name.toLowerCase().includes(key.toLowerCase())) {
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val !== null) {
        const prov2Match = name.match(/\(([A-Z]{2})\)/);
        let prov = prov2Match ? prov2Match[1] : null;
        if (!prov) {
          const provNameMatch = name.match(/\(([^)]+)\)/);
          if (provNameMatch) {
            const p = provNameMatch[1].toLowerCase().trim();
            prov = PROVINCE_NAME_TO_CODE[p] || null;
          }
        }
        return val[prov] || val.default || null;
      }
    }
  }
  return null;
}

function ItemCard({ item, getStatusInfo, onDelete, onAddToCalendar, onCopy, onPay, onRenew, userCountry }) {
  const statusInfo = getStatusInfo(item.due_date);
  const catId = ['personal_trust', 'business_trust'].includes(item.category) ? 'trust' : item.category;
  const category = APP_CONFIG.categories.find(c => c.id === catId);
  const payHandler = onPay?.(catId);
  const renewalUrl = onRenew && userCountry ? getRenewalUrl(item.name, userCountry) : null;
  
  const getCategoryEmoji = (id) => {
    const emojis = {
      immigration: '✈️', trust: '🏛️', personal_trust: '🏛️', business_trust: '🏛️',
      driving: '🚗', parking: '🅿️', health: '❤️', retirement_estate: '📜', housing: '🏡',
      office: '💼', business_license: '📋', property: '🏠', 
      professional: '🎓', other: '📌'
    };
    return emojis[id] || '📌';
  };

  return (
    <div className={`item-card ${statusInfo.status}`}>
      <div className="item-icon" style={{ background: category?.color || '#64748b' }}>
        {getCategoryEmoji(catId)}
      </div>
      <div className="item-content">
        <h4>{item.name}</h4>
        <span className="item-category">{category?.name || 'Other'}</span>
        {item.due_date && (
          <span className="item-date">Due: {format(parseISO(item.due_date), 'MMM d, yyyy')}</span>
        )}
      </div>
      <div className="item-status">
        <span className={`status-badge ${statusInfo.status}`}>{statusInfo.label}</span>
        <div className="item-actions">
          {payHandler && (
            <button className="btn-icon" onClick={payHandler} title="Pay ticket">
              <CreditCard size={16} />
            </button>
          )}
          {renewalUrl && (
            <button className="btn-icon" onClick={() => onRenew(renewalUrl)} title="Renew now">
              <RefreshCw size={16} />
            </button>
          )}
          {item.pay_url && (
            <button className="btn-icon" onClick={() => window.open(item.pay_url, '_blank')} title={`Pay online: ${item.pay_url}`}>
              <CreditCard size={16} />
            </button>
          )}
          {item.pay_phone && (
            <a className="btn-icon" href={`tel:${item.pay_phone.replace(/[^\d+]/g, '')}`} title={`Call to pay: ${item.pay_phone}`}>
              <Phone size={16} />
            </a>
          )}
          <button 
            className="btn-icon" 
            onClick={() => onCopy(item)} 
            title="Copy to share"
          >
            <Copy size={16} />
          </button>
          {item.due_date && (
            <button 
              className="btn-icon" 
              onClick={() => onAddToCalendar(item)} 
              title="Add to Google Calendar"
            >
              <CalendarPlus size={16} />
            </button>
          )}
          <button className="btn-icon" onClick={() => onDelete(item.id)} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

const BILL_CATEGORIES = ['housing', 'office', 'property'];

function AddItemModal({ onClose, onAdd, selectedCategory, setSelectedCategory, accountType }) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [activeGroup, setActiveGroup] = useState(accountType === 'organization' ? 'business' : 'personal');

  const isBillCategory = BILL_CATEGORIES.includes(selectedCategory);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      name,
      category: selectedCategory,
      due_date: dueDate || null,
      notes: notes || null,
      pay_url: payUrl.trim() || null,
      pay_phone: payPhone.trim() || null
    });
  };

  // Get the right extraction prompt based on category
  const getExtractPrompt = () => {
    const prompts = {
      immigration: `Extract from this document and return ONLY JSON:
{"documentType":"visa/permit/passport","name":"","number":"","expiryDate":"YYYY-MM-DD","issueDate":""}`,
      driving: `Extract from this license/registration and return ONLY JSON:
{"documentType":"","name":"","number":"","expiryDate":"YYYY-MM-DD","class":""}`,
      health: `Extract from this health card and return ONLY JSON:
{"name":"","cardNumber":"","expiryDate":"YYYY-MM-DD"}`,
      trust: `Extract from this trust, estate, or tax document and return ONLY JSON:
{"documentType":"trust/will/POA/T4/T5/receipt","name":"","trustee":"","beneficiary":"","amount":"","expiryDate":"YYYY-MM-DD","reviewDate":"YYYY-MM-DD"}`,
      business_trust: `Extract from this business trust, shareholder, or tax document and return ONLY JSON:
{"documentType":"trust/shareholder-agreement/T2/HST/GST/succession","businessName":"","trustee":"","amount":"","dueDate":"YYYY-MM-DD","period":""}`,
      employees: `Extract from this employee/HR document and return ONLY JSON:
{"documentType":"contract/permit/check/certification","employeeName":"","position":"","startDate":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD","number":""}`,
      assets: `Extract from this asset/equipment document and return ONLY JSON:
{"documentType":"lease/warranty/registration/license","assetName":"","value":"","purchaseDate":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD","number":""}`,
      liabilities: `Extract from this financial obligation document and return ONLY JSON:
{"documentType":"loan/lease/invoice/statement","creditor":"","amount":"","dueDate":"YYYY-MM-DD","accountNumber":""}`,
      business_insurance: `Extract from this insurance document and return ONLY JSON:
{"documentType":"liability/E&O/auto/WSIB/cyber/D&O","insurer":"","policyNumber":"","expiryDate":"YYYY-MM-DD","premium":"","coverage":""}`,
      business_license: `Extract from this license and return ONLY JSON:
{"businessName":"","licenseNumber":"","expiryDate":"YYYY-MM-DD","type":""}`,
      inst_regulatory: `Extract from this regulatory/accreditation document and return ONLY JSON:
{"documentType":"inspection/accreditation/audit/compliance","authority":"","referenceNumber":"","expiryDate":"YYYY-MM-DD","nextReviewDate":"YYYY-MM-DD"}`,
      inst_staff: `Extract from this staff compliance document and return ONLY JSON:
{"documentType":"certification/police check/first aid/contract","staffName":"","position":"","expiryDate":"YYYY-MM-DD","issueDate":"YYYY-MM-DD","number":""}`,
      inst_student: `Extract from this student/member services document and return ONLY JSON:
{"documentType":"enrollment/transcript/financial aid/visa","studentName":"","program":"","dueDate":"YYYY-MM-DD","number":""}`,
      inst_finance: `Extract from this institutional finance document and return ONLY JSON:
{"documentType":"grant/funding/budget/tax return","funder":"","amount":"","dueDate":"YYYY-MM-DD","period":""}`,
      inst_safety: `Extract from this safety/inspection document and return ONLY JSON:
{"documentType":"fire/building/elevator/playground","inspector":"","nextInspection":"YYYY-MM-DD","referenceNumber":"","status":""}`,
      inst_facilities: `Extract from this facilities document and return ONLY JSON:
{"documentType":"maintenance/contract/inspection","provider":"","nextService":"YYYY-MM-DD","contractExpiry":"YYYY-MM-DD"}`,
      inst_legal: `Extract from this legal/insurance document and return ONLY JSON:
{"documentType":"insurance/union agreement/privacy/governance","provider":"","policyNumber":"","expiryDate":"YYYY-MM-DD"}`,
      inst_programs: `Extract from this program/curriculum document and return ONLY JSON:
{"documentType":"curriculum/schedule/accreditation","programName":"","deadline":"YYYY-MM-DD","semester":"","items":[{"name":"","date":"YYYY-MM-DD"}]}`,
      inst_sports: `Extract from this sports/recreation document and return ONLY JSON:
{"documentType":"registration/insurance/certification/permit","teamName":"","leagueName":"","personName":"","expiryDate":"YYYY-MM-DD","number":""}`,
      education: `Extract from this school/education document (timetable, syllabus, curriculum, transcript, enrollment) and return ONLY JSON:
{"documentType":"timetable/syllabus/transcript/enrollment","courseName":"","instructor":"","dueDate":"YYYY-MM-DD","examDate":"YYYY-MM-DD","semester":"","items":[{"name":"","date":"YYYY-MM-DD"}]}`,
      work_schedule: `Extract from this work schedule/timetable and return ONLY JSON:
{"documentType":"schedule/timesheet/contract","employer":"","position":"","shifts":[{"day":"","startTime":"","endTime":""}],"startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}`,
      retirement_estate: `Extract from this estate/retirement document and return ONLY JSON:
{"documentType":"will/trust/insurance/policy","provider":"","policyNumber":"","beneficiary":"","expiryDate":"YYYY-MM-DD","reviewDate":""}`,
    };
    return prompts[selectedCategory] || `Extract key info and return JSON: {"name":"","number":"","expiryDate":"YYYY-MM-DD","type":""}`;
  };

  const handleExtracted = (data) => {
    // Auto-fill form based on extracted data
    if (data.courseName) setName(data.courseName);
    else if (data.documentType) setName(data.documentType);
    else if (data.name && !name) setName(data.name);

    if (data.examDate) setDueDate(data.examDate);
    else if (data.expiryDate) setDueDate(data.expiryDate);
    else if (data.dueDate) setDueDate(data.dueDate);
    else if (data.endDate) setDueDate(data.endDate);
    
    // Build notes from all extracted data
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
    // List extracted schedule items/deadlines
    if (Array.isArray(data.items) && data.items.length) {
      notesParts.push('--- Extracted Dates ---');
      data.items.forEach(it => notesParts.push(`${it.name}: ${it.date}`));
    }
    if (Array.isArray(data.shifts) && data.shifts.length) {
      notesParts.push('--- Schedule ---');
      data.shifts.forEach(s => notesParts.push(`${s.day}: ${s.startTime} - ${s.endTime}`));
    }
    if (notesParts.length) setNotes(notesParts.join('\n'));
  };

  const templates = selectedCategory ? APP_CONFIG.templates[selectedCategory] || [] : [];
  
  const getCategoryEmoji = (catId) => {
    const emojis = {
      immigration: '✈️', trust: '🏛️', driving: '🚗', parking: '🅿️', health: '❤️',
      education: '📚', work_schedule: '⏰', retirement_estate: '📜', housing: '🏡',
      business_trust: '🏛️', employees: '👥', assets: '📦', liabilities: '⚠️',
      business_insurance: '🛡️', office: '💼', business_license: '📋', property: '🏠', 
      professional: '🎓', other: '📌',
      inst_regulatory: '🏛️', inst_staff: '👨‍🏫', inst_student: '🎓', inst_finance: '💰',
      inst_safety: '🔥', inst_facilities: '🔧', inst_legal: '⚖️', inst_programs: '📖',
      inst_sports: '🏆'
    };
    return emojis[catId] || '📌';
  };

  const groupedCats = {
    personal: APP_CONFIG.categories.filter(c => c.group === 'personal'),
    business: APP_CONFIG.categories.filter(c => c.group === 'business'),
    institution: APP_CONFIG.categories.filter(c => c.group === 'institution'),
  };
  const visibleCategories = groupedCats[activeGroup] || groupedCats.personal;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{selectedCategory ? 'Add Item' : 'What are you tracking?'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {!selectedCategory ? (
          <div className="category-picker">
            <div className="group-tabs">
              <button
                className={`group-tab ${activeGroup === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveGroup('personal')}
              >
                <span className="group-tab-icon">👤</span>
                Personal
              </button>
              <button
                className={`group-tab ${activeGroup === 'business' ? 'active' : ''}`}
                onClick={() => setActiveGroup('business')}
              >
                <span className="group-tab-icon">💼</span>
                Business
              </button>
              <button
                className={`group-tab ${activeGroup === 'institution' ? 'active' : ''}`}
                onClick={() => setActiveGroup('institution')}
              >
                <span className="group-tab-icon">🏛️</span>
                Institution
              </button>
            </div>
            <div className="category-grid">
              {visibleCategories.map(cat => (
                <button 
                  key={cat.id} 
                  className="category-btn"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{ borderColor: cat.color }}
                >
                  <span className="cat-icon" style={{ background: cat.color }}>
                    {getCategoryEmoji(cat.id)}
                  </span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="add-form">
            {/* Scan/Upload to auto-fill */}
            <ScanUpload 
              onExtracted={handleExtracted}
              extractPrompt={getExtractPrompt()}
            />
            
            <div className="or-divider"><span>or enter manually</span></div>

            {templates.length > 0 && (
              <div className="templates">
                <label>Quick Add:</label>
                <div className="template-btns">
                  {templates.map((t, i) => (
                    <button 
                      key={i} 
                      type="button"
                      className="template-btn"
                      onClick={() => setName(t.name)}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Item Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Driver's License"
                required
              />
            </div>

            <div className="form-group">
              <label>Due/Expiry Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            {isBillCategory && (
              <div className="bill-pay-fields">
                <label>Pay options (optional)</label>
                <div className="form-group">
                  <input
                    type="url"
                    value={payUrl}
                    onChange={e => setPayUrl(e.target.value)}
                    placeholder="https://provider.com/login"
                  />
                  <span className="field-hint">Enter the login or pay URL for this provider</span>
                </div>
                <div className="form-group">
                  <input
                    type="tel"
                    value={payPhone}
                    onChange={e => setPayPhone(e.target.value)}
                    placeholder="1-800-123-4567"
                  />
                  <span className="field-hint">Enter the number you call to pay this bill</span>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedCategory(null)}>
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Add Item
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Empty state with 3 group tabs ───
const EMPTY_EXAMPLES = {
  immigration: 'Work permits, visas, PR cards',
  trust: 'Living trusts, wills, beneficiaries, POA',
  driving: 'License renewals, registration',
  parking: 'Parking tickets & fines',
  health: 'Health card, dental, prescriptions',
  education: 'Exams, assignments, tuition deadlines',
  work_schedule: 'Shifts, pay days, contract dates',
  housing: 'Rent, internet, phone, hydro bills',
  retirement_estate: 'Wills, insurance, pensions',
  other: 'Anything else you need to track',
  employees: 'Onboarding, visas, police checks, payroll',
  business_trust: 'Corporate trusts, shareholder agreements, T2',
  assets: 'Equipment, warranties, software licenses',
  liabilities: 'Loans, invoices, lease payments',
  business_license: 'Municipal license, annual returns, WSIB',
  business_insurance: 'Liability, E&O, cyber, D&O policies',
  office: 'Leases, utilities, equipment',
  property: 'Property tax, municipal fees',
  professional: 'Certifications, designations, CE credits',
  inst_regulatory: 'Inspections, accreditation, audits',
  inst_staff: 'Certifications, police checks, first aid',
  inst_student: 'Report cards, financial aid, visa tracking',
  inst_finance: 'Funding apps, grants, charitable returns',
  inst_safety: 'Fire drills, building inspections, AEDs',
  inst_facilities: 'HVAC, pest control, generator tests',
  inst_legal: 'Insurance, union agreements, privacy',
  inst_programs: 'Curriculum review, exam schedules, field trips',
  inst_sports: 'Registrations, certifications, inspections',
};
const EMPTY_EMOJIS = {
  immigration: '✈️', trust: '🏛️', driving: '🚗', parking: '🅿️', health: '❤️',
  education: '📚', work_schedule: '⏰', housing: '🏡', retirement_estate: '📜', other: '📌',
  employees: '👥', business_trust: '🏛️', assets: '📦', liabilities: '⚠️',
  business_license: '📋', business_insurance: '🛡️', office: '💼', property: '🏠', professional: '🎓',
  inst_regulatory: '🏛️', inst_staff: '👨‍🏫', inst_student: '🎓', inst_finance: '💰',
  inst_safety: '🔥', inst_facilities: '🔧', inst_legal: '⚖️', inst_programs: '📖',
  inst_sports: '🏆',
};

function EmptyState({ requireCountryForTracking, setShowAddModal, setSelectedCategory, persona }) {
  const isOrg = persona?.accountType === 'organization';
  const defaultTab = isOrg ? 'business' : 'personal';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const groups = isOrg
    ? [
        { id: 'business', label: 'Business', icon: '💼' },
        { id: 'institution', label: 'Institution', icon: '🏛️' },
        { id: 'personal', label: 'Personal', icon: '👤' },
      ]
    : [
        { id: 'personal', label: 'Personal', icon: '👤' },
        { id: 'business', label: 'Business', icon: '💼' },
        { id: 'institution', label: 'Institution', icon: '🏛️' },
      ];
  const cats = APP_CONFIG.categories.filter(c => c.group === activeTab);

  const orgName = persona?.orgInfo?.name;
  const headline = isOrg
    ? `${orgName ? orgName + ', everything' : 'Everything'} in order`
    : 'Your life, completely in order';

  return (
    <div className="empty-state">
      <Calendar size={48} />
      <h3>{headline}</h3>
      <p>Never miss a deadline, payment, or renewal again. What do you need to track?</p>
      <div className="empty-group-tabs">
        {groups.map(g => (
          <button
            key={g.id}
            className={`empty-group-tab ${activeTab === g.id ? 'active' : ''}`}
            onClick={() => setActiveTab(g.id)}
          >
            {g.icon} {g.label}
          </button>
        ))}
      </div>
      <div className="category-suggestions">
        {cats.map(cat => (
          <button
            key={cat.id}
            className="category-suggestion"
            onClick={() => { requireCountryForTracking(() => { setShowAddModal(true); setSelectedCategory(cat.id); }); }}
          >
            <span className="cat-sug-icon">{EMPTY_EMOJIS[cat.id] || '📌'}</span>
            <span className="cat-sug-name">{cat.name}</span>
            <span className="cat-sug-examples">{EMPTY_EXAMPLES[cat.id] || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Compliance Health Score ───
function ComplianceHealth({ items, groupedItems }) {
  const total = items.length;
  if (total === 0) return null;

  const overdueCount = groupedItems.overdue.length;
  const urgentCount = groupedItems.urgent.length;
  const warningCount = groupedItems.warning.length;
  const okCount = groupedItems.ok.length;

  // Score: 100 = everything green, lose points for issues
  const score = Math.max(0, Math.round(
    100 - (overdueCount * 25) - (urgentCount * 10) - (warningCount * 3)
  ));

  const getScoreColor = (s) => {
    if (s >= 80) return 'var(--success, #10b981)';
    if (s >= 50) return 'var(--warning, #f59e0b)';
    return 'var(--danger, #dc2626)';
  };

  const getMessage = (s) => {
    if (s === 100) return "Everything's in order. You're on top of it.";
    if (s >= 80) return "Looking good. A few things to keep an eye on.";
    if (s >= 50) return "Some items need your attention soon.";
    if (s >= 25) return "Several deadlines are overdue or urgent.";
    return "You have critical items that need immediate attention.";
  };

  const color = getScoreColor(score);

  return (
    <div className="compliance-health">
      <div className="health-score" style={{ borderColor: color }}>
        <span className="health-number" style={{ color }}>{score}</span>
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

// ─── Suggested For You ───
function SuggestedForYou({ persona, items, onAdd }) {
  const trackedCategories = new Set(items.map(i => i.category));
  
  // Recommend categories user selected but hasn't started tracking
  const suggestions = (persona.recommendedCategories || [])
    .filter(catId => !trackedCategories.has(catId))
    .map(catId => APP_CONFIG.categories.find(c => c.id === catId))
    .filter(Boolean)
    .slice(0, 4);

  if (suggestions.length === 0) return null;

  return (
    <div className="suggested-section">
      <h3 className="suggested-title">Suggested for you</h3>
      <div className="suggested-cards">
        {suggestions.map(cat => (
          <button
            key={cat.id}
            className="suggested-card"
            onClick={() => onAdd(cat.id)}
            style={{ borderLeftColor: cat.color }}
          >
            <span className="suggested-icon">{EMPTY_EMOJIS[cat.id] || '📌'}</span>
            <div className="suggested-text">
              <strong>{cat.name}</strong>
              <small>{EMPTY_EXAMPLES[cat.id] || ''}</small>
            </div>
            <Plus size={16} className="suggested-add" />
          </button>
        ))}
      </div>
    </div>
  );
}
