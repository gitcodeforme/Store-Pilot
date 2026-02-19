import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from "../api/axiosInstance";
import { useNavigate, Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import ukFlag from '../assets/flag/eng.png';
import inFlag from '../assets/flag/ind.png';
import './CreateSaleBill.css';

const CreateSaleBill = () => {
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

  const STORE_INFO = {
    name: 'Awasthi Atta Chakki',
    phone: '9876543210',
    gstin: 'GSTIN12345XYZ',
  };

  const [billItems, setBillItems] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedSaleType, setSelectedSaleType] = useState("Retail");
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [form, setForm] = useState({ customerName: '', mobileNumber: '', address: '' });
  const [saleId, setSaleId] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);

  const [bill, setBill] = useState({
    customer: null,
    paymentMode: 'Cash',
    type: 'Retail',
    grossTotal: 0,
    items: []
  });

  useEffect(() => {

    fetchCustomers();
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/products`)
      .then(res => {
        setProducts(res.data);
        setAllProducts(res.data); // 🔧 this was missing!
      })
      .catch(err => console.error('Error fetching products:', err));
  }, []);

  useEffect(() => {
    const updatedItems = bill.items.map(item => {
      const product = item.product;
      if (!product) return item;

      const price = bill.type === 'Retail'
        ? product.sellingPriceRetail
        : product.sellingPriceWholesale;

      return {
        ...item,
        price,
        totalPrice: price * item.quantity
      };
    });

    const grossTotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    setBill(prev => ({
      ...prev,
      items: updatedItems,
      grossTotal
    }));
  }, [bill.type]);
  const fetchCustomers = () => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/customers`)
      .then(res => setCustomers(res.data))
      .catch(err => console.error('Error fetching customers:', err));
  };

  const handleCustomerSelect = (e) => {
    if (e.target.value === 'new') {
      setIsNewCustomer(true);
      setBill(prev => ({ ...prev, customer: null }));
    } else {
      const selectedCustomer = customers.find(c => c.customerId === parseInt(e.target.value));
      setBill(prev => ({ ...prev, customer: selectedCustomer }));
      setIsNewCustomer(false);
    }
  };

  const handleProductSelect = (index, productId) => {
    const selectedProduct = products.find(p => p.productId === parseInt(productId));
    if (!selectedProduct) return;

    const isRetail = bill.type === 'Retail';
    const price = isRetail
      ? selectedProduct.sellingPriceRetail
      : selectedProduct.sellingPriceWholesale;

    const updatedItems = [...bill.items];
    updatedItems[index] = {
      product: selectedProduct,
      quantity: 1,
      price: price,
      totalPrice: price * 1
    };

    setBill(prev => ({
      ...prev,
      items: updatedItems,
      grossTotal: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...bill.items];
    updatedItems[index][field] = parseFloat(value);
    const price = updatedItems[index].price || 0;
    const quantity = updatedItems[index].quantity || 0;
    updatedItems[index].totalPrice = price * quantity;
    const grossTotal = updatedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setBill(prev => ({ ...prev, items: updatedItems, grossTotal }));
  };

  const addItem = () => {
    setBill(prev => ({
      ...prev,
      items: [...prev.items, { product: null, quantity: 1, price: 0, totalPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    const newItems = bill.items.filter((_, i) => i !== index);
    const grossTotal = newItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setBill(prev => ({ ...prev, items: newItems, grossTotal }));
  };

  const handlePrintAndReset = () => {
  window.onafterprint = () => {
    closePopup();
    window.onafterprint = null;  // Cleanup
  };
  window.print(); // ✅ Correct function to trigger printing
};



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (bill.items.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    try {
      let customerToUse = bill.customer;

      if (isNewCustomer) {
        const { customerName, mobileNumber, address } = form;
        if (!customerName || !mobileNumber || !address) {
          alert("Please fill out all customer fields.");
          return;
        }

const customerRes = await axios.post(
  `${process.env.REACT_APP_API_BASE_URL}/api/customers`,
  {
    customerName,
    mobileNumber,
    address
  }
);

        customerToUse = customerRes.data;
      }

      const dto = {
        customer: customerToUse,
        paymentMode: bill.paymentMode,
        saleType: bill.type,
        grossTotal: bill.grossTotal,
        items: bill.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice
        }))
      };

     const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/sales/create`, dto);
      setSaleId(response.data.saleId || null);
      setSaleDetails(response.data);
      setPopupVisible(true);
    } catch (err) {
      console.error('Error creating sale:', err);
      alert('Failed to create sale. Check backend.');
    }
  };

  const closePopup = () => {
  setPopupVisible(false);
  setSaleId(null);
  setSaleDetails(null);
  setBill({
    customer: null,
    paymentMode: 'Cash',
    type: 'Retail',
    grossTotal: 0,
    items: []
  });
  setForm({ customerName: '', mobileNumber: '', address: '' });
  setIsNewCustomer(false);
  fetchCustomers(); // 👈 Refresh the customer list
};



const generateWhatsAppInvoiceMessage = (saleDetails) => {
  const { customer, saleId, items, grossTotal } = saleDetails;

  let message = `🧾 *${STORE_INFO.name} - Invoice*\n\n`;
  message += `👤 *Customer:* ${customer.customerName}\n📱 *Mobile:* ${customer.mobileNumber}\n🆔 *Sale ID:* ${saleId}\n\n`;
  message += `📦 *Items Purchased:*\n`;

  items.forEach((item, index) => {
    const name = item.product.productName;
    const qty = item.quantity;
    const price = item.price.toFixed(2);
    const total = item.totalPrice.toFixed(2);
    message += `${index + 1}) ${name}\n    ${qty} × ₹${price} = ₹${total}\n`;
  });

  message += `\n💰 *Total Amount:* ₹${grossTotal.toFixed(2)}\n\n`;
  message += `🙏 Thank you for shopping with *${STORE_INFO.name}*!`;

  return message;
};




  return (

    <div className="create-sale-container">
      <div style={{ textAlign: 'center' }}>
        <h1>{STORE_INFO.name}</h1>
        <p>Phone: {STORE_INFO.phone} | GSTIN: {STORE_INFO.gstin}</p>
        {saleId && <h4>Sale ID: {saleId}</h4>}
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

      {/* Dashboard Button */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 1000 }}>
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
      <hr />

      <h2>{t("createSaleBill")}</h2>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Customer Details</legend>
          <label>{t("Customer")}</label>
          <select onChange={handleCustomerSelect} required>
            <option value="">--Select--</option>
            {customers.map(c => (
              <option key={c.customerId} value={c.customerId}>
                {c.customerName} ({c.mobileNumber})
              </option>
            ))}
            <option value="new">{t("addNewCustomer")}</option>
          </select>

          {isNewCustomer && (
            <div className="new-customer-fields">
              <input placeholder={t("name")} value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} required />
              <input placeholder={t("mobile")} value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })} required />
              <input placeholder={t("address")} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>{t("billInfo")}</legend>
          <label>{t("type")}: </label>
          <select value={bill.type} onChange={e => setBill(prev => ({ ...prev, type: e.target.value }))}>
            <option value="Retail">{t("retail")}</option>
            <option value="Wholesale">{t("wholesale")}</option>
          </select>
          <label style={{ marginLeft: '20px' }}>{t("payment")}: </label>
          <select value={bill.paymentMode} onChange={e => setBill(prev => ({ ...prev, paymentMode: e.target.value }))}>
            <option value="Cash">{t("cash")}</option>
            <option value="Online">{t("online")}</option>
          </select>
        </fieldset>

        <fieldset>
          <legend>{t("items")}</legend>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid black', padding: '8px' }}>{t("product")}</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>{t("qty")}</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>{t("price")}</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>{t("total")}</th>
                <th style={{ border: '1px solid black', padding: '8px' }}>{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid black', padding: '8px' }}>
                    <select onChange={e => handleProductSelect(index, e.target.value)} required>
                      <option value="">Select</option>
                      {products.map(p => (
                        <option key={p.productId} value={p.productId}>
                          {p.productName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>
                    <input
                      type="number"
                      value={item.quantity ?? ''}
                      onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                      required
                      style={{ width: '60px' }}
                    />
                  </td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>
                    <input
                      type="number"
                      value={item.price ?? ''}
                      onChange={e => handleItemChange(index, 'price', e.target.value)}
                      required
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>
                    ₹{item.totalPrice.toFixed(2)}
                  </td>
                  <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>
                    <button type="button" onClick={() => removeItem(index)}>❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addItem}>{t("addItem")}</button>
        </fieldset>

        <h3 style={{ textAlign: 'right' }}>{t("grossTotal")}: ₹{bill.grossTotal.toFixed(2)}</h3>
        <div style={{ textAlign: 'center' }}>
          <button type="submit">{t("createSaleBill")}</button>
        </div>
      </form>

      {/* Popup Modal for Invoice */}
      {popupVisible && saleDetails && (
        <div className="print-modal">
          <div className="print-page" id="print-area">
            <h1 style={{ textAlign: 'center' }}>{STORE_INFO.name}</h1>
            <p style={{ textAlign: 'center' }}>
              Phone: {STORE_INFO.phone} | GSTIN: {STORE_INFO.gstin}
            </p>
            <hr />
            <h2>{t("invoice")}</h2>
            <p><strong>{t("sale_id")}</strong> {saleDetails.saleId}</p>
            <p><strong>{t("customer")}</strong> {saleDetails.customer.customerName}</p>
            <p><strong>{t("mobile")}</strong> {saleDetails.customer.mobileNumber}</p>
            <p><strong>{t("address")}</strong> {saleDetails.customer.address}</p>
            <hr />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>{t("product")}</th>
                  <th>{t("qty")}</th>
                  <th>{t("price")}</th>
                  <th>{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {saleDetails.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid black' }}>{item.product.productName}</td>
                    <td style={{ border: '1px solid black' }}>{item.quantity}</td>
                    <td style={{ border: '1px solid black' }}>₹{item.price}</td>
                    <td style={{ border: '1px solid black' }}>₹{item.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 style={{ textAlign: 'right' }}>Gross Total: ₹{saleDetails.grossTotal}</h3>

            <div className="no-print" style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={handlePrintAndReset} style={{ marginRight: '10px' }}>🖨️ Print</button>

              <a
                href={`https://wa.me/91${saleDetails.customer.mobileNumber}?text=${encodeURIComponent(generateWhatsAppInvoiceMessage(saleDetails))}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginRight: '10px' }}
              >

                <img
                  src="https://img.icons8.com/color/48/000000/whatsapp--v1.png"
                  alt="Send on WhatsApp"
                  style={{ width: '40px', verticalAlign: 'middle' }}
                />
              </a>

              <button onClick={closePopup}>{t("close")}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateSaleBill;
