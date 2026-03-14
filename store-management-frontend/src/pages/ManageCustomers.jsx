import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import ukFlag from '../assets/flag/eng.png';
import { useNavigate } from "react-router-dom";
import inFlag from '../assets/flag/ind.png';

const CustomerManager = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English', flag: ukFlag },
    { code: 'hi', label: 'हिंदी', flag: inFlag },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };
  const [customers, setCustomers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    mobileNumber: '',
    address: '',
  });
  const [showAllCustomers, setShowAllCustomers] = useState(false);

  // Indian mobile number validation function
  const validateIndianMobileNumber = (mobile) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(mobile);
  };

  // Fetch all customers on mount
  const fetchCustomers = async () => {
    try {
      const res = await axiosInstance.get("/api/customers");
      setCustomers(res.data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Update suggestions as user types (case insensitive)
  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      return;
    }

    const inputLower = searchInput.toLowerCase();

    const filtered = customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(inputLower) ||
        c.mobileNumber.toLowerCase().includes(inputLower)
    );

    setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
  }, [searchInput, customers]);

  // When user clicks suggestion, fill form and foundCustomer
  const handleSuggestionClick = (customer) => {
    setSearchInput(customer.customerName);
    setFoundCustomer(customer);
    setForm({
      customerName: customer.customerName || '',
      mobileNumber: customer.mobileNumber || '',
      address: customer.address || '',
    });
    setSuggestions([]);
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    try {
      const res = await axiosInstance.get(
        `/api/customers/${encodeURIComponent(searchInput)}`
      );

      setFoundCustomer(res.data);
      setForm({
        customerName: res.data.customerName || "",
        mobileNumber: res.data.mobileNumber || "",
        address: res.data.address || ""
      });

      setSuggestions([]);
    } catch {
      setFoundCustomer(null);
      alert("Customer not found");
    }
  };


  const handleCreateCustomer = async () => {
    const { customerName, mobileNumber, address } = form;

    if (!customerName || !mobileNumber || !address) {
      alert("Please fill out all fields");
      return;
    }

    if (!validateIndianMobileNumber(mobileNumber)) {
      alert("Invalid mobile number");
      return;
    }

    try {
      await axiosInstance.post("/api/customers", {
        customerName,
        mobileNumber,
        address
      });

      alert("Customer created successfully");

      setForm({
        customerName: "",
        mobileNumber: "",
        address: ""
      });

      fetchCustomers();
    } catch (error) {
      if (error.response?.status === 409) {
        alert("Customer already exists");
      } else {
        alert("Error creating customer");
      }
    }
  };


  const handleUpdate = async () => {
    if (!searchInput) {
      alert("Search a customer first");
      return;
    }

    if (!validateIndianMobileNumber(form.mobileNumber)) {
      alert("Invalid mobile number");
      return;
    }

    try {
      await axiosInstance.put(
        `/api/customers/${encodeURIComponent(searchInput)}`,
        form
      );

      alert("Customer updated");

      setFoundCustomer(null);
      setSearchInput("");
      setForm({
        customerName: "",
        mobileNumber: "",
        address: ""
      });

      fetchCustomers();
    } catch (error) {
      console.error(error);
      alert("Update failed");
    }
  };


  const handleDelete = async () => {
    if (!searchInput) {
      alert("Search a customer first");
      return;
    }

    if (!window.confirm("Delete this customer?")) return;

    try {
      await axiosInstance.delete(
        `/api/customers/${encodeURIComponent(searchInput)}`
      );

      alert("Customer deleted");

      setFoundCustomer(null);
      setSearchInput("");
      setForm({
        customerName: "",
        mobileNumber: "",
        address: ""
      });

      fetchCustomers();
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  };


  return (
    <div
      className="customer-manager"
      style={{
        maxWidth: '700px',
        margin: '30px auto',
        padding: '20px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        boxShadow: '0 0 15px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        backgroundColor: '#fff',
      }}
    >
      <div style={{ position: 'fixed', top: '20px', left: '20px', marginBottom: '0' }}>
        <Link
          to="/dashboard"
          style={{
            textDecoration: 'none',
            color: '#007bff',
            fontSize: '18px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1.5px solid #007bff',
            backgroundColor: '#e7f1ff',
            transition: 'background-color 0.3s, color 0.3s',
          }}
          title="Go to Dashboard"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#007bff';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#e7f1ff';
            e.currentTarget.style.color = '#007bff';
          }}
        >
          <FaHome size={20} />
          Dashboard
        </Link>
      </div>

      {/* Language Dropdown */}{/* Language Dropdown */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            backgroundColor: 'white',
            padding: '5px 10px',
            borderRadius: 4,
            boxShadow: '0 0 5px rgba(0,0,0,0.2)',
          }}
        >
          <img
            src={currentLanguage.flag}
            alt={currentLanguage.label}
            style={{ width: 20, marginRight: 8 }}
          />
          <span>{currentLanguage.label}</span>
        </div>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: 4,
              marginTop: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              minWidth: 130,
              zIndex: 2000,
            }}
          >
            {languages.map((lang) => (
              <div
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                style={{
                  padding: '5px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: lang.code === currentLanguage.code ? '#eee' : 'white',
                }}
              >
                <img
                  src={lang.flag}
                  alt={lang.label}
                  style={{ width: 20, marginRight: 8 }}
                />
                <span>{lang.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 style={{ color: '#333', marginBottom: '20px' }}>{t('customer_manager')}</h2>

      {/* Search Section */}
      <div style={{ marginBottom: '15px', position: 'relative' }}>
        <h4 style={{ marginBottom: '8px' }}>{t('search_customer')}</h4>
        <input
          type="text"
          placeholder={t('enter_name_or_mobile')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
          autoComplete="off"
        />
        <button
          onClick={handleSearch}
          style={{
            marginTop: '10px',
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {t('search')}
        </button>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              top: '68px',
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '6px',
              listStyle: 'none',
              padding: '0',
              margin: '5px 0 0 0',
              maxHeight: '160px',
              overflowY: 'auto',
              zIndex: 1000,
            }}
          >
            {suggestions.map((cust) => (
              <li
                key={cust.customerId}
                onClick={() => handleSuggestionClick(cust)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <strong>{cust.customerName}</strong> - {cust.mobileNumber}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Customer Form */}
      <div
        style={{
          borderTop: '1.5px solid #ccc',
          paddingTop: '20px',
          marginTop: '10px',
        }}
      >
        <h4>{foundCustomer ? 'Update Customer' : 'Create New Customer'}</h4>

        <div style={{ marginBottom: '12px' }}>
          <label htmlFor="customerName" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
            {t('customer_name')}
          </label>
          <input
            id="customerName"
            type="text"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
            placeholder="Enter customer name"
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label htmlFor="mobileNumber" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
            {t('mobile_number')}
          </label>
          <input
            id="mobileNumber"
            type="text"
            maxLength={10}
            value={form.mobileNumber}
            onChange={(e) => {
              // Allow only digits
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setForm({ ...form, mobileNumber: val });
              }
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
              letterSpacing: '2px',
            }}
            placeholder="10-digit mobile number"
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label htmlFor="address" style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
            {t('address')}
          </label>
          <textarea
            id="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
              resize: 'vertical',
            }}
            placeholder="Enter address"
          />
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '10px',
          }}
        >
          {!foundCustomer ? (
            <button
              onClick={handleCreateCustomer}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                transition: 'background-color 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
            >
              Create Customer
            </button>
          ) : (
            <>
              <button
                onClick={handleUpdate}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '16px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
              >
                Update Customer
              </button>

              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '16px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#a71d2a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
              >
                Delete Customer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Show All Customers Toggle */}
      <div
        style={{
          marginTop: '30px',
          textAlign: 'center',
        }}
      >
        <button
          onClick={() => setShowAllCustomers(!showAllCustomers)}
          style={{
            padding: '12px 18px',
            fontSize: '16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#117a8b')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#17a2b8')}
        >
          {showAllCustomers ? 'Hide All Customers' : 'Show All Customers'}
        </button>

        {/* List of all customers */}
        {showAllCustomers && (
          <div
            style={{
              marginTop: '20px',
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1.5px solid #ccc',
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: '#fafafa',
              fontSize: '15px',
            }}
          >
            {customers.length === 0 ? (
              <p>No customers found.</p>
            ) : (
              <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                {customers.map((cust) => (
                  <li
                    key={cust.customerId}
                    style={{
                      padding: '8px 10px',
                      borderBottom: '1px solid #ddd',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSuggestionClick(cust)}
                    title="Click to load this customer in form"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e9ecef')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <strong>{cust.customerName}</strong> — {cust.mobileNumber} — {cust.address}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManager;
