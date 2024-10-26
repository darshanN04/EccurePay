from flask import Flask, jsonify, request
from flask_cors import CORS
from Crypto.PublicKey import ECC
from Crypto.Signature import DSS
from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from Crypto.Random import get_random_bytes
import binascii
import base64
import json
import hashlib

app = Flask(__name__)
CORS(app)

# Generate ECC keys
signing_private_key = ECC.generate(curve='P-256')
signing_public_key = signing_private_key.public_key()
encryption_private_key = ECC.generate(curve='P-256')
encryption_public_key = encryption_private_key.public_key()

def sign_data(private_key, message):
    signer = DSS.new(private_key, 'fips-186-3')
    message_hash = SHA256.new(message.encode('utf-8'))
    signature = signer.sign(message_hash)
    return base64.b64encode(signature).decode('utf-8')

def verify_signature(public_key, message, signature_b64):
    verifier = DSS.new(public_key, 'fips-186-3')
    message_hash = SHA256.new(message.encode('utf-8'))
    try:
        verifier.verify(message_hash, base64.b64decode(signature_b64))
        return True
    except ValueError:
        return False

def encrypt_message(public_key, message):
    # Generate a shared secret using ECC
    shared_secret = public_key.pointQ * encryption_private_key.d
    shared_secret_bytes = int(shared_secret.x).to_bytes(32, byteorder='big')

    # Derive an AES key from the shared secret
    aes_key = SHA256.new(shared_secret_bytes).digest()

    # Encrypt the message using AES with the derived key
    cipher = AES.new(aes_key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(message.encode('utf-8'))
    return {
        "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
        "nonce": base64.b64encode(cipher.nonce).decode('utf-8'),
        "tag": base64.b64encode(tag).decode('utf-8')
    }

def decrypt_message(private_key, encrypted_data):
    shared_secret = encryption_public_key.pointQ * private_key.d
    shared_secret_bytes = int(shared_secret.x).to_bytes(32, byteorder='big')
    aes_key = SHA256.new(shared_secret_bytes).digest()

    cipher = AES.new(aes_key, AES.MODE_GCM, nonce=base64.b64decode(encrypted_data["nonce"]))
    decrypted_data = cipher.decrypt_and_verify(
        base64.b64decode(encrypted_data["ciphertext"]),
        base64.b64decode(encrypted_data["tag"])
    )
    return decrypted_data.decode('utf-8')

def hash_message(message):
    """Hash a message using SHA-256."""
    return hashlib.sha256(message.encode('utf-8')).hexdigest()

# Example of a simple in-memory storage for user hashes (you can use a real database)
user_hashes = set()

@app.route('/sign', methods=['POST'])
def sign():
    data = request.get_json()
    card_number = data.get("cardNumber", "")
    if not card_number:
        return jsonify({"error": "Card number is required"}), 400

    signature = sign_data(signing_private_key, card_number)
    return jsonify({"signature": signature})

@app.route('/verify', methods=['POST'])
def verify():
    data = request.get_json()
    card_number = data.get("cardNumber", "")
    signature = data.get("signature", "")

    if not card_number or not signature:
        return jsonify({"error": "Card number and signature are required"}), 400

    is_verified = verify_signature(signing_public_key, card_number, signature)
    return jsonify({"verification": "success" if is_verified else "failed"})

@app.route('/encrypt', methods=['POST'])
def encrypt():
    data = request.get_json()
    card_number = data.get("cardNumber", "")
    expiry_date = data.get("expiryDate", "")
    cvv = data.get("cvv", "")

    # Hash the card number for comparison
    hashed_card_number = hash_message(card_number)

    # Check if the hashed card number already exists
    if hashed_card_number in user_hashes:
        return jsonify({"error": "Card number already exists"}), 400

    # Store the hash
    user_hashes.add(hashed_card_number)

    encrypted_card_number = encrypt_message(encryption_public_key, card_number)
    encrypted_expiry_date = encrypt_message(encryption_public_key, expiry_date)
    encrypted_cvv = encrypt_message(encryption_public_key, cvv)
    
    return jsonify({
        "encrypted_card_number": encrypted_card_number,
        "encrypted_expiry_date": encrypted_expiry_date,
        "encrypted_cvv": encrypted_cvv
    })

@app.route('/decrypt', methods=['POST'])
def decrypt():
    data = request.get_json()
    encrypted_card_number = data.get("encryptedCardNumber")
    encrypted_expiry_date = data.get("encryptedExpiryDate")
    encrypted_cvv = data.get("encryptedCvv")

    decrypted_card_number = decrypt_message(encryption_private_key, encrypted_card_number)
    decrypted_expiry_date = decrypt_message(encryption_private_key, encrypted_expiry_date)
    decrypted_cvv = decrypt_message(encryption_private_key, encrypted_cvv)

    return jsonify({
        "decrypted_card_number": decrypted_card_number,
        "decrypted_expiry_date": decrypted_expiry_date,
        "decrypted_cvv": decrypted_cvv
    })

if __name__ == '__main__':
    app.run(port=5000)
