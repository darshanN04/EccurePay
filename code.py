from ecies import encrypt, decrypt
import binascii

def generate_keys():
    from ecies.utils import generate_eth_key
    private_key = generate_eth_key()
    public_key = private_key.public_key
    return private_key.to_hex(), public_key.to_hex()

def encrypt_message(public_key_hex, message):
    message_bytes = message.encode('utf-8')
    encrypted_bytes = encrypt(public_key_hex, message_bytes)
    encrypted_hex = binascii.hexlify(encrypted_bytes).decode('utf-8')
    return encrypted_hex

def decrypt_message(private_key_hex, encrypted_hex):
    encrypted_bytes = binascii.unhexlify(encrypted_hex)
    decrypted_bytes = decrypt(private_key_hex, encrypted_bytes)
    decrypted_message = decrypted_bytes.decode('utf-8')
    return decrypted_message

def main():
    private_key = "0xca1c53e3ff4a1e51a80aadac8a35e4715d814585b0c0ed513fcadf95ba76cb28"
    public_key = "0x38171b50a2915af5088a248b2de8fe782493e797ef823a5cbfb24163efa92f018c8829aa0df876e1d37d1709d8cc29b5924ea9589dcc93443364c372acf8f6a7"
    print("=== ECC Key Pair ===")
    print(f"Private Key: {private_key}")
    print(f"Public Key: {public_key}\n")

    plaintext = "1234-5678-9012-3456"
    print(f"Plaintext Message: {plaintext}\n")

    encrypted_message = encrypt_message(public_key, plaintext)
    print(f"Encrypted Message (Hex): {encrypted_message}\n")

    decrypted_message = decrypt_message(private_key, encrypted_message)
    print(f"Decrypted Message: {decrypted_message}")

if __name__ == "__main__":
    main()
