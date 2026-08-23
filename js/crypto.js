/**
 * Personal Hub - Web Crypto Security Module
 * Sử dụng Web Crypto API (AES-GCM 256-bit + PBKDF2 100,000 iterations)
 * Đảm bảo dữ liệu nhạy cảm chỉ được giải mã trên trình duyệt của người dùng.
 */

class CryptoService {
  constructor() {
    this.masterKey = null;
    this.isUnlocked = false;
    this.sessionTimeout = null;
    this.autoLockMinutes = 15;
  }

  // Chuyển chuỗi thành ArrayBuffer
  str2ab(str) {
    const enc = new TextEncoder();
    return enc.encode(str);
  }

  // Chuyển ArrayBuffer thành chuỗi
  ab2str(buf) {
    const dec = new TextDecoder();
    return dec.decode(buf);
  }

  // Chuyển buffer thành chuỗi Base64
  buf2base64(buf) {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Chuyển chuỗi Base64 thành ArrayBuffer
  base642buf(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Tạo salt ngẫu nhiên
  generateSalt() {
    return window.crypto.getRandomValues(new Uint8Array(16));
  }

  // Tạo IV ngẫu nhiên (12 bytes cho AES-GCM)
  generateIv() {
    return window.crypto.getRandomValues(new Uint8Array(12));
  }

  // Tạo khóa mã hóa từ mật khẩu chính (Master Password/PIN) bằng PBKDF2
  async deriveKey(password, salt) {
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      this.str2ab(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  // Thiết lập hoặc mở khóa két với Mật khẩu Master
  async unlock(password, savedSaltBase64, savedVerifierBase64) {
    try {
      let salt;
      if (savedSaltBase64) {
        salt = new Uint8Array(this.base642buf(savedSaltBase64));
      } else {
        salt = this.generateSalt();
      }

      const key = await this.deriveKey(password, salt);

      // Nếu đã có verifier (kiểm tra mật khẩu đúng/sai)
      if (savedVerifierBase64) {
        const decrypted = await this.decryptWithKey(savedVerifierBase64, key);
        if (decrypted !== "VAULT_AUTH_VERIFIED_SUCCESS") {
          return { success: false, error: "Mật khẩu không chính xác!" };
        }
      }

      this.masterKey = key;
      this.isUnlocked = true;
      this.resetAutoLockTimer();

      // Nếu là lần đầu thiết lập
      let verifierBase64 = savedVerifierBase64;
      let newSaltBase64 = savedSaltBase64;
      if (!savedVerifierBase64) {
        newSaltBase64 = this.buf2base64(salt.buffer);
        verifierBase64 = await this.encryptWithKey("VAULT_AUTH_VERIFIED_SUCCESS", key);
      }

      return {
        success: true,
        saltBase64: newSaltBase64,
        verifierBase64: verifierBase64
      };
    } catch (err) {
      console.error("Lỗi khi mở khóa két:", err);
      return { success: false, error: "Không thể xác thực mật khẩu. Vui lòng thử lại!" };
    }
  }

  // Khóa két
  lock() {
    this.masterKey = null;
    this.isUnlocked = false;
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  // Đặt lại đếm ngược tự động khóa
  resetAutoLockTimer() {
    if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
    this.sessionTimeout = setTimeout(() => {
      this.lock();
      window.dispatchEvent(new CustomEvent("vault-autolocked"));
    }, this.autoLockMinutes * 60 * 1000);
  }

  // Mã hóa một chuỗi hoặc object dữ liệu
  async encrypt(data) {
    if (!this.isUnlocked || !this.masterKey) {
      throw new Error("Két đang bị khóa. Hãy mở khóa trước khi mã hóa!");
    }
    const plainText = typeof data === "object" ? JSON.stringify(data) : String(data);
    return this.encryptWithKey(plainText, this.masterKey);
  }

  // Giải mã một chuỗi Base64
  async decrypt(cipherTextBase64) {
    if (!this.isUnlocked || !this.masterKey) {
      throw new Error("Két đang bị khóa. Hãy mở khóa trước khi giải mã!");
    }
    const decryptedStr = await this.decryptWithKey(cipherTextBase64, this.masterKey);
    try {
      return JSON.parse(decryptedStr);
    } catch {
      return decryptedStr;
    }
  }

  // Hàm nội bộ mã hóa với key
  async encryptWithKey(plainText, key) {
    const iv = this.generateIv();
    const encoded = this.str2ab(plainText);
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoded
    );

    // Ghép IV (12 bytes) + Ciphertext
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    return this.buf2base64(combined.buffer);
  }

  // Hàm nội bộ giải mã với key
  async decryptWithKey(cipherTextBase64, key) {
    const combinedBuffer = this.base642buf(cipherTextBase64);
    const combined = new Uint8Array(combinedBuffer);

    // Tách IV (12 bytes) và Ciphertext
    const iv = combined.slice(0, 12);
    const cipherText = combined.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      cipherText
    );

    return this.ab2str(decryptedBuffer);
  }
}

window.cryptoService = new CryptoService();
