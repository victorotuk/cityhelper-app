import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader, X } from 'lucide-react';

/**
 * Address Autocomplete Component
 * Uses Canada Post AddressComplete API (free tier: 100 lookups/month)
 * Falls back to a simple input if no API key is set
 */
export default function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder = 'Start typing your address...', 
  label = 'Address',
  required = false,
  disabled = false 
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Get API key from environment or localStorage
  const apiKey = import.meta.env.VITE_CANADA_POST_API_KEY || 
                 localStorage.getItem('canadaPostApiKey');

  // Sync value prop to local state when parent changes it (e.g. form reset)
  useEffect(() => {
    if (value !== undefined && value !== null) setQuery(value); // eslint-disable-line react-hooks/set-state-in-effect -- intentional sync from props
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions from Canada Post API
  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    // If no API key, use a simple fallback
    if (!apiKey) {
      // Provide some common Canadian address patterns as hints
      setSuggestions([
        { id: 'hint', text: 'Enter your full address manually', isHint: true }
      ]);
      return;
    }

    setLoading(true);
    
    try {
      // Canada Post AddressComplete API
      const response = await fetch(
        `https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/json3.ws?` +
        `Key=${apiKey}&SearchTerm=${encodeURIComponent(searchQuery)}&Country=CAN&LanguagePreference=en&MaxResults=7`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      
      if (data.Items && data.Items.length > 0) {
        setSuggestions(data.Items.map(item => ({
          id: item.Id,
          text: item.Text,
          description: item.Description,
          type: item.Type,
          isExpandable: item.Type === 'Postcode' || item.Type === 'Street',
        })));
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Address lookup error:', error);
      setSuggestions([]);
    }
    
    setLoading(false);
  };

  // Retrieve full address details
  const retrieveAddress = async (id) => {
    if (!apiKey) return null;
    
    try {
      const response = await fetch(
        `https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Retrieve/v2.10/json3.ws?` +
        `Key=${apiKey}&Id=${encodeURIComponent(id)}`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      
      if (data.Items && data.Items.length > 0) {
        const addr = data.Items[0];
        return {
          line1: addr.Line1 || '',
          line2: addr.Line2 || '',
          city: addr.City || '',
          province: addr.ProvinceCode || addr.ProvinceName || '',
          postalCode: addr.PostalCode || '',
          country: addr.CountryName || 'Canada',
          full: `${addr.Line1}${addr.Line2 ? ', ' + addr.Line2 : ''}, ${addr.City}, ${addr.ProvinceCode} ${addr.PostalCode}`,
        };
      }
    } catch (error) {
      console.error('Address retrieve error:', error);
    }
    return null;
  };

  // Handle input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && !selectedAddress) {
        fetchSuggestions(query);
        setShowDropdown(true);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, selectedAddress]); // eslint-disable-line react-hooks/exhaustive-deps -- fetchSuggestions is stable

  const handleSelect = async (suggestion) => {
    if (suggestion.isHint) {
      setShowDropdown(false);
      return;
    }

    // If it's expandable (like a street), search within it
    if (suggestion.isExpandable) {
      setQuery(suggestion.text);
      fetchSuggestions(suggestion.text + ' ');
      return;
    }

    // Retrieve full address
    const fullAddress = await retrieveAddress(suggestion.id);
    
    if (fullAddress) {
      setSelectedAddress(fullAddress);
      setQuery(fullAddress.full);
      onChange(fullAddress);
    } else {
      // Fallback - just use the text
      setQuery(suggestion.text);
      onChange({ full: suggestion.text, line1: suggestion.text });
    }
    
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedAddress(null);
    setSuggestions([]);
    onChange(null);
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedAddress(null);
    
    // If user is typing, pass raw value for manual entry
    if (!apiKey) {
      onChange({ full: val, line1: val });
    }
  };

  return (
    <div className="address-autocomplete">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className="address-input-wrapper">
        <MapPin size={18} className="address-icon" />
        <input
          ref={inputRef}
          type="text"
          className="form-input with-icon"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 3 && setShowDropdown(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && <Loader size={16} className="address-loading" />}
        {query && !loading && (
          <button type="button" className="address-clear" onClick={handleClear}>
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="address-dropdown" ref={dropdownRef}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              className={`address-option ${suggestion.isHint ? 'hint' : ''}`}
              onClick={() => handleSelect(suggestion)}
            >
              <MapPin size={14} />
              <div className="address-option-content">
                <span className="address-text">{suggestion.text}</span>
                {suggestion.description && (
                  <span className="address-desc">{suggestion.description}</span>
                )}
              </div>
              {suggestion.isExpandable && (
                <span className="address-expand">→</span>
              )}
            </div>
          ))}
        </div>
      )}


      {selectedAddress && (
        <div className="address-parsed">
          <div className="parsed-row">
            <span>Street:</span>
            <strong>{selectedAddress.line1}</strong>
          </div>
          {selectedAddress.line2 && (
            <div className="parsed-row">
              <span>Unit/Apt:</span>
              <strong>{selectedAddress.line2}</strong>
            </div>
          )}
          <div className="parsed-row">
            <span>City:</span>
            <strong>{selectedAddress.city}</strong>
          </div>
          <div className="parsed-row">
            <span>Province:</span>
            <strong>{selectedAddress.province}</strong>
          </div>
          <div className="parsed-row">
            <span>Postal Code:</span>
            <strong>{selectedAddress.postalCode}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

