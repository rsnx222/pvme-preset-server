const path = require('path');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Load .env for local dev only
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

const secretClient = new SecretManagerServiceClient();
const secretCache = {};

/**
 * Get a secret value, using .env in dev, Secret Manager in prod.
 */
async function getSecret(key) {
  if (process.env.NODE_ENV === 'development') {
    return process.env[key];
  }

  if (secretCache[key]) return secretCache[key];

  const projectId =
    process.env.GCP_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    await secretClient.getProjectId();

  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${projectId}/secrets/${key}/versions/latest`,
  });

  const value = version.payload.data.toString();
  secretCache[key] = value;
  return value;
}

module.exports = { getSecret };
