// functions/lib/github.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { v4: uuidv4 } = require('uuid');
const { getSecret } = require('./secrets');

/**
 * Retrieve secrets either from env (dev) or Secret Manager (prod)
 */
async function getGithubConfig() {
  const [GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH] = await Promise.all([
    process.env.GITHUB_TOKEN || getSecret('github-token'),
    process.env.GITHUB_OWNER || getSecret('github-owner'),
    process.env.GITHUB_REPO || getSecret('github-repo'),
    process.env.GITHUB_BRANCH || getSecret('github-branch')
  ]);

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !GITHUB_BRANCH) {
    throw new Error('Missing one or more required GitHub secrets');
  }

  return { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH };
}

/**
 * Dynamically import the Octokit client (ESM) at runtime
 */
async function getOctokit() {
  const { GITHUB_TOKEN } = await getGithubConfig();
  const { Octokit } = await import('@octokit/rest');
  return new Octokit({ auth: GITHUB_TOKEN });
}

function ensurePresetId(maybeId) {
  return maybeId || uuidv4();
}

async function getFileSha(path) {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = await getGithubConfig();
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

async function getFileContent(path) {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = await getGithubConfig();
  const octokit = await getOctokit();
  const { data } = await octokit.repos.getContent({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    path,
    ref: GITHUB_BRANCH,
  });
  const buf = Buffer.from(data.content, 'base64');
  return buf.toString('utf8');
}

async function upsertJsonFile(path, body, presetId) {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = await getGithubConfig();
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
  getGithubConfig,
  uuidv4,
};