
import React, { useState, useEffect } from "react";
import axiosInstance from '../api/axiosInstance';
import { createProduct, getAllProducts, updateProduct, deleteProduct } from "./Service/ProductService";
import { Link } from "react-router-dom";
import ukFlag from '../assets/flag/eng.png';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import inFlag from '../assets/flag/ind.png';
import { FaHome } from "react-icons/fa";

const ManageProducts = () => {
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

  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [formData, setFormData] = useState({
    productName: "",
    productCode: "",
    unitName: "",
    quantity: "",
    buyingPrice: "",
    sellingPriceRetail: "",
    sellingPriceWholesale: "",
  });
  const [editingIdentifier, setEditingIdentifier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProducts();
    loadUnits();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getAllProducts();
      const data = Array.isArray(response.data) ? response.data : [];
      setProducts(data);

      // ✅ Generate new product code
      const lastCode = data.length > 0 ? data[data.length - 1].productCode : "P000";
      const newCode = generateNextProductCode(lastCode);

      setFormData((prev) => ({
        ...prev,
        productCode: newCode,
      }));
    } catch (error) {
      console.error("Error loading products:", error);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const generateNextProductCode = (lastCode) => {
    const match = lastCode.match(/(\D*)(\d+)$/); // Match letters + numbers
    if (match) {
      const prefix = match[1];
      const number = parseInt(match[2], 10) + 1;
      return `${prefix}${number.toString().padStart(match[2].length, "0")}`;
    }
    return "P001";
  };

  const loadUnits = async () => {
    try {
      const response = await axiosInstance.get("/api/units");
      const unitsData = response.data || [];
      setUnits(unitsData);

      // ✅ Auto-select first unit
      if (unitsData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          unitName: unitsData[0].unitName,
        }));
      }
    } catch (error) {
      console.error("Error loading units:", error);
      setError("Failed to load units. Please try again later.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ Pick selected unit or fallback
      const selectedUnit = units.find(u => u.unitName === formData.unitName) || units[0];
      if (!selectedUnit) {
        setError("No units available. Please add a unit first.");
        setLoading(false);
        return;
      }

      const productData = {
        productName: formData.productName || "Unnamed Product",
        productCode: formData.productCode || generateNextProductCode(products[products.length - 1]?.productCode || "P000"),
        unit: selectedUnit,
        quantity: Number(formData.quantity || 0),
        buyingPrice: Number(formData.buyingPrice || 0),
        sellingPriceRetail: Number(formData.sellingPriceRetail || 0),
        sellingPriceWholesale: Number(formData.sellingPriceWholesale || 0),
      };

      if (editingIdentifier) {
        await updateProduct(editingIdentifier, productData);
        setEditingIdentifier(null);
      } else {
        await createProduct(productData);
      }

      setFormData({
        productName: "",
        productCode: generateNextProductCode(products[products.length - 1]?.productCode || "P000"),
        unitName: selectedUnit.unitName,
        quantity: "",
        buyingPrice: "",
        sellingPriceRetail: "",
        sellingPriceWholesale: "",
      });

      loadProducts();
    } catch (error) {
      console.error("Error submitting product:", error);
      setError("Failed to submit product. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingIdentifier(product.productId);
    setFormData({
      productName: product.productName,
      productCode: product.productCode,
      unitName: product.unit?.unitName || (units[0]?.unitName || ""),
      quantity: product.quantity,
      buyingPrice: product.buyingPrice,
      sellingPriceRetail: product.sellingPriceRetail,
      sellingPriceWholesale: product.sellingPriceWholesale,
    });
  };

  const handleDelete = async (identifier) => {
    setLoading(true);
    setError("");

    try {
      await deleteProduct(identifier);
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", boxShadow: '0 0 15px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: '#fff', position: 'relative' }}>
      {/* Dashboard Button */}
      <div style={{ position: 'fixed', top: '20px', left: '20px' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', color: '#007bff', fontSize: '18px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', padding: '6px 12px', borderRadius: '6px', border: '1.5px solid #007bff', backgroundColor: '#e7f1ff' }}>
          <FaHome size={20} />
          Dashboard
        </Link>
      </div>

      {/* Language Dropdown */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <div onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: 'white', padding: '5px 10px', borderRadius: 4, boxShadow: '0 0 5px rgba(0,0,0,0.2)' }}>
          <img src={currentLanguage.flag} alt={currentLanguage.label} style={{ width: 20, marginRight: 8 }} />
          <span>{currentLanguage.label}</span>
        </div>

        {isOpen && (
          <div style={{ position: 'absolute', top: '100%', right: 0, backgroundColor: 'white', border: '1px solid #ccc', borderRadius: 4, marginTop: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', minWidth: 130, zIndex: 2000 }}>
            {languages.map(lang => (
              <div key={lang.code} onClick={() => changeLanguage(lang.code)} style={{ padding: '5px 10px', display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: lang.code === currentLanguage.code ? '#eee' : 'white' }}>
                <img src={lang.flag} alt={lang.label} style={{ width: 20, marginRight: 8 }} />
                <span>{lang.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <h1 style={{ marginTop: '60px' }}>{t('manage_products')}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#add8e6" }}>
            <tr>
              <th>{t('product_name')}</th>
              <th>{t('product_code')}</th>
              <th>{t('unit')}</th>
              <th>{t('quantity')}</th>
              <th>{t('buyingPrice')}</th>
              <th>{t('retailPrice')}</th>
              <th>{t('wholesalePrice')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type="text" name="productName" value={formData.productName} onChange={handleChange} placeholder="Product Name" style={{ width: "100%" }} /></td>
              <td><input type="text" name="productCode" value={formData.productCode} disabled style={{ width: "100%", backgroundColor: "#f0f0f0" }} /></td>
              <td>
                <select name="unitName" value={formData.unitName} onChange={handleChange}>
                  {units.map(u => <option key={u.unitId} value={u.unitName}>{u.unitName}</option>)}
                </select>
              </td>
              <td><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantity" style={{ width: "100%" }} /></td>
              <td><input type="number" name="buyingPrice" value={formData.buyingPrice} onChange={handleChange} placeholder="Buying Price" style={{ width: "100%" }} /></td>
              <td><input type="number" name="sellingPriceRetail" value={formData.sellingPriceRetail} onChange={handleChange} placeholder="Retail Price" style={{ width: "100%" }} /></td>
              <td><input type="number" name="sellingPriceWholesale" value={formData.sellingPriceWholesale} onChange={handleChange} placeholder="Wholesale Price" style={{ width: "100%" }} /></td>
              <td>
                <button type="submit" disabled={loading}>{editingIdentifier ? "Update" : "Add"}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>

      {/* Products Table */}
      <h2>{t('products')}</h2>
      {loading ? <p>{t('loading_products')}</p> :
        products.length === 0 ? <p>{t('no_products_found')}</p> :
          <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#add8e6" }}>
              <tr>
                <th>{t('product_name')}</th>
                <th>{t('product_code')}</th>
                <th>{t('unit')}</th>
                <th>{t('quantity')}</th>
                <th>{t('buying_price')}</th>
                <th>{t('retail_price')}</th>
                <th>{t('wholesale_price')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map(prod => (
                <tr key={prod.productId}>
                  <td>{prod.productName}</td>
                  <td>{prod.productCode}</td>
                  <td>{prod.unit?.unitName || "-"}</td>
                  <td>{prod.quantity}</td>
                  <td>{prod.buyingPrice}</td>
                  <td>{prod.sellingPriceRetail}</td>
                  <td>{prod.sellingPriceWholesale}</td>
                  <td>
                    <button onClick={() => handleEdit(prod)} style={{ marginRight: "0.5rem" }}>Edit</button>
                    <button onClick={() => handleDelete(prod.productId)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
    </div>
  );
};

export default ManageProducts;


