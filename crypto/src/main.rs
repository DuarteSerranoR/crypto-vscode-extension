

use logger;
use crate::logger::setup_logger;

mod crypto_static;

/////////////////////////////////////////////
/// Binnary to run API tests
/////////////////////////////////////////////
fn main() {

    // Logger imported from https://github.com/DuarteSerranoR/info_disco_of_awesomeness
    // Setup the program logs
    setup_logger().expect("Failed to load logger!");

    /*
    let key: &str = "";
    let algorithm_name: &str = "";
    let input_token: &str = "";
    let salt: Bytes = "0".bytes();
    let pepper: Bytes = "0".bytes();
    */

    log::info!("Starting encryption");
    let cyphered_txt: String = crypto_static::encrypt(String::from("message"));
    log::info!("{}", cyphered_txt);

    /*
    let aes: crypto::SymetricAES = crypto::SymetricAES::new(pepper, 10);
    let encrypted_token = aes.encrypt("abcdefg".to_string(), "".to_string(), salt);
    */

    //log::info!("Starting token decryption");
    /*
    let output_token = "";

    match input_token {
        output_token => {
            log::info!("Encryption/Decription successful");
            log::info!("Generated token -> '{}'", encrypted_token);
        },
        _ => {
            log::error!("Encryption/Decription failed");
        }
    }
    */

    /*
    if inputToken.eq(outputToken) {

    } else {
        log::error!("Encryption/Decription failed");
    }
    */
}
