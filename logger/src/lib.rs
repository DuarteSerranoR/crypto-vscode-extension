/// You also need to import -> log = "0.4"

pub mod logger;
pub use crate::logger::setup_logger;
pub struct ConsoleLogger;
pub static CONSOLE_LOGGER: ConsoleLogger = ConsoleLogger;
