import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../UserContext';

function CreditCardForm() {
  const { userId } = useContext(UserContext);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [encryptedData, setEncryptedData] = useState(null);
  const [error, setError] = useState('');
  const [storedCards, setStoredCards] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const encryptResponse = await fetch("http://localhost:5000/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber, expiryDate, cvv }),
      });

      const encryptData = await encryptResponse.json();
      if (encryptResponse.ok) {
        const storeResponse = await fetch("http://localhost:5000/store-encrypted", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            encrypted_card_number: encryptData.encrypted_card_number,
            encrypted_expiry_date: encryptData.encrypted_expiry_date,
            encrypted_cvv: encryptData.encrypted_cvv,
          }),
        });

        if (storeResponse.ok) {
          setEncryptedData(encryptData);
          fetchStoredCards();  // Fetch cards after a successful store
        } else {
          const storeData = await storeResponse.json();
          setError(storeData.error || "Failed to store encrypted data");
        }
      } else {
        setError(encryptData.error);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred during the process.");
    }
  };

  const fetchStoredCards = async () => {
    try {
      const retrieveResponse = await fetch("http://localhost:5000/retrieve-encrypted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const cardsData = await retrieveResponse.json();
      if (retrieveResponse.ok) {
        setStoredCards(cardsData);
      } else {
        setError(cardsData.error || "Failed to retrieve cards");
      }
    } catch (error) {
      console.error("Error fetching stored cards:", error);
      setError("An error occurred while retrieving cards.");
    }
  };

  useEffect(() => {
    fetchStoredCards();
  }, [userId]);

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

      {encryptedData && (
        <div>
          <h3>Encrypted Data</h3>
          <p>Card Number: {encryptedData.encrypted_card_number.ciphertext}</p>
          <p>Expiry Date: {encryptedData.encrypted_expiry_date.ciphertext}</p>
          <p>CVV: {encryptedData.encrypted_cvv.ciphertext}</p>
        </div>
      )}

      {error && <div className='error'>{error}</div>}

      <h3>Stored Cards</h3>
      <ul>
        {storedCards.map((card, index) => (
          <li key={index}>
            <p>Card Number: {card.encrypted_card_number.ciphertext}</p>
            <p>Expiry Date: {card.encrypted_expiry_date.ciphertext}</p>
            <p>CVV: {card.encrypted_cvv.ciphertext}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CreditCardForm;
