import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useParams } from 'react-router-dom';

const Invoice = () => {
  const { saleId } = useParams();
  const [saleData, setSaleData] = useState(null);

  useEffect(() => {
  fetch(`${process.env.REACT_APP_API_BASE_URL}/api/sales/${saleId}`)
    .then(res => res.json())
    .then(data => {
      console.log('Fetched sale data:', data); // 🧪 debug here
      setSaleData(data);
    })
    .catch(err => console.error(err));
}, [saleId]);


  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const phone = saleData?.customer?.mobile;
    const message = `Thank you for your purchase!\nBill No: ${saleData?.saleId}\nTotal: ₹${saleData?.totalAmount}`;
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!saleData || !saleData.saleId || !saleData.customer || !saleData.saleItems) {
    console.log('Fetched sale data:', saleData);
  return <p>Loading invoice...</p>;
}



  return (
    <div id="invoice" style={{ fontFamily: 'Courier New, monospace', padding: '20px', maxWidth: '600px', margin: 'auto', border: '1px solid #000' }}>
      <pre style={{ textAlign: 'center', fontSize: '16px' }}>
------------------------------------------------------------
                   [AWASTHI ATTA CHAKKI]
             Bamba Road Gumti No-5 | Phone: 6391757757
------------------------------------------------------------
Bill No: {saleData.saleId.toString().padStart(6, '0')}        Date: {saleData.saleDate}
Customer: {saleData.customer.name}     Phone: {saleData.customer.mobile}
Type: {saleData.saleType}              Payment: {saleData.paymentMode}
------------------------------------------------------------
Product         Qty   Unit   Rate   Total
------------------------------------------------------------
{saleData.saleItems.map(item => {
  const line =
    item.productName.padEnd(15, ' ').slice(0, 15) +
    item.quantity.toString().padEnd(6, ' ') +
    item.unitName.padEnd(6, ' ').slice(0, 6) +
    item.price.toString().padEnd(7, ' ') +
    String(item.price * item.quantity).padEnd(6, ' ');
  return line;
}).join('\n')}
------------------------------------------------------------
Gross Total                         ₹ {saleData.totalAmount}
------------------------------------------------------------
        Thank You! Visit Again
        Best Wishes from [Your Store Name]
------------------------------------------------------------
      </pre>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={handlePrint}>🖨️ Print</button>
        <button onClick={handleWhatsApp} style={{ marginLeft: '10px' }}>📲 Send on WhatsApp</button>
      </div>
    </div>
  );
};

export default Invoice;
