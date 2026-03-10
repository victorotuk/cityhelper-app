import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useComplianceStore } from '../stores/complianceStore';
import { useChatOverlayStore } from '../stores/chatOverlayStore';
import { useSharedSuggestStore } from '../stores/sharedSuggestStore';
import { APP_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import {
  Plus, Calendar, X, FileText, Folder, Settings,
  Download, Edit3, LayoutDashboard
} from 'lucide-react';
import { parseTextForSuggestion } from '../lib/smartSuggestParse';
import { parseTicketFromNotes } from '../lib/payTicketUtils';
import { addToGoogleCalendar, exportAllToCalendar } from '../lib/calendar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardItemsList from '../components/dashboard/DashboardItemsList';
import ComplianceHealth from '../components/dashboard/ComplianceHealth';
import FocusOnThree from '../components/dashboard/FocusOnThree';
import SuggestedForYou from '../components/dashboard/SuggestedForYou';
import AISuggestionsCard from '../components/common/AISuggestionsCard';
import WelcomeGuide from '../components/welcomeGuide/WelcomeGuide';
import SuggestionBox from '../components/modals/SuggestionBox';
import DisputeTicket from '../components/dispute/DisputeTicket';
import PayTicket from '../components/modals/PayTicket';
import BulkEditModal from '../components/modals/BulkEditModal';
import CalendarImportModal from '../components/modals/CalendarImportModal';
import AuditModal from '../components/modals/AuditModal';
import AddItemModal from '../components/addItem/AddItemModal';

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
  const [userCountries, setUserCountries] = useState([]);
  const [activeCountry, setActiveCountry] = useState(null);
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
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

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
    if (!user) { navigate('/auth'); return; }
    fetchItems(user.id);
    queueMicrotask(() => refreshCountry());
    const hasSeenGuide = localStorage.getItem(`welcomeGuide_${user.id}`);
    if (!hasSeenGuide) queueMicrotask(() => setShowWelcome(true));
    const updateLastActive = async () => {
      try {
        await supabase.from('user_settings').upsert({
          user_id: user.id, last_active: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch { /* not critical */ }
    };
    updateLastActive();
    const handleFocus = () => refreshCountry();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, navigate, fetchItems]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const handleAddItem = async (item) => {
    try {
      await addItem({ ...item, user_id: user.id, created_at: new Date().toISOString() });
      setShowAddModal(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Failed to add item:', err);
      alert('Error adding item: ' + err.message);
    }
  };

  const handleAddItemsFromCalendar = async (itemsToAdd) => {
    try {
      for (const item of itemsToAdd) await addItem(item);
      setShowCalendarImport(false);
      fetchItems(user.id);
    } catch (err) {
      console.error('Failed to add items:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteItem = async (id) => { if (confirm('Delete this item?')) await deleteItem(id); };
  const handleOpenAddModal = () => requireCountryForTracking(() => setShowAddModal(true));

  const setActiveCountryAndSave = (code) => {
    setActiveCountry(code);
    if (user?.id) localStorage.setItem(`nava_active_country_${user.id}`, code);
    setShowCountryDropdown(false);
  };

  const handleBulkApply = async (updates) => {
    for (const id of bulkSelectedIds) await updateItem(id, updates);
    setBulkSelectedIds(new Set());
    setShowBulkEditModal(false);
    setBulkEditMode(false);
  };

  const handleCopyItem = (item) => {
    const category = APP_CONFIG.categories.find(c => c.id === item.category);
    const text = `${item.name}\nCategory: ${category?.name || 'General'}\nDue: ${item.due_date ? format(parseISO(item.due_date), 'MMMM d, yyyy') : 'No date set'}\n${item.notes ? `Notes: ${item.notes}` : ''}`;
    navigator.clipboard.writeText(text);
    const btn = document.activeElement;
    if (btn) { btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 1500); }
  };

  const getStatusInfo = (dueDate) => {
    if (!dueDate) return { status: 'ok', label: 'No date', color: '#64748b', days: null };
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) return { status: 'overdue', label: `${Math.abs(days)}d overdue`, color: '#dc2626', days };
    if (days <= 14) return { status: 'urgent', label: `${days}d left`, color: '#dc2626', days };
    if (days <= 30) return { status: 'warning', label: `${days}d left`, color: '#f59e0b', days };
    return { status: 'ok', label: `${days}d left`, color: '#10b981', days };
  };

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
      .filter(i => new Date(i.last_completed_at) > new Date(Date.now() - 30 * 86400000))
      .sort((a, b) => new Date(b.last_completed_at) - new Date(a.last_completed_at))
      .slice(0, 10),
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader
        user={user}
        persona={persona}
        theme={theme}
        toggleTheme={toggleTheme}
        onSignOut={handleSignOut}
        userCountries={userCountries}
        activeCountry={activeCountry}
        showCountryDropdown={showCountryDropdown}
        setShowCountryDropdown={setShowCountryDropdown}
        setActiveCountryAndSave={setActiveCountryAndSave}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        setShowSuggestionBox={setShowSuggestionBox}
      />

      <main className="dashboard-main">
        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="quick-action primary" onClick={handleOpenAddModal}>
            <Plus size={20} /><span>Track Item</span>
          </button>
          <Link to="/setup" className="quick-action" title="Step-by-step: pick category, fill details, add document">
            <Plus size={20} /><span>Set up (step-by-step)</span>
          </Link>
          <Link to="/documents" className="quick-action">
            <Folder size={20} /><span>Documents</span>
          </Link>
          <Link to="/apply" className="quick-action">
            <FileText size={20} /><span>Apply</span>
          </Link>
          <button className="quick-action" onClick={() => exportAllToCalendar(items)} disabled={items.length === 0}>
            <Download size={20} /><span>Export Calendar</span>
          </button>
          <button className="quick-action" onClick={() => setShowCalendarImport(true)}>
            <Calendar size={20} /><span>Import Calendar</span>
          </button>
          {items.length > 0 && (
            <button className={`quick-action ${bulkEditMode ? 'active' : ''}`} onClick={() => { setBulkEditMode(!bulkEditMode); setBulkSelectedIds(new Set()); }}>
              <Edit3 size={20} /><span>Bulk Edit</span>
            </button>
          )}
        </div>

        <ComplianceHealth items={filteredItems} groupedItems={groupedItems} />
        <AISuggestionsCard />

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

        {persona?.recommendedCategories && items.length > 0 && (
          <SuggestedForYou
            persona={persona}
            items={items}
            onAdd={(catId) => { requireCountryForTracking(() => { setShowAddModal(true); setSelectedCategory(catId); }); }}
          />
        )}

        <DashboardItemsList
          items={items}
          filteredItems={filteredItems}
          loading={loading}
          groupedItems={groupedItems}
          getStatusInfo={getStatusInfo}
          onDelete={handleDeleteItem}
          onRenew={renewItem}
          onSnooze={snoozeItem}
          onCopy={handleCopyItem}
          onFetchItems={fetchItems}
          setPayInitialValues={setPayInitialValues}
          setShowPayModal={setShowPayModal}
          activeCountry={activeCountry}
          userId={user?.id}
          bulkEditMode={bulkEditMode}
          bulkSelectedIds={bulkSelectedIds}
          toggleBulkSelect={toggleBulkSelect}
          setAuditItem={setAuditItem}
          onAskAI={handleAskAI}
          requireCountryForTracking={requireCountryForTracking}
          setShowAddModal={setShowAddModal}
          setSelectedCategory={setSelectedCategory}
          persona={persona}
        />
      </main>

      {/* Country required modal */}
      {showCountryRequired && (
        <div className="modal-overlay" onClick={() => setShowCountryRequired(false)}>
          <div className="modal country-required-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select your country</h2>
              <button className="btn-icon" onClick={() => setShowCountryRequired(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p className="modal-body-text">Which country do you need to track compliance for?</p>
              <div className="country-picker-inline">
                {[{ id: 'ca', name: 'Canada', flag: '🇨🇦' }, { id: 'us', name: 'United States', flag: '🇺🇸' }].map(c => (
                  <button
                    key={c.id}
                    className="country-pick-btn"
                    onClick={async () => {
                      const { error: saveErr } = await supabase.from('user_settings').upsert({
                        user_id: user.id, country: c.id, updated_at: new Date().toISOString()
                      }, { onConflict: 'user_id' });
                      if (saveErr) { alert('Could not save country: ' + saveErr.message); return; }
                      setUserCountry(c.id);
                      setActiveCountry(c.id);
                      setUserCountries(prev => prev.includes(c.id) ? prev : [c.id, ...prev]);
                      localStorage.setItem(`nava_active_country_${user.id}`, c.id);
                      setShowCountryRequired(false);
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
      {showDisputeModal && (
        <DisputeTicket onClose={() => setShowDisputeModal(false)} onAddItem={async (item) => { await addItem(item); setShowDisputeModal(false); }} />
      )}
      {showPayModal && <PayTicket onClose={() => setShowPayModal(false)} initialValues={payInitialValues} />}
      {showSuggestionBox && <SuggestionBox onClose={() => setShowSuggestionBox(false)} />}

      {bulkEditMode && bulkSelectedIds.size > 0 && (
        <div className="bulk-edit-bar">
          <span>{bulkSelectedIds.size} selected</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowBulkEditModal(true)}><Edit3 size={16} /> Edit</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setBulkSelectedIds(new Set()); setBulkEditMode(false); }}>Cancel</button>
        </div>
      )}

      {showCalendarImport && <CalendarImportModal onClose={() => setShowCalendarImport(false)} onAddItems={handleAddItemsFromCalendar} userId={user?.id} />}
      {auditItem && <AuditModal item={auditItem} onClose={() => setAuditItem(null)} />}
      {showBulkEditModal && <BulkEditModal selectedIds={Array.from(bulkSelectedIds)} itemCount={bulkSelectedIds.size} onClose={() => setShowBulkEditModal(false)} onApply={handleBulkApply} userCountries={userCountries} />}
      {showWelcome && <WelcomeGuide userId={user.id} onComplete={(p) => { setShowWelcome(false); if (p) setPersona(p); }} />}

      <nav className="bottom-tab-bar" aria-label="Main navigation">
        <Link to="/dashboard" className="active"><LayoutDashboard /><span>Home</span></Link>
        <button type="button" onClick={handleOpenAddModal}><Plus /><span>Add</span></button>
        <Link to="/documents"><Folder /><span>Docs</span></Link>
        <Link to="/settings"><Settings /><span>Settings</span></Link>
      </nav>
    </div>
  );
}
