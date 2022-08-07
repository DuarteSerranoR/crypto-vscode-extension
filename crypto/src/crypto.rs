
use digest::Digest;
use aead::AeadCore;

#[derive(Clone)]
pub struct SymetricAES {
    pepper_seed: Vec<u8>,
    num_iterations: u32, // Rfc2898 derivation iterations
    key: Vec<u8>,
    //key_size: KeySize,
    pub salt_length: u32,
    pub iv_len: usize
}

//impl Copy for SymetricAES {
//    fn copy(&self) -> SymetricAES {
//        *self
//    }
//}

impl SymetricAES {
    /// Creates a new [`SymetricAES`].
    pub fn new(pepper: Vec<u8>, iterations: u32) -> Self {
        let key_len = 10;
        Self {
            num_iterations: iterations,
            pepper_seed: pepper, // The pepper is per application, but as of now, it is configurable
            key: (0..key_len.clone()).map(|_| { rand::random::<u8>() }).collect(),
            //key_size: 32, // 32 bytes - unique per secret, generated from the string key
            salt_length: 16, // 16 bytes - unique per secret, stored with secret. Concatenated with papper yields 32 bytes.
            iv_len: 16 // 16 bytes for the random initialization vector - cannot be changed, depends on AES
        }
    }

    /// .
    fn generate_iv_vec(self) -> Vec<u8> {
        let random_bytes: Vec<u8> = (0..self.iv_len.clone()).map(|_| { rand::random::<u8>() }).collect();
        return random_bytes;
    }

    /// .
    ///
    /// # Panics
    ///
    /// Panics if .
    pub fn encrypt(self, password: String, message: String, salt: Vec<u8>) -> String {

        // If type == AES
        let iv_vec: &[u8] = &self.clone().generate_iv_vec();
        let key_vec: Vec<u8> = self.clone().key.clone();
        let key: &[u8] = &key_vec;
        //let padding: NoPadding = NoPadding;

        let mut hasher = AeadCore::new();
        hasher.
        hasher.input(password.as_str().as_bytes());
        hasher.input(b"$");
        hasher.input(salt.as_bytes());
        output.copy_from_slice(hasher.finalize().as_slice());
        /*
        let mut aes: Box<dyn Encryptor> = crypto::aes::cbc_encryptor(KeySize::KeySize256, key, iv_vec, padding);

        let out_buffer: &mut [u8] = &mut [];
        let output: &mut RefWriteBuffer = &mut RefWriteBuffer::new(out_buffer);
        let password_reader: &mut RefReadBuffer = &mut RefReadBuffer::new(password.as_bytes());

        let result: Result<BufferResult, crypto::symmetriccipher::SymmetricCipherError> = aes.encrypt(password_reader, output, true);
        result.err();
        */

        let s: &str = match std::str::from_utf8(out_buffer) {
            Ok(v) => v,
            Err(e) => panic!("Invalid UTF-8 sequence: {}", e),
        };
        return s.to_string();//"".to_string();
    }

    
    /// .
    pub fn decrypt(password: String, encrypted_message: String, salt: [u8; 16]) -> String {
        return "".to_string();
    }
}
