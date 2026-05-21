const API = "https://api.github.com";

export type GhOpts = {
  token: string;
  owner: string;
  repo: string;
};

async function gh<T>(opts: GhOpts, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status} ${path}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export async function getFile(
  opts: GhOpts,
  path: string,
  ref = "main",
): Promise<{ content: string; sha: string }> {
  const data = await gh<{ content: string; encoding: string; sha: string }>(
    opts,
    `/repos/${opts.owner}/${opts.repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`,
  );
  if (data.encoding !== "base64") throw new Error(`unexpected encoding: ${data.encoding}`);
  return {
    content: Buffer.from(data.content, "base64").toString("utf-8"),
    sha: data.sha,
  };
}

export async function getMainSha(opts: GhOpts): Promise<string> {
  const data = await gh<{ object: { sha: string } }>(
    opts,
    `/repos/${opts.owner}/${opts.repo}/git/refs/heads/main`,
  );
  return data.object.sha;
}

export async function createBranch(opts: GhOpts, branch: string, fromSha: string): Promise<void> {
  await gh(opts, `/repos/${opts.owner}/${opts.repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: fromSha }),
  });
}

export async function updateFile(
  opts: GhOpts,
  args: { path: string; content: string; sha: string; branch: string; message: string },
): Promise<{ commit: { sha: string } }> {
  return gh(opts, `/repos/${opts.owner}/${opts.repo}/contents/${encodeURIComponent(args.path)}`, {
    method: "PUT",
    body: JSON.stringify({
      message: args.message,
      content: Buffer.from(args.content, "utf-8").toString("base64"),
      sha: args.sha,
      branch: args.branch,
    }),
  });
}

export type PullRequest = { number: number; html_url: string; head: { sha: string } };

export async function createPullRequest(
  opts: GhOpts,
  args: { title: string; body: string; head: string; base?: string; draft?: boolean },
): Promise<PullRequest> {
  return gh(opts, `/repos/${opts.owner}/${opts.repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: args.title,
      body: args.body,
      head: args.head,
      base: args.base ?? "main",
      draft: args.draft ?? false,
    }),
  });
}

export async function mergePullRequest(
  opts: GhOpts,
  pull: number,
  method: "merge" | "squash" | "rebase" = "squash",
): Promise<{ merged: boolean; sha: string }> {
  return gh(opts, `/repos/${opts.owner}/${opts.repo}/pulls/${pull}/merge`, {
    method: "PUT",
    body: JSON.stringify({ merge_method: method }),
  });
}

export async function getCombinedStatus(
  opts: GhOpts,
  ref: string,
): Promise<{ state: "success" | "pending" | "failure"; statuses: Array<{ context: string; state: string }> }> {
  return gh(opts, `/repos/${opts.owner}/${opts.repo}/commits/${ref}/status`);
}

export async function listCheckRuns(
  opts: GhOpts,
  ref: string,
): Promise<{ check_runs: Array<{ name: string; status: string; conclusion: string | null }> }> {
  return gh(opts, `/repos/${opts.owner}/${opts.repo}/commits/${ref}/check-runs`);
}
