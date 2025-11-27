use super::Authenticator;
use crate::models::connection::ConnectionProfile;
use anyhow::Result;
use base64::prelude::*;
use http::header::AUTHORIZATION;

pub struct BasicAuth;

impl Authenticator for BasicAuth {
    fn sign(
        &self,
        request: &mut http::Request<Vec<u8>>,
        profile: &ConnectionProfile,
    ) -> Result<()> {
        if let (Some(u), Some(p)) = (&profile.username, &profile.password) {
            let auth = format!("{}:{}", u, p);
            let encoded = BASE64_STANDARD.encode(auth);
            let header_value = format!("Basic {}", encoded);
            request
                .headers_mut()
                .insert(AUTHORIZATION, header_value.parse()?);
        }
        Ok(())
    }
}
