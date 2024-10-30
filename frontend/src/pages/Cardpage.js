import React, { useState } from 'react';

function CreditCardForm() {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [encryptedData, setEncryptedData] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);
  const [cardId, setCardId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Step 1: Encrypt card details
      const encryptResponse = await fetch("http://localhost:5000/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber, expiryDate, cvv }),
      });

      const encryptData = await encryptResponse.json();
      if (encryptResponse.ok) {
        // Step 2: Store encrypted data in MongoDB
        const storeResponse = await fetch("http://localhost:5000/store-encrypted", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            encrypted_card_number: encryptData.encrypted_card_number,
            encrypted_expiry_date: encryptData.encrypted_expiry_date,
            encrypted_cvv: encryptData.encrypted_cvv,
          }),
        });

        const storeData = await storeResponse.json();
        if (storeResponse.ok) {
          setEncryptedData(encryptData); // Set encrypted data if stored successfully
        } else {
          setError("Failed to store encrypted data");
        }
      } else {
        setError(encryptData.error);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred during the process.");
    }
  };

  const handleRetrieve = async () => {
    if (!cardId) return;

    try {
      const retrieveResponse = await fetch("http://localhost:5000/retrieve-encrypted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });

      const retrieveData = await retrieveResponse.json();

      if (retrieveResponse.ok) {
        // Decrypt the retrieved data
        const decryptResponse = await fetch("http://localhost:5000/decrypt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            encryptedCardNumber: retrieveData.encrypted_card_number.ciphertext,
            encryptedExpiryDate: retrieveData.encrypted_expiry_date.ciphertext,
            encryptedCvv: retrieveData.encrypted_cvv.ciphertext,
          }),
        });

        const decryptData = await decryptResponse.json();
        setDecryptedData(decryptData);
      } else {
        setError(retrieveData.error);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred during the retrieval process.");
    }
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

      <div>
        <h3>Retrieve Stored Card Data</h3>
        <input
          type="text"
          placeholder="Enter Card ID to Retrieve"
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
        />
        <button onClick={handleRetrieve}>Retrieve Data</button>
      </div>

      {encryptedData && (
        <div>
          <h3>Encrypted Data</h3>
          <p>Card Number: {encryptedData.encrypted_card_number.ciphertext}</p>
          <p>Expiry Date: {encryptedData.encrypted_expiry_date.ciphertext}</p>
          <p>CVV: {encryptedData.encrypted_cvv.ciphertext}</p>
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

      {error && <div className='error'>{error}</div>} {/* Display error message */}
    </div>
  );
}

export default CreditCardForm;
