from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from flask_cors import CORS
from Crypto.PublicKey import ECC
from Crypto.Cipher import AES
from Crypto.Hash import SHA256
import bcrypt
import base64
from bson import ObjectId


app = Flask(__name__)
CORS(app)

# MongoDB Configuration - include the database name
app.config["MONGO_URI"] = "mongodb+srv://darshannakshatri:LTj4bPBUbQrXxfli@isclusterecc.iqpnm.mongodb.net/eccurepay?retryWrites=true&w=majority"
mongo = PyMongo(app)

# Define the users collection
users_collection = mongo.db.users

# Helper function to generate a user-specific ECC key pair
def generate_user_key_pair():
    private_key = ECC.generate(curve='P-256')
    public_key = private_key.public_key()
    return private_key, public_key

# Encrypt the private key for storage using bcrypt
def encrypt_private_key(private_key_pem, password):
    salt = bcrypt.gensalt()
    hashed_key = bcrypt.hashpw(private_key_pem.encode(), salt)
    return base64.b64encode(hashed_key).decode()

# Decrypt and verify private key with bcrypt
def decrypt_private_key(encrypted_private_key, password):
    return base64.b64decode(encrypted_private_key.encode()).decode()

# Encryption and decryption functions
def encrypt_message(public_key, message):
    shared_secret = public_key.pointQ * ECC.generate(curve='P-256').d
    shared_secret_bytes = int(shared_secret.x).to_bytes(32, byteorder='big')
    aes_key = SHA256.new(shared_secret_bytes).digest()

    cipher = AES.new(aes_key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(message.encode('utf-8'))
    return {
        "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
        "nonce": base64.b64encode(cipher.nonce).decode('utf-8'),
        "tag": base64.b64encode(tag).decode('utf-8')
    }

def decrypt_message(encrypted_data, private_key):
    ciphertext = base64.b64decode(encrypted_data['ciphertext'])
    nonce = base64.b64decode(encrypted_data['nonce'])
    tag = base64.b64decode(encrypted_data['tag'])
    shared_secret = private_key.pointQ * ECC.generate(curve='P-256').d
    shared_secret_bytes = int(shared_secret.x).to_bytes(32, byteorder='big')
    aes_key = SHA256.new(shared_secret_bytes).digest()

    cipher = AES.new(aes_key, AES.MODE_GCM, nonce=nonce)
    decrypted_message = cipher.decrypt_and_verify(ciphertext, tag)
    return decrypted_message.decode('utf-8')

# Signup route
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    phone = data.get('phone')
    email = data.get('email')
    age = data.get('age')
    password = data.get('password')

    if not username or not phone or not email or not age or not password:
        return jsonify({'status': 'error', 'message': 'All fields are required.'}), 400

    # Check if user already exists
    if users_collection.find_one({'username': username}):
        return jsonify({'status': 'error', 'message': 'User already exists.'}), 400

    # Generate unique key pair for the user
    private_key, public_key = generate_user_key_pair()
    private_key_pem = private_key.export_key(format='PEM')
    public_key_pem = public_key.export_key(format='PEM')

    # Hash password and encrypt the private key with bcrypt for secure storage
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    encrypted_private_key = encrypt_private_key(private_key_pem, password)

    user_data = {
        'username': username,
        'phone': phone,
        'email': email,
        'age': age,
        'password': hashed_password,
        'public_key': public_key_pem,
        'private_key': encrypted_private_key,  # Store encrypted private key
        'cards': []  # Initialize an empty list for storing card information
    }

    try:
        users_collection.insert_one(user_data)
        return jsonify({'status': 'success', 'message': 'User created successfully.'}), 201
    except Exception as e:
        print(f"Error inserting user: {e}")
        return jsonify({'status': 'error', 'message': 'Signup failed. Please try again.'}), 500

# Login route
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'status': 'error', 'message': 'Username and password are required.'}), 400

    user = users_collection.find_one({'username': username})

    if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'status': 'success', 'userId': str(user['_id']), 'message': 'Login successful.'}), 200
    else:
        return jsonify({'status': 'error', 'message': 'Invalid username or password.'}), 401

# Encrypt card details
@app.route('/encrypt', methods=['POST'])
def encrypt():
    data = request.get_json()
    user_id = data.get("userId")
    card_number = data['cardNumber']
    expiry_date = data['expiryDate']
    cvv = data['cvv']

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    public_key = ECC.import_key(user['public_key'])

    encrypted_card_number = encrypt_message(public_key, card_number)
    encrypted_expiry_date = encrypt_message(public_key, expiry_date)
    encrypted_cvv = encrypt_message(public_key, cvv)

    return jsonify({
        "encrypted_card_number": encrypted_card_number,
        "encrypted_expiry_date": encrypted_expiry_date,
        "encrypted_cvv": encrypted_cvv
    })

# Store encrypted card details
@app.route('/store-encrypted', methods=['POST'])
def store_encrypted():
    data = request.get_json()
    user_id = data.get("userId")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    encrypted_data = {
        "encrypted_card_number": data['encrypted_card_number'],
        "encrypted_expiry_date": data['encrypted_expiry_date'],
        "encrypted_cvv": data['encrypted_cvv']
    }

    try:
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$push': {'cards': encrypted_data}}
        )
        return jsonify({"status": "Stored successfully"}), 201
    except Exception as e:
        print(f"Error storing card data: {e}")
        return jsonify({"error": "Failed to store card data"}), 500

# Retrieve and decrypt card details
@app.route('/retrieve-decrypted', methods=['POST'])
def retrieve_decrypted():
    data = request.get_json()
    user_id = data.get("userId")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)}, {"cards": 1, "private_key": 1, "public_key": 1})
        if not user:
            return jsonify({"error": "User not found"}), 404

        private_key = ECC.import_key(decrypt_private_key(user['private_key']))
        public_key = ECC.import_key(user['public_key'])

        decrypted_cards = []
        for card in user["cards"]:
            decrypted_card = {
                "card_number": decrypt_message(card["encrypted_card_number"], private_key),
                "expiry_date": decrypt_message(card["encrypted_expiry_date"], private_key),
                "cvv": decrypt_message(card["encrypted_cvv"], private_key)
            }
            decrypted_cards.append(decrypted_card)

        return jsonify(decrypted_cards), 200
    except Exception as e:
        print(f"Error retrieving or decrypting cards: {e}")
        return jsonify({"error": "Failed to retrieve or decrypt cards"}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
