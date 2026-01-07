import { useTranslation } from 'react-i18next'; import { FaHome } from 'react-icons/fa';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ukFlag from '../assets/flag/eng.png';
import inFlag from '../assets/flag/ind.png';

const CreateReturnBill = () => {
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
    name: "Awasthi Atta Chakki",
    phone: "9876543210",
    gstin: "GSTIN12345XYZ"
  };

  const [popupVisible, setPopupVisible] = useState(false);
  const [returnDetails, setReturnDetails] = useState(null);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ customerName: '', mobileNumber: '', address: '' });

  const [form, setForm] = useState({
    sale: { saleId: "" },
    customer: { customerId: "" },
    returnDate: "",
    returnType: "Retail",
    paymentMode: "Cash",
    returnItems: [],
    totalReturnAmount: 0,
  });

  const [currentItem, setCurrentItem] = useState({
    productId: "",
    quantity: 0,
    price: 0,
    totalPrice: 0,
  });

  const [returnId, setReturnId] = useState(null);

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const baseURL = process.env.REACT_APP_API_BASE_URL;

    // Fetch Sales
    axios.get(`${baseURL}/api/sales`)
      .then(res => setSales(res.data))
      .catch(() => {});

    // Fetch Customers
    axios.get(`${baseURL}/api/customers`)
      .then(res => setCustomers(res.data))
      .catch(() => {});

    // Fetch Products with proper handling
    axios.get(`${baseURL}/api/products`)
      .then(res => {
        const data = res.data;
        const productList = Array.isArray(data) ? data : data.products || [];
        setProducts(productList);
      })
      .catch(() => {});
  }, []);

  const handleCustomerSelect = (e) => {
    if (e.target.value === 'new') {
      setIsNewCustomer(true);
      setForm(prev => ({ ...prev, customer: { customerId: "" } }));
    } else {
      setIsNewCustomer(false);
      setForm(prev => ({ ...prev, customer: { customerId: parseInt(e.target.value) } }));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;

    let val = value;

    // If the field is quantity or price and value is not empty, parse it
    if ((name === "quantity" || name === "price") && value !== "") {
      val = parseFloat(value);
      if (isNaN(val)) val = "";
    }

    const updatedItem = {
      ...currentItem,
      [name]: val,
    };

    // Calculate totalPrice only if both quantity and price are valid numbers
    const qty = parseFloat(updatedItem.quantity);
    const prc = parseFloat(updatedItem.price);
    updatedItem.totalPrice =
      !isNaN(qty) && !isNaN(prc) ? qty * prc : "";

    setCurrentItem(updatedItem);
  };


  const addItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0 || currentItem.price <= 0) {
      alert("Please select product and enter valid quantity and price.");
      return;
    }

    const selectedProduct = products.find(p => p.productId === parseInt(currentItem.productId));
    if (!selectedProduct) {
      alert("Selected product not found.");
      return;
    }

    const item = {
      product: selectedProduct,
      quantity: currentItem.quantity,
      price: currentItem.price,
      totalPrice: currentItem.totalPrice,
    };

    const updatedItems = [...form.returnItems, item];
    const updatedAmount = updatedItems.reduce((sum, i) => sum + i.totalPrice, 0);

    setForm(prev => ({ ...prev, returnItems: updatedItems, totalReturnAmount: updatedAmount }));
    setCurrentItem({ productId: "", quantity: 0, price: 0, totalPrice: 0 });
  };

  const removeItem = (index) => {
    const updatedItems = form.returnItems.filter((_, i) => i !== index);
    const updatedAmount = updatedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    setForm(prev => ({ ...prev, returnItems: updatedItems, totalReturnAmount: updatedAmount }));
  };

  const handleNewCustomerInput = (e) => {
    const { name, value } = e.target;
    setNewCustomerForm(prev => ({ ...prev, [name]: value }));
  };

  // Open confirmation modal instead of direct submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.sale.saleId) {
      alert("Please select a Sale.");
      return;
    }
    if (!form.customer.customerId && !isNewCustomer) {
      alert("Please select a Customer or add a new one.");
      return;
    }
    if (form.returnItems.length === 0) {
      alert("Please add at least one return item.");
      return;
    }
    if (!form.returnDate) {
      alert("Please select a Return Date.");
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handlePrintAndReset = () => {
  window.onafterprint = () => {
    closePopup();
    window.onafterprint = null;
  };
  window.print();
};

const closePopup = () => {
  setPopupVisible(false);
  setReturnDetails(null);
};

  // Confirm and send data to backend
  const confirmAndSubmit = async () => {
    try {
      let customerToUse = null;

      if (isNewCustomer) {
        const { customerName, mobileNumber, address } = newCustomerForm;
        if (!customerName || !mobileNumber || !address) {
          alert("Please fill all new customer fields.");
          return;
        }
        const baseURL = process.env.REACT_APP_API_BASE_URL;

        const res = await axios.post(
  `${baseURL}/api/customers/create/${encodeURIComponent(customerName)}/${mobileNumber}/${encodeURIComponent(address)}`
        );
        customerToUse = res.data;
      } else {
        customerToUse = customers.find(c => c.customerId === form.customer.customerId);
      }

      const payload = {
        sale: { saleId: parseInt(form.sale.saleId) },
        customer: customerToUse,
        returnDate: new Date(form.returnDate).toISOString(),
        returnType: form.returnType,
        paymentMode: form.paymentMode,
        returnItems: form.returnItems,
        totalReturnAmount: form.totalReturnAmount,
      };

      const baseURL = process.env.REACT_APP_API_BASE_URL;

const response = await axios.post(`${baseURL}/api/returns/create`, payload);
      setReturnId(response.data.returnId || null);
      setReturnDetails(response.data);   // ✅ store full return
      setPopupVisible(true);   

      // Reset form after successful submit
      setForm({
        sale: { saleId: "" },
        customer: { customerId: "" },
        returnDate: "",
        returnType: "Retail",
        paymentMode: "Cash",
        returnItems: [],
        totalReturnAmount: 0,
      });
      setNewCustomerForm({ customerName: '', mobileNumber: '', address: '' });
      setIsNewCustomer(false);
      setCurrentItem({ productId: "", quantity: 0, price: 0, totalPrice: 0 });

      setShowConfirmModal(false);
    } catch (error) {
      console.error("Error creating return bill:", error);
      alert("Failed to create return bill.");
      setShowConfirmModal(false);
    }
  };

  // Cancel modal
  const cancelConfirm = () => {
    setShowConfirmModal(false);
  };

  // Helper to display customer info in modal
  const renderCustomerInfo = () => {
    if (isNewCustomer) {
      return (
        <div>
          <p><strong>New Customer Details:</strong></p>
          <p>Name: {newCustomerForm.customerName}</p>
          <p>Mobile: {newCustomerForm.mobileNumber}</p>
          <p>Address: {newCustomerForm.address}</p>
        </div>
      );
    } else {
      const cust = customers.find(c => c.customerId === form.customer.customerId);
      if (!cust) return <p>No customer selected.</p>;
      return (
        <div>
          <p><strong>Selected Customer Details:</strong></p>
          <p>Name: {cust.customerName}</p>
          <p>Mobile: {cust.mobileNumber}</p>
          <p>Address: {cust.address}</p>
        </div>
      );
    }
  };


  const handleProductChange = (e) => {
    setSelectedProductId(e.target.value);
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', fontFamily: 'Arial, sans-serif', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0' }}>{STORE_INFO.name}</h1>
        <p>Phone: {STORE_INFO.phone} | GSTIN: {STORE_INFO.gstin}</p>
        {returnId && <h4>Return Bill ID: {returnId}</h4>}
      </div>

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


      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '20px',
        padding: '10px'
      }}>
        <div style={{ width: '100%' }}>
          <h2 style={{ margin: 0 }}>{t("createReturnBill")}</h2>
        </div>
  
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ marginBottom: '5px' }}>{t("sale")}</label>
          <select
            required
            value={form.sale.saleId}
            onChange={(e) =>
              setForm(prev => ({ ...prev, sale: { saleId: e.target.value } }))
            }
          >
            <option value="">{t("selectSale")}</option>
            {sales.map(s => (
              <option key={s.saleId} value={s.saleId}>#{s.saleId}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label>{t("customer")}</label>
          <select
            required
            onChange={handleCustomerSelect}
            value={isNewCustomer ? "new" : form.customer.customerId || ""}
          >
            <option value="">{t("selectCustomer")}</option>
            {customers.map(c => (
              <option key={c.customerId} value={c.customerId}>
                {c.customerName}
              </option>
            ))}
            <option value="new">{t("addNewCustomer")}</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label>{t("returnDate")}</label>
          <input
            type="date"
            name="returnDate"
            value={form.returnDate}
            onChange={handleFormChange}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label>{t("returnType")}</label>
          <select
            name="returnType"
            value={form.returnType}
            onChange={handleFormChange}
          >
            <option value="Retail">{t("retail")}</option>
            <option value="Wholesale">{t("wholesale")}</option>
          </select>
        </div>

    
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label>{t("paymentMode")}</label>
          <select
            name="paymentMode"
            value={form.paymentMode}
            onChange={handleFormChange}
          >
            <option value="Cash">{t("cash")}</option>
            <option value="Online">{t("online")}</option>
          </select>
        </div>

        
        {isNewCustomer && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label>{t("name")}</label>
              <input
                type="text"
                name="customerName"
                placeholder={t("customerName")}
                value={newCustomerForm.customerName}
                onChange={handleNewCustomerInput}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label>{t("mobile")}</label>
              <input
                type="text"
                name="mobileNumber"
                placeholder={t("mobileNumber")}
                value={newCustomerForm.mobileNumber}
                onChange={handleNewCustomerInput}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label>{t("address")}</label>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={newCustomerForm.address}
                onChange={handleNewCustomerInput}
                required
              />
            </div>
          </>
        )}

        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', marginBottom: '10px' }}>
          <thead>
            <tr>
              <th colSpan="4" style={{
                fontSize: '18px',
                padding: '12px 16px',
                backgroundColor: 'white',
                color: 'black',
                textAlign: 'left'
              }}>
                {t("addReturnItem")}
              </th>
            </tr>
            <tr>
              <th>{t("product")}</th>
              <th>{t("quantity")}</th>
              <th>{t("price")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <select
                  value={currentItem.productId}
                  onChange={(e) =>
                    setCurrentItem(prev => ({
                      ...prev,
                      productId: e.target.value, // keep as string
                    }))
                  }
                >
                  <option value="">{t("selectProduct")}</option>
                  {products.map(p => (
                    <option key={p.productId} value={p.productId}>
                      {p.productName}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  value={currentItem.quantity === 0 ? '' : currentItem.quantity}
                  onChange={handleItemChange}
                  min="0"
                  style={{ width: '80px' }}
                />
              </td>
              <td>
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={currentItem.price === 0 ? '' : currentItem.price}
                  onChange={handleItemChange}
                  min="0"
                  style={{ width: '80px' }}
                />
              </td>
              <td>
                <button type="button" onClick={addItem} style={{ marginLeft: '10px' }}>
                  {t("addItem")}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>

          <thead>
            <tr>
              <th colSpan="4" style={{
                fontSize: '18px',
                padding: '12px 16px',
                backgroundColor: 'white',
                color: 'black',
                textAlign: 'left'
              }}>
                {t("totalReturnItems")}
              </th>
            </tr>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc' }}>{t("product")}</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>{t("quantity")}</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>{t("price")}</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>{t("total")}</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>{t("action")}</th>
            </tr>
          </thead>
          <tbody>
            {form.returnItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.product.productName}</td>
                <td>{item.quantity}</td>
                <td>{item.price}</td>
                <td>{item.totalPrice.toFixed(2)}</td>
                <td><button type="button" onClick={() => removeItem(idx)}>{t("remove")}</button></td>
              </tr>
            ))}
            {form.returnItems.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>{t("noReturnItems")}</td>
              </tr>
            )}
          </tbody>
        </table>

        <h3>{t("totalReturnAmount")}: ₹{form.totalReturnAmount.toFixed(2)}</h3>

        <button type="submit" style={{ marginTop: '20px' }}>{t("createReturnBill")}</button>
      </form>
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            boxShadow: '0 0 10px rgba(0,0,0,0.25)'
          }}>
            <h2>{t("confirmReturnBill")}</h2>
            {renderCustomerInfo()}

            <p><strong>{t("returnDate")}:</strong> {form.returnDate}</p>
            <p><strong>{t("returnType")}:</strong> {form.returnType}</p>
            <p><strong>{t("paymentMode")}:</strong> {form.paymentMode}</p>
            <p><strong>{t("totalReturnAmount")}:</strong> ₹{form.totalReturnAmount.toFixed(2)}</p>

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button onClick={cancelConfirm} style={{ marginRight: '10px' }}>{t("cancel")}</button>
              <button onClick={confirmAndSubmit}>{t("confirm")}</button>
            </div>
          </div>

  

        </div>

        
      )}

    </div>
    
  );
};

export default CreateReturnBill;

