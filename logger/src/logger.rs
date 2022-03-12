use log::{Record, Level, Metadata, LevelFilter, SetLoggerError};
extern crate chrono;
use chrono::offset::Utc;
use chrono::DateTime;
use std::time::SystemTime;

// --> Example of logger usages:
// ############
//log::info!("Starting up application");
//log::warn!("warning");
//log::error!("oops");
//log::debug!("debug");
//log::log!(log::Level::Trace, "log");
// ############ //

pub struct ConsoleLogger;
pub static CONSOLE_LOGGER: ConsoleLogger = ConsoleLogger;

impl log::Log for ConsoleLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= Level::Info
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            let system_time = SystemTime::now();
            let datetime: DateTime<Utc> = system_time.into();
            println!("{} - {} - {}", datetime.format("%d/%m/%Y %T"), record.level(), record.args());
        }
    }

    fn flush(&self) {}
}

pub fn setup_logger() -> Result<(), SetLoggerError> {
    log::set_logger(&CONSOLE_LOGGER)?;
    log::set_max_level(LevelFilter::Info);
    Ok(())
}
