// Loads apps/api/.env into process.env before any module reads configuration.
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the real environment (production, Docker).
}
