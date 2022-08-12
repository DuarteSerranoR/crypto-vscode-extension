

mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub mod crypto_static;
pub use crypto_static::encrypt;

#[wasm_bindgen]
pub fn rust_encrypt(message: String) -> String {
    return encrypt(message);
}
