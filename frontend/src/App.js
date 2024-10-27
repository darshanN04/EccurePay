import React, { useState } from 'react';

function CreditCardForm() {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [signature, setSignature] = useState('');
  const [encryptedData, setEncryptedData] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);
  const [verification, setVerification] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Step 1: Sign the card number
      const signResponse = await fetch("http://localhost:5000/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber }),
      });
      const signData = await signResponse.json();
      setSignature(signData.signature);

      // Step 2: Encrypt card details
      const encryptResponse = await fetch("http://localhost:5000/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber, expiryDate, cvv }),
      });
      const encryptData = await encryptResponse.json();
      setEncryptedData(encryptData);

      // Step 3: Verify signature
      const verifyResponse = await fetch("http://localhost:5000/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: signData.signature, cardNumber }),
      });
      const verifyData = await verifyResponse.json();
      setVerification(verifyData.verification);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedData) return;

    const decryptResponse = await fetch("http://localhost:5000/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encryptedCardNumber: encryptedData.encrypted_card_number,
        encryptedExpiryDate: encryptedData.encrypted_expiry_date,
        encryptedCvv: encryptedData.encrypted_cvv,
      }),
    });
    const decryptData = await decryptResponse.json();
    setDecryptedData(decryptData);
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2>Enter Card Details</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Card Number:</label>
          <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength="16" required />
        </div>
        <div>
          <label>Expiry Date (MM/YY):</label>
          <input type="text" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} maxLength="5" required />
        </div>
        <div>
          <label>CVV:</label>
          <input type="password" value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength="3" required />
        </div>
        <button type="submit">Submit</button>
      </form>

      {signature && (
        <div>
          <h3>Signature</h3>
          <p>{signature}</p>
        </div>
      )}

      {verification && (
        <div>
          <h3>Verification Result</h3>
          <p>{verification}</p>
          
          
        </div>
      )}

      {encryptedData && (
        <div>
          <h3>Encrypted Data</h3>
          <p>Card Number: {encryptedData.encrypted_card_number.ciphertext}</p>
          <p>Expiry Date: {encryptedData.encrypted_expiry_date.ciphertext}</p>
          <p>CVV: {encryptedData.encrypted_cvv.ciphertext}</p>
          <button onClick={handleDecrypt}>Decrypt Data</button>
        </div>
      )}

      {decryptedData && (
        <div>
          <h3>Decrypted Data</h3>
          <p>Card Number: {decryptedData.decrypted_card_number}</p>
          <p>Expiry Date: {decryptedData.decrypted_expiry_date}</p>
          <p>CVV: {decryptedData.decrypted_cvv}</p>
        </div>
      )}
    </div>
  );
}

export default CreditCardForm;
