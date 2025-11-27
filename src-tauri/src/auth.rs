use crate::models::connection::ConnectionProfile;
use anyhow::Result;

pub trait Authenticator {
    // We take a mutable reference to the request to modify it (add headers)
    fn sign(&self, request: &mut http::Request<Vec<u8>>, profile: &ConnectionProfile)
    -> Result<()>;
}

pub mod aws;
pub mod basic;
