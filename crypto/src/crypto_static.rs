
extern crate base64;

use aead::{self, KeyInit, AeadInPlace, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};

pub fn encrypt(message: String) -> String {
    //let key_len: usize = 32; // TODO 
    //let nounce_len: usize = 12; // TODO 

    //let key_vec: Vec<u8> = (0..key_len.clone()).map(|_| { rand::random::<u8>() }).collect();
    //let key_bytes: &[u8] = &key_vec;
    //let key = GenericArray::from_slice(key_bytes);

    //let nonce_vec: Vec<u8> = (0..nounce_len.clone()).map(|_| { rand::random::<u8>() }).collect();
    //let nonce_bytes: &[u8] = &nonce_vec;
    //let nonce = GenericArray::from_slice(nonce_bytes);
    
    let nonce = Nonce::from_slice(b"unique nonce"); // 96-bits; unique per message

    let key = Aes256Gcm::generate_key(&mut OsRng);
    
    let mut message_buffer: Vec<u8> = Vec::new();
    message_buffer.extend_from_slice(message.as_bytes());

    let cipher = Aes256Gcm::new(&key);
    cipher.encrypt_in_place(nonce, b"", &mut message_buffer).map_err(|err| log::error!("{:?}", err)).ok();
    drop(nonce);
    drop(cipher);
    
    return base64::encode(&message_buffer);
}

    
    //// .
    //pub fn decrypt(password: String, encrypted_message: String, salt: [u8; 16]) -> String {
    //    return "".to_string();
    //}
