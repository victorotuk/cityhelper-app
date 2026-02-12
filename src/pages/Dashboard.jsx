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
  Bot,
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
  const navigate = useNavigate();

  const COUNTRY_LABELS = { ca: 'Canada', us: 'United States' };
  const COUNTRY_FLAGS = { ca: '🇨🇦', us: '🇺🇸' };

  // Fetch user country settings
  const refreshCountry = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_settings').select('country, countries').eq('user_id', user.id).single();
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
    const catId = ['personal_tax', 'business_tax'].includes(item.category) ? 'tax' : item.category;
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
          <span className="header-email">{user?.email}</span>
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
          <Link to="/assistant" onClick={() => setShowMenu(false)}>
            <Bot size={18} /> AI Assistant
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
          <Link to="/assistant" className="quick-action">
            <Bot size={20} />
            <span>AI Assistant</span>
          </Link>
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

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card overdue">
            <AlertTriangle size={24} />
            <div className="stat-content">
              <span className="stat-number">{groupedItems.overdue.length + groupedItems.urgent.length}</span>
              <span className="stat-label">Need Attention</span>
            </div>
          </div>
          <div className="stat-card warning">
            <Clock size={24} />
            <div className="stat-content">
              <span className="stat-number">{groupedItems.warning.length}</span>
              <span className="stat-label">Coming Up</span>
            </div>
          </div>
          <div className="stat-card ok">
            <CheckCircle size={24} />
            <div className="stat-content">
              <span className="stat-number">{groupedItems.ok.length}</span>
              <span className="stat-label">All Good</span>
            </div>
          </div>
          <div className="stat-card total">
            <FileText size={24} />
            <div className="stat-content">
              <span className="stat-number">{items.length}</span>
              <span className="stat-label">Total Items</span>
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="items-list">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>Welcome — what would you like to track?</h3>
              <p>CityHelper keeps all your important deadlines in one place. Tap a category to get started:</p>
              <div className="category-suggestions">
                {APP_CONFIG.categories.slice(0, 8).map(cat => {
                  const examples = {
                    immigration: 'Work permits, visas, PR cards',
                    tax: 'Tax deadlines, T4 filing dates',
                    driving: 'License renewals, registration',
                    parking: 'Parking tickets & fines',
                    health: 'Health card, prescriptions',
                    retirement_estate: 'Wills, insurance policies',
                    housing: 'Rent, internet, phone bills',
                    office: 'Leases, insurance, utilities'
                  };
                  const emojis = {
                    immigration: '✈️', tax: '💰', driving: '🚗', parking: '🅿️',
                    health: '❤️', retirement_estate: '📜', housing: '🏡', office: '💼'
                  };
                  return (
                    <button
                      key={cat.id}
                      className="category-suggestion"
                      onClick={() => {
                        requireCountryForTracking(() => {
                          setShowAddModal(true);
                          setSelectedCategory(cat.id);
                        });
                      }}
                    >
                      <span className="cat-sug-icon">{emojis[cat.id] || '📌'}</span>
                      <span className="cat-sug-name">{cat.name}</span>
                      <span className="cat-sug-examples">{examples[cat.id] || ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
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
                      await supabase.from('user_settings').upsert({
                        user_id: user.id,
                        country: c.id,
                        updated_at: new Date().toISOString()
                      }, { onConflict: 'user_id' });
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
          onComplete={() => setShowWelcome(false)} 
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
  const catId = ['personal_tax', 'business_tax'].includes(item.category) ? 'tax' : item.category;
  const category = APP_CONFIG.categories.find(c => c.id === catId);
  const payHandler = onPay?.(catId);
  const renewalUrl = onRenew && userCountry ? getRenewalUrl(item.name, userCountry) : null;
  
  const getCategoryEmoji = (id) => {
    const emojis = {
      immigration: '✈️', tax: '💰', personal_tax: '💰', business_tax: '💰',
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

function AddItemModal({ onClose, onAdd, selectedCategory, setSelectedCategory }) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [payPhone, setPayPhone] = useState('');

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
      tax: `Extract from this tax document and return ONLY JSON:
{"documentType":"T4/T5/T2/receipt","year":"","amount":"","dueDate":"YYYY-MM-DD"}`,
      business_license: `Extract from this license and return ONLY JSON:
{"businessName":"","licenseNumber":"","expiryDate":"YYYY-MM-DD","type":""}`,
      retirement_estate: `Extract from this estate/retirement document and return ONLY JSON:
{"documentType":"will/trust/insurance/policy","provider":"","policyNumber":"","beneficiary":"","expiryDate":"YYYY-MM-DD","reviewDate":""}`,
    };
    return prompts[selectedCategory] || `Extract key info and return JSON: {"name":"","number":"","expiryDate":"YYYY-MM-DD","type":""}`;
  };

  const handleExtracted = (data) => {
    // Auto-fill form based on extracted data
    if (data.documentType) setName(data.documentType);
    if (data.name && !name) setName(data.name);
    if (data.expiryDate) setDueDate(data.expiryDate);
    if (data.dueDate) setDueDate(data.dueDate);
    
    // Build notes from other extracted data
    const notesParts = [];
    if (data.number) notesParts.push(`Number: ${data.number}`);
    if (data.cardNumber) notesParts.push(`Card #: ${data.cardNumber}`);
    if (data.licenseNumber) notesParts.push(`License #: ${data.licenseNumber}`);
    if (data.issueDate) notesParts.push(`Issued: ${data.issueDate}`);
    if (notesParts.length) setNotes(notesParts.join('\n'));
  };

  const templates = selectedCategory ? APP_CONFIG.templates[selectedCategory] || [] : [];
  
  const getCategoryEmoji = (catId) => {
    const emojis = {
      immigration: '✈️', tax: '💰', driving: '🚗', parking: '🅿️', health: '❤️', retirement_estate: '📜', housing: '🏡',
      office: '💼', business_license: '📋', property: '🏠', 
      professional: '🎓', other: '📌'
    };
    return emojis[catId] || '📌';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{selectedCategory ? 'Add Item' : 'Choose Category'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {!selectedCategory ? (
          <div className="category-picker">
            {APP_CONFIG.categories.map(cat => (
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
