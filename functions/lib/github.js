// functions/lib/github.js

const path = require('path');
// Load environment variables from .env for local development
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { v4: uuidv4 } = require('uuid');

const {
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH = 'main',
  GITHUB_TOKEN
} = process.env;

/**
 * Dynamically import the Octokit client (ESM) at runtime
 */
async function getOctokit() {
  if (!GITHUB_TOKEN) {
    throw new Error('Missing GITHUB_TOKEN');
  }
  const { Octokit } = await import('@octokit/rest');
  return new Octokit({ auth: GITHUB_TOKEN });
}


/**
async function getOctokit() {
  const { Octokit } = await import('@octokit/rest');
  return new Octokit({ auth: GITHUB_TOKEN });
}

/**
 * Returns a new or existing preset ID.
 */
function ensurePresetId(maybeId) {
  return maybeId || uuidv4();
}

/**
 * Read the file SHA, or return undefined if 404.
 */
async function getFileSha(path) {
  const octokit = await getOctokit();
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path,
      ref: GITHUB_BRANCH,
    });
    return data.sha;
  } catch (err) {
    if (err.status === 404) return undefined;
    throw err;
  }
}

/**
 * Read the file content as a UTF-8 string, returning it or throwing if not found.
 */
async function getFileContent(path) {
  const octokit = await getOctokit();
  const { data } = await octokit.repos.getContent({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path,
    ref: GITHUB_BRANCH,
  });
  // GitHub returns base64-encoded content
  const buf = Buffer.from(data.content, 'base64');
  return buf.toString('utf8');
}

/**
 * Create or update a file at `path` with JSON `body`.
 * Returns the final preset ID.
 */
async function upsertJsonFile(path, body, presetId) {
  const octokit = await getOctokit();
  const contentBase64 = Buffer.from(JSON.stringify(body, null, 2)).toString('base64');
  const sha = await getFileSha(path);

  await octokit.repos.createOrUpdateFileContents({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path,
    message: sha
      ? `Update preset ${presetId}`
      : `Create preset ${presetId}`,
    content: contentBase64,
    sha,
    branch: GITHUB_BRANCH,
  });

  return presetId;
}

module.exports = {
  ensurePresetId,
  getFileSha,
  getFileContent,
  upsertJsonFile,
  getOctokit,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BRANCH,
  uuidv4
};
