
/*
use aead::{self, generic_array::{GenericArray, ArrayLength}, Payload, KeyInit, AeadInPlace, Nonce};
use aes_gcm::{Aes256Gcm, aes::Aes256, AesGcm};

#[derive(Debug)]
pub struct AesGcmr {
    cypher: AesGcm<Aes256, NonceSize>, // 12 = NonceSize
    nonce: Vec<u8>,
    //aad: &'static [u8],
    //tag: &'static [u8; 16],

    //
    iv_len: usize
}

//impl Copy for SymetricAES {
//    fn copy(&self) -> SymetricAES {
//        *self
//    }
//}

impl AesGcmr {
    /// Creates a new [`AES-GCMR`] encryption object (typeof AesGcmr).
    pub fn new() -> Self {
        let key_len: usize = 10; // TODO 
        let nounce_len: usize = 12; // TODO 

        let key_bytes: Vec<u8> = (0..key_len.clone()).map(|_| { rand::random::<u8>() }).collect();
        let key = GenericArray::from_slice(&key_bytes);
        Self {
            //key: Aes256Gcm::generate_key(&mut OsRng),
            cypher: Aes256Gcm::new(&key),
            nonce: (0..nounce_len.clone()).map(|_| { rand::random::<u8>() }).collect(),

            //key_size: 32, // 32 bytes - unique per secret, generated from the string key
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
    pub fn encrypt(self, message: String) -> String {
        let nonce = GenericArray::from_slice(&self.nonce);
        
        let mut message_buffer: Vec<u8> = Vec::new();
        message_buffer.extend_from_slice(message.as_bytes());

        let cipher = Aes256Gcm::new(&key);
        cipher.encrypt_in_place(nonce, b"", &mut message_buffer);
        
        return message_buffer.

        /*
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
        */
    }

    
    /// .
    pub fn decrypt(password: String, encrypted_message: String, salt: [u8; 16]) -> String {
        return "".to_string();
    }
}
*/