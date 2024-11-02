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
  const [decryptedCards, setDecryptedCards] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if card number already exists in decrypted cards
    const cardExists = decryptedCards.some(
      (card) => card.decrypted_card_number === cardNumber
    );

    if (cardExists) {
      setError("This card number already exists in your stored cards.");
      return;
    }

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
          setError("");
          fetchStoredCards(); // Refresh the list of stored cards
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

  const decryptStoredCards = async () => {
    try {
      const decryptedData = await Promise.all(
        storedCards.map(async (card) => {
          const decryptResponse = await fetch("http://localhost:5000/decrypt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              encryptedCardNumber: card.encrypted_card_number,
              encryptedExpiryDate: card.encrypted_expiry_date,
              encryptedCvv: card.encrypted_cvv,
            }),
          });

          const decryptedCard = await decryptResponse.json();
          if (decryptResponse.ok) {
            return {
              decrypted_card_number: decryptedCard.decrypted_card_number,
              decrypted_expiry_date: decryptedCard.decrypted_expiry_date,
              decrypted_cvv: decryptedCard.decrypted_cvv,
            };
          } else {
            throw new Error("Failed to decrypt card data.");
          }
        })
      );
      setDecryptedCards(decryptedData);
    } catch (error) {
      console.error("Error decrypting stored cards:", error);
      setError("An error occurred while decrypting cards.");
    }
  };

  useEffect(() => {
    fetchStoredCards();
  }, [userId]);
  
  useEffect(() => {
    if (storedCards.length > 0) decryptStoredCards();
  }, [storedCards]);

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
        <button type="button" onClick={fetchStoredCards}>Fetch Stored Cards</button>
        <button type="button" onClick={decryptStoredCards}>Decrypted Cards</button>
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

      <div>
        <h2>My Cards</h2>
        {storedCards.length > 0 ? (
          <ul>
            {storedCards.map((card, index) => (
              <li key={index}>
                <p><strong>Card Number:</strong> {card.encrypted_card_number.ciphertext}</p>
                <p><strong>Expiry:</strong> {card.encrypted_expiry_date.ciphertext}</p>
                <p><strong>CVC:</strong> {card.encrypted_cvv.ciphertext}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No card details available.</p>
        )}
      </div>

      <div>
        <h2>Decrypted Cards</h2>
        {decryptedCards.length > 0 ? (
          <ul>
            {decryptedCards.map((card, index) => (
              <li key={index}>
                <p><strong>Card Number:</strong> {card.decrypted_card_number}</p>
                <p><strong>Expiry:</strong> {card.decrypted_expiry_date}</p>
                <p><strong>CVC:</strong> {card.decrypted_cvv}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No decrypted card details available.</p>
        )}
      </div>
    </div>
  );
}

export default CreditCardForm;
