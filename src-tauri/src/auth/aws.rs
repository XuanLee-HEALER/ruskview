use super::Authenticator;
use crate::models::connection::ConnectionProfile;
use anyhow::{Result, anyhow};
use aws_credential_types::Credentials;
use aws_sigv4::http_request::{
    SignableBody, SignableRequest, SigningParams, SigningSettings, sign,
};
use aws_sigv4::sign::v4;
use aws_smithy_runtime_api::client::identity::Identity;
use sha2::{Digest, Sha256};
use std::time::SystemTime;

pub struct AwsSigV4Auth;

impl Authenticator for AwsSigV4Auth {
    fn sign(
        &self,
        request: &mut http::Request<Vec<u8>>,
        profile: &ConnectionProfile,
    ) -> Result<()> {
        let access_key = profile
            .access_key
            .as_deref()
            .ok_or_else(|| anyhow!("Missing Access Key"))?;
        let secret_key = profile
            .secret_key
            .as_deref()
            .ok_or_else(|| anyhow!("Missing Secret Key"))?;
        let region = profile.region.as_deref().unwrap_or("us-east-1");

        // Calculate payload hash
        let payload_hash = if request.body().is_empty() {
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855".to_string()
        } else {
            let mut hasher = Sha256::new();
            hasher.update(request.body());
            hex::encode(hasher.finalize())
        };

        let signing_settings = SigningSettings::default();

        // Create Credentials and Identity
        let credentials = Credentials::new(access_key, secret_key, None, None, "ruskview");
        let identity = Identity::new(credentials, None);

        // Construct v4 params
        let v4_params = v4::SigningParams::builder()
            .identity(&identity)
            .region(region)
            .name("es")
            .time(SystemTime::now())
            .settings(signing_settings)
            .build()?;

        let signing_params = SigningParams::V4(v4_params);

        // Prepare headers
        let mut headers_vec = Vec::new();
        for (k, v) in request.headers() {
            if let Ok(v_str) = v.to_str() {
                headers_vec.push((k.as_str(), v_str));
            }
        }

        // Construct SignableRequest
        let signable_request = SignableRequest::new(
            request.method().as_str(),
            request.uri().to_string(),
            headers_vec.into_iter(),
            SignableBody::Precomputed(payload_hash),
        )
        .map_err(|e| anyhow::anyhow!(e))?;

        let (signing_instructions, _signature) =
            sign(signable_request, &signing_params)?.into_parts();

        // Apply instructions to the request
        signing_instructions.apply_to_request_http1x(request);

        Ok(())
    }
}
