/**
 * Assigns a stable Vercel alias to the latest ready deployment for a branch/target.
 */

const requiredEnv = [
  'VERCEL_TOKEN',
  'VERCEL_PROJECT_ID',
  'VERCEL_BRANCH_NAME',
  'VERCEL_TARGET',
  'VERCEL_ALIAS_DOMAIN',
];

for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    console.error(`Missing required environment variable: ${envName}`);
    process.exit(1);
  }
}

const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;
const teamId = process.env.VERCEL_ORG_ID;
const branch = process.env.VERCEL_BRANCH_NAME;
const target = process.env.VERCEL_TARGET;
const alias = process.env.VERCEL_ALIAS_DOMAIN;
const commitSha = process.env.VERCEL_COMMIT_SHA;
const maxAttempts = Number.parseInt(process.env.VERCEL_ALIAS_MAX_ATTEMPTS ?? '40', 10);
const pollMs = Number.parseInt(process.env.VERCEL_ALIAS_POLL_MS ?? '15000', 10);

function buildUrl(path, query = {}) {
  const url = new URL(path, 'https://api.vercel.com');

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

async function vercelFetch(path, init = {}, query = {}) {
  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const responseText = await response.text();
  let payload = {};

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { message: responseText };
    }
  }

  if (!response.ok) {
    const message = payload?.error?.message ?? payload?.message ?? response.statusText;
    throw new Error(`Vercel API ${response.status} ${response.statusText}: ${message}`);
  }

  return payload;
}

function compareCreatedDescending(left, right) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function matchesCommit(deployment) {
  if (!commitSha) {
    return true;
  }

  const meta = deployment.meta ?? {};
  const shaCandidates = Object.entries(meta)
    .filter(([key]) => /commit.*sha|github.*sha/i.test(key))
    .map(([, value]) => value);

  return shaCandidates.includes(commitSha);
}

function pickDeployment(payload) {
  const deployments = Array.isArray(payload.deployments) ? payload.deployments : [];
  const readyDeployments = deployments
    .filter((deployment) => deployment.readyState === 'READY')
    .sort(compareCreatedDescending);

  const preferredMatch = readyDeployments.find(matchesCommit);
  return preferredMatch ?? readyDeployments[0] ?? null;
}

async function findDeployment() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const payload = await vercelFetch('/v6/deployments', {}, {
      projectId,
      teamId,
      branch,
      target,
      state: 'READY',
      limit: '20',
    });

    const deployment = pickDeployment(payload);
    if (deployment) {
      return deployment;
    }

    console.log(`No ready deployment found for ${branch}/${target} yet. Attempt ${attempt}/${maxAttempts}. Waiting ${pollMs}ms...`);
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  throw new Error(`No ready deployment found for branch ${branch} and target ${target} after ${maxAttempts} attempts.`);
}

async function assignAlias(deploymentId) {
  return vercelFetch(
    `/v2/deployments/${deploymentId}/aliases`,
    {
      method: 'POST',
      body: JSON.stringify({ alias }),
    },
    { teamId },
  );
}

async function main() {
  const deployment = await findDeployment();
  console.log(`Using deployment ${deployment.uid} (${deployment.url}) for branch ${branch} / target ${target}.`);

  const aliasResponse = await assignAlias(deployment.uid);
  const assignedAlias = aliasResponse.alias?.alias ?? alias;
  console.log(`Assigned alias: https://${assignedAlias}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});