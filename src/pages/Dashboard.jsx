import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useComplianceStore } from '../stores/complianceStore';
import { useChatOverlayStore } from '../stores/chatOverlayStore';
import { useSharedSuggestStore } from '../stores/sharedSuggestStore';
import { APP_CONFIG } from '../lib/config';
import LogoImg from '../components/ui/LogoImg';
import { supabase } from '../lib/supabase';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { 
  Plus, 
  LogOut, 
  Calendar, 
  AlertTriangle,
  MessageSquarePlus,
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
  Clipboard,
  CreditCard,
  ChevronDown,
  Globe,
  ExternalLink,
  RefreshCw,
  Share2,
  Phone,
  Target,
  Check,
  Edit3,
  User,
  Package,
  Building2,
  History,
  Landmark,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';
import NotificationBell from '../components/common/NotificationBell';
import WelcomeGuide from '../components/welcomeGuide/WelcomeGuide';
import SuggestionBox from '../components/modals/SuggestionBox';
import DisputeTicket from '../components/dispute/DisputeTicket';
import PayTicket from '../components/modals/PayTicket';
import { parseTicketFromNotes } from '../lib/payTicketUtils';
import { parseTextForSuggestion } from '../lib/smartSuggestParse';
import BulkEditModal from '../components/modals/BulkEditModal';
import CalendarImportModal from '../components/modals/CalendarImportModal';
import AuditModal from '../components/modals/AuditModal';
import AISuggestionsCard from '../components/common/AISuggestionsCard';
import ItemCard from '../components/dashboard/ItemCard';
import AddItemModal from '../components/addItem/AddItemModal';
import ComplianceHealth from '../components/dashboard/ComplianceHealth';
import FocusOnThree from '../components/dashboard/FocusOnThree';
import EmptyState from '../components/dashboard/EmptyState';
import SuggestedForYou from '../components/dashboard/SuggestedForYou';
import { addToGoogleCalendar, exportAllToCalendar } from '../lib/calendar';

export default function Dashboard() {
  const { user, signOut } = useAuthStore();
  const { items, loading, fetchItems, addItem, deleteItem, renewItem, snoozeItem, updateItem } = useComplianceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payInitialValues, setPayInitialValues] = useState({});
  const [showCountryRequired, setShowCountryRequired] = useState(false);
  const [showSuggestionBox, setShowSuggestionBox] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  const [userCountries, setUserCountries] = useState([]); // primary + other countries
  const [activeCountry, setActiveCountry] = useState(null); // current switch (for multi-country)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [persona, setPersona] = useState(null);
  const [sharedInitialValues, setSharedInitialValues] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showCalendarImport, setShowCalendarImport] = useState(false);
  const [auditItem, setAuditItem] = useState(null);
  const { pendingText, clearPendingText } = useSharedSuggestStore();
  const setChatContext = useChatOverlayStore((s) => s.setContext);
  const openChatOverlay = useChatOverlayStore((s) => s.open);

  useEffect(() => {
    if (activeCountry) setChatContext({ country: activeCountry });
  }, [activeCountry, setChatContext]);

  const handleAskAI = (item) => {
    openChatOverlay({ selectedItem: item, page: '/dashboard' });
  };

  const toggleBulkSelect = (id, isOwned) => {
    if (!isOwned) return;
    setBulkSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const navigate = useNavigate();
  const location = useLocation();

  // When app was opened via Share (shared text), open Add modal with parsed suggestion
  useEffect(() => {
    if (!pendingText || !user) return;
    const s = parseTextForSuggestion(pendingText);
    clearPendingText();
    if (s) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setSharedInitialValues(s);
      setShowAddModal(true);
      setSelectedCategory(s.category);
    }
  }, [pendingText, user, clearPendingText]);

  const requireCountryForTracking = useCallback((then) => {
    if (!userCountry) {
      setShowCountryRequired(true);
      return;
    }
    then();
  }, [userCountry]);

  // Deep link from Wealth Learn (e.g. "Track a trust") — open Add modal with category
  useEffect(() => {
    const category = location.state?.openAddModalWithCategory;
    if (!category || !user) return;
    navigate(location.pathname, { replace: true, state: {} });
    queueMicrotask(() => {
      requireCountryForTracking(() => {
        setSelectedCategory(category);
        setShowAddModal(true);
      });
    });
  }, [location.state, user, navigate, location.pathname, requireCountryForTracking]);

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
    const stored = localStorage.getItem(`nava_active_country_${user.id}`);
    const valid = list.includes(stored);
    setActiveCountry(valid ? stored : (primary || list[0] || null));
    if (stored && !valid) localStorage.setItem(`nava_active_country_${user.id}`, primary || list[0] || '');
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

  const handleAddItemsFromCalendar = async (itemsToAdd) => {
    try {
      for (const item of itemsToAdd) {
        await addItem(item);
      }
      setShowCalendarImport(false);
      fetchItems(user.id);
    } catch (err) {
      console.error('Failed to add items:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Delete this item?')) {
      await deleteItem(id);
    }
  };

  const handleOpenAddModal = () => requireCountryForTracking(() => setShowAddModal(true));

  const setActiveCountryAndSave = (code) => {
    setActiveCountry(code);
    if (user?.id) localStorage.setItem(`nava_active_country_${user.id}`, code);
    setShowCountryDropdown(false);
  };

  const handleBulkApply = async (updates) => {
    for (const id of bulkSelectedIds) {
      await updateItem(id, updates);
    }
    setBulkSelectedIds(new Set());
    setShowBulkEditModal(false);
    setBulkEditMode(false);
  };

  const handleCopyItem = (item) => {
    const category = APP_CONFIG.categories.find(c => c.id === item.category);
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

  // Filter items by active country (null = legacy, show in all views)
  const filteredItems = activeCountry
    ? items.filter(i => !i.country || i.country === activeCountry)
    : items;

  const groupedItems = {
    overdue: filteredItems.filter(i => getStatusInfo(i.due_date).status === 'overdue'),
    urgent: filteredItems.filter(i => getStatusInfo(i.due_date).status === 'urgent'),
    warning: filteredItems.filter(i => getStatusInfo(i.due_date).status === 'warning'),
    ok: filteredItems.filter(i => getStatusInfo(i.due_date).status === 'ok'),
    completed: filteredItems
      .filter(i => i.last_completed_at)
      .filter(i => {
        const d = new Date(i.last_completed_at);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        return d > cutoff;
      })
      .sort((a, b) => new Date(b.last_completed_at) - new Date(a.last_completed_at))
      .slice(0, 10),
  };

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <Link
          to="/dashboard"
          className="header-brand"
          onClick={(e) => {
            if (location.pathname === '/dashboard') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          {(APP_CONFIG.logoImage || APP_CONFIG.logoImageDark || APP_CONFIG.logoImageLight) ? (
            <LogoImg alt="Nava" className="header-logo-img" />
          ) : (
            <span className="header-logo">{APP_CONFIG.logo}</span>
          )}
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
          <button
            type="button"
            className="btn btn-ghost btn-sm theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
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
          <Link to="/estate" onClick={() => setShowMenu(false)}>
            <User size={18} /> Estate Executors
          </Link>
          <Link to="/assets" onClick={() => setShowMenu(false)}>
            <Package size={18} /> Asset Inventory
          </Link>
          <Link to="/business" onClick={() => setShowMenu(false)}>
            <Building2 size={18} /> Business Entities
          </Link>
          <Link to="/settings" onClick={() => setShowMenu(false)}>
            <Settings size={18} /> Settings
          </Link>
          <button onClick={() => { setShowSuggestionBox(true); setShowMenu(false); }}>
            <MessageSquarePlus size={18} /> Suggest something to track
          </button>
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
          <Link to="/setup" className="quick-action" title="Step-by-step: pick category, fill details, add document">
            <Plus size={20} />
            <span>Set up (step-by-step)</span>
          </Link>
          <Link to="/documents" className="quick-action">
            <Folder size={20} />
            <span>Documents</span>
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
          <button className="quick-action" onClick={() => setShowCalendarImport(true)}>
            <Calendar size={20} />
            <span>Import Calendar</span>
          </button>
          {items.length > 0 && (
            <button
              className={`quick-action ${bulkEditMode ? 'active' : ''}`}
              onClick={() => { setBulkEditMode(!bulkEditMode); setBulkSelectedIds(new Set()); }}
            >
              <Edit3 size={20} />
              <span>Bulk Edit</span>
            </button>
          )}
        </div>

        {/* Compliance Health */}
        <ComplianceHealth items={filteredItems} groupedItems={groupedItems} />

        {/* AI proactive suggestions */}
        <AISuggestionsCard />

        {/* Focus on these 3 (Mial-style priorities) */}
        {filteredItems.length > 0 && (groupedItems.overdue.length > 0 || groupedItems.urgent.length > 0 || groupedItems.warning.length > 0) && (
          <FocusOnThree
            groupedItems={groupedItems}
            getStatusInfo={getStatusInfo}
            onDelete={handleDeleteItem}
            onRenew={renewItem}
            onSnooze={snoozeItem}
            onAddToCalendar={addToGoogleCalendar}
            onCopy={handleCopyItem}
            onPay={(item) => item.category === 'parking' ? () => { setPayInitialValues(parseTicketFromNotes(item.notes)); setShowPayModal(true); } : null}
            userCountry={activeCountry}
            onShared={() => fetchItems(user.id)}
            bulkEditMode={bulkEditMode}
            bulkSelectedIds={bulkSelectedIds}
            toggleBulkSelect={toggleBulkSelect}
            onShowHistory={setAuditItem}
            onAskAI={handleAskAI}
          />
        )}

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
                    <ItemCard key={item.id} item={item} getStatusInfo={getStatusInfo} onDelete={handleDeleteItem} onAddToCalendar={addToGoogleCalendar} onCopy={handleCopyItem} onPay={(i) => i?.category === 'parking' ? () => { setPayInitialValues(parseTicketFromNotes(item.notes)); setShowPayModal(true); } : null} onRenew={(url) => url && window.open(url, '_blank')} userCountry={activeCountry} onMarkDone={() => renewItem(item.id)} onSnooze={(days) => snoozeItem(item.id, addDays(new Date(), days).toISOString())} onShared={() => fetchItems(user.id)} bulkEditMode={bulkEditMode} bulkSelected={bulkSelectedIds.has(item.id)} onBulkToggle={() => toggleBulkSelect(item.id, !item.isShared)} onShowHistory={(i) => setAuditItem(i)} onAskAI={handleAskAI} />
                  ))}
                </div>
              )}

              {groupedItems.warning.length > 0 && (
                <div className="items-section warning">
                  <h3><Clock size={18} /> Coming Up (30 days)</h3>
                  {groupedItems.warning.map(item => (
                    <ItemCard key={item.id} item={item} getStatusInfo={getStatusInfo} onDelete={handleDeleteItem} onAddToCalendar={addToGoogleCalendar} onCopy={handleCopyItem} onPay={(i) => i?.category === 'parking' ? () => { setPayInitialValues(parseTicketFromNotes(item.notes)); setShowPayModal(true); } : null} onRenew={(url) => url && window.open(url, '_blank')} userCountry={activeCountry} onMarkDone={() => renewItem(item.id)} onSnooze={(days) => snoozeItem(item.id, addDays(new Date(), days).toISOString())} onShared={() => fetchItems(user.id)} bulkEditMode={bulkEditMode} bulkSelected={bulkSelectedIds.has(item.id)} onBulkToggle={() => toggleBulkSelect(item.id, !item.isShared)} onShowHistory={(i) => setAuditItem(i)} onAskAI={handleAskAI} />
                  ))}
                </div>
              )}

              {groupedItems.ok.length > 0 && (
                <div className="items-section ok">
                  <h3><CheckCircle size={18} /> All Good</h3>
                  {groupedItems.ok.map(item => (
                    <ItemCard key={item.id} item={item} getStatusInfo={getStatusInfo} onDelete={handleDeleteItem} onAddToCalendar={addToGoogleCalendar} onCopy={handleCopyItem} onPay={(i) => i?.category === 'parking' ? () => { setPayInitialValues(parseTicketFromNotes(item.notes)); setShowPayModal(true); } : null} onRenew={(url) => url && window.open(url, '_blank')} userCountry={activeCountry} onMarkDone={() => renewItem(item.id)} onSnooze={(days) => snoozeItem(item.id, addDays(new Date(), days).toISOString())} onShared={() => fetchItems(user.id)} bulkEditMode={bulkEditMode} bulkSelected={bulkSelectedIds.has(item.id)} onBulkToggle={() => toggleBulkSelect(item.id, !item.isShared)} onShowHistory={setAuditItem} onAskAI={handleAskAI} />
                  ))}
                </div>
              )}

              {groupedItems.completed.length > 0 && (
                <div className="items-section completed">
                  <h3><CheckCircle size={18} /> Recently Completed</h3>
                  <p className="section-desc" style={{ marginBottom: 'var(--space-sm)' }}>Items you marked done in the last 30 days</p>
                  {groupedItems.completed.map(item => (
                    <ItemCard key={item.id} item={item} getStatusInfo={getStatusInfo} onDelete={handleDeleteItem} onAddToCalendar={addToGoogleCalendar} onCopy={handleCopyItem} onPay={(i) => i?.category === 'parking' ? () => { setPayInitialValues(parseTicketFromNotes(item.notes)); setShowPayModal(true); } : null} onRenew={(url) => url && window.open(url, '_blank')} userCountry={activeCountry} onMarkDone={() => renewItem(item.id)} onSnooze={(days) => snoozeItem(item.id, addDays(new Date(), days).toISOString())} onShared={() => fetchItems(user.id)} bulkEditMode={bulkEditMode} bulkSelected={bulkSelectedIds.has(item.id)} onBulkToggle={() => toggleBulkSelect(item.id, !item.isShared)} onShowHistory={setAuditItem} onAskAI={handleAskAI} />
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
                      localStorage.setItem(`nava_active_country_${user.id}`, c.id);
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
          onClose={() => { setShowAddModal(false); setSelectedCategory(null); setSharedInitialValues(null); }}
          onAdd={handleAddItem}
          selectedCategory={selectedCategory}
          accountType={persona?.accountType}
          setSelectedCategory={setSelectedCategory}
          onSuggest={() => { setShowAddModal(false); setShowSuggestionBox(true); }}
          initialValues={sharedInitialValues}
          userId={user?.id}
          activeCountry={activeCountry}
          userCountries={userCountries}
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

      {showSuggestionBox && (
        <SuggestionBox onClose={() => setShowSuggestionBox(false)} />
      )}

      {/* Bulk edit bar */}
      {bulkEditMode && bulkSelectedIds.size > 0 && (
        <div className="bulk-edit-bar">
          <span>{bulkSelectedIds.size} selected</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowBulkEditModal(true)}>
            <Edit3 size={16} /> Edit
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setBulkSelectedIds(new Set()); setBulkEditMode(false); }}>Cancel</button>
        </div>
      )}

      {/* Calendar import modal */}
      {showCalendarImport && (
        <CalendarImportModal
          onClose={() => setShowCalendarImport(false)}
          onAddItems={handleAddItemsFromCalendar}
          userId={user?.id}
        />
      )}

      {/* Audit trail modal */}
      {auditItem && (
        <AuditModal item={auditItem} onClose={() => setAuditItem(null)} />
      )}

      {/* Bulk edit modal */}
      {showBulkEditModal && (
        <BulkEditModal
          selectedIds={Array.from(bulkSelectedIds)}
          itemCount={bulkSelectedIds.size}
          onClose={() => setShowBulkEditModal(false)}
          onApply={handleBulkApply}
          userCountries={userCountries}
        />
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
