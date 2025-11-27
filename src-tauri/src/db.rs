use crate::models::connection::ConnectionProfile;
use magic_crypt::{MagicCryptTrait, new_magic_crypt};
use rusqlite::{Connection, Result, params};
use std::path::Path;

const DB_NAME: &str = "ruskview.db";
const ENCRYPTION_KEY: &str = "ruskview-local-secret-key-2024";

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn init<P: AsRef<Path>>(path: P) -> Result<Self> {
        let db_path = path.as_ref().join(DB_NAME);
        let conn = Connection::open(db_path)?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                auth_type TEXT NOT NULL,
                username TEXT,
                password TEXT,
                region TEXT,
                access_key TEXT,
                secret_key TEXT
            )",
            [],
        )?;

        Ok(Database { conn })
    }

    pub fn save_profile(&self, profile: &ConnectionProfile) -> Result<()> {
        let mc = new_magic_crypt!(ENCRYPTION_KEY, 256);

        let encrypted_password = profile
            .password
            .as_ref()
            .map(|p| mc.encrypt_str_to_base64(p));
        let encrypted_secret_key = profile
            .secret_key
            .as_ref()
            .map(|k| mc.encrypt_str_to_base64(k));

        self.conn.execute(
            "INSERT OR REPLACE INTO profiles (
                id, name, url, auth_type, username, password, region, access_key, secret_key
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                profile.id,
                profile.name,
                profile.url,
                profile.auth_type,
                profile.username,
                encrypted_password,
                profile.region,
                profile.access_key,
                encrypted_secret_key
            ],
        )?;
        Ok(())
    }

    pub fn get_profiles(&self) -> Result<Vec<ConnectionProfile>> {
        let mc = new_magic_crypt!(ENCRYPTION_KEY, 256);
        let mut stmt = self.conn.prepare("SELECT id, name, url, auth_type, username, password, region, access_key, secret_key FROM profiles")?;

        let profile_iter = stmt.query_map([], |row| {
            let password: Option<String> = row.get(5)?;
            let secret_key: Option<String> = row.get(8)?;

            let decrypted_password = password.and_then(|p| mc.decrypt_base64_to_string(&p).ok());
            let decrypted_secret_key =
                secret_key.and_then(|k| mc.decrypt_base64_to_string(&k).ok());

            Ok(ConnectionProfile {
                id: row.get(0)?,
                name: row.get(1)?,
                url: row.get(2)?,
                auth_type: row.get(3)?,
                username: row.get(4)?,
                password: decrypted_password,
                region: row.get(6)?,
                access_key: row.get(7)?,
                secret_key: decrypted_secret_key,
            })
        })?;

        let mut profiles = Vec::new();
        for profile in profile_iter {
            profiles.push(profile?);
        }
        Ok(profiles)
    }

    pub fn delete_profile(&self, id: &str) -> Result<()> {
        self.conn
            .execute("DELETE FROM profiles WHERE id = ?1", params![id])?;
        Ok(())
    }
}
