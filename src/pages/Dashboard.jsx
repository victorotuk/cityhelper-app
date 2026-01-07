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
  CreditCard
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import WelcomeGuide from '../components/WelcomeGuide';
import DisputeTicket from '../components/DisputeTicket';
import PayTicket from '../components/PayTicket';
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
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchItems(user.id);
    
    // Check if new user (show welcome guide)
    const hasSeenGuide = localStorage.getItem(`welcomeGuide_${user.id}`);
    if (!hasSeenGuide) {
      setShowWelcome(true);
    }
    
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
      } catch (err) {
        // Silently fail - not critical
      }
    };
    updateLastActive();
  }, [user, navigate, fetchItems]);

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
          <Link to="/apply" className="quick-action">
            <FileText size={20} />
            <span>Apply</span>
          </Link>
          <Link to="/tax-estimator" className="quick-action">
            <Calculator size={20} />
            <span>Tax Estimator</span>
          </Link>
          <Link to="/documents" className="quick-action">
            <Folder size={20} />
            <span>Documents</span>
          </Link>
          <button 
            className="quick-action" 
            onClick={() => exportAllToCalendar(items)}
            disabled={items.length === 0}
          >
            <Download size={20} />
            <span>Export Calendar</span>
          </button>
          <button 
            className="quick-action" 
            onClick={() => {
              const summary = items.map(item => {
                const cat = APP_CONFIG.categories.find(c => c.id === item.category);
                return `• ${item.name} (${cat?.name || 'General'}) - Due: ${item.due_date ? format(parseISO(item.due_date), 'MMM d, yyyy') : 'No date'}`;
              }).join('\n');
              navigator.clipboard.writeText(`My Compliance Summary:\n\n${summary}`);
              alert('Summary copied! Paste it in an email or message to share.');
            }}
            disabled={items.length === 0}
          >
            <Copy size={20} />
            <span>Copy Summary</span>
          </button>
          <button 
            className="quick-action"
            onClick={() => setShowPayModal(true)}
          >
            <CreditCard size={20} />
            <span>Pay Ticket</span>
          </button>
          <button 
            className="quick-action accent"
            onClick={() => setShowDisputeModal(true)}
          >
            <AlertTriangle size={20} />
            <span>Dispute Ticket</span>
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

        {/* Add button */}
        <button className="btn btn-primary add-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Add Compliance Item
        </button>

        {/* Items list */}
        <div className="items-list">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>No compliance items yet</h3>
              <p>Add your first item to start tracking deadlines</p>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={18} /> Add Item
              </button>
            </div>
          ) : (
            <>
              {(groupedItems.overdue.length > 0 || groupedItems.urgent.length > 0) && (
                <div className="items-section urgent">
                  <h3><AlertTriangle size={18} /> Needs Attention</h3>
                  {[...groupedItems.overdue, ...groupedItems.urgent].map(item => (
                    <ItemCard key={item.id} item={item} getStatusInfo={getStatusInfo} onDelete={handleDeleteItem} onAddToCalendar={addToGoogleCalendar} onCopy={handleCopyItem} />
                  ))}
                </div>
              )}

              {groupedItems.warning.length > 0 && (
                <div className="items-section warning">
                  <h3><Clock size={18} /> Coming Up (30 days)</h3>
                  {groupedItems.warning.map(item => (
                    <ItemCard key={item.id} item={item} getStatusInfo={getStatusInfo} onDelete={handleDeleteItem} onAddToCalendar={addToGoogleCalendar} onCopy={handleCopyItem} />
                  ))}
                </div>
              )}

              {groupedItems.ok.length > 0 && (
                <div className="items-section ok">
                  <h3><CheckCircle size={18} /> All Good</h3>
                  {groupedItems.ok.map(item => (
                    <ItemCard key={item.id} item={item} getStatusInfo={getStatusInfo} onDelete={handleDeleteItem} onAddToCalendar={addToGoogleCalendar} onCopy={handleCopyItem} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

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
        <PayTicket onClose={() => setShowPayModal(false)} />
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

function ItemCard({ item, getStatusInfo, onDelete, onAddToCalendar, onCopy }) {
  const statusInfo = getStatusInfo(item.due_date);
  const category = APP_CONFIG.categories.find(c => c.id === item.category);
  
  const getCategoryEmoji = (catId) => {
    const emojis = {
      immigration: '✈️', personal_tax: '💰', business_tax: '🏢',
      driving: '🚗', parking: '🅿️', health: '❤️', housing: '🏡',
      office: '💼', business_license: '📋', property: '🏠', 
      professional: '🎓', other: '📌'
    };
    return emojis[catId] || '📌';
  };

  return (
    <div className={`item-card ${statusInfo.status}`}>
      <div className="item-icon" style={{ background: category?.color || '#64748b' }}>
        {getCategoryEmoji(item.category)}
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

function AddItemModal({ onClose, onAdd, selectedCategory, setSelectedCategory }) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      name,
      category: selectedCategory,
      due_date: dueDate || null,
      notes: notes || null
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
      personal_tax: `Extract from this tax document and return ONLY JSON:
{"documentType":"T4/T5/receipt","year":"","amount":"","dueDate":"YYYY-MM-DD"}`,
      business_license: `Extract from this license and return ONLY JSON:
{"businessName":"","licenseNumber":"","expiryDate":"YYYY-MM-DD","type":""}`,
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
      immigration: '✈️', personal_tax: '💰', business_tax: '🏢',
      driving: '🚗', parking: '🅿️', health: '❤️', housing: '🏡',
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
