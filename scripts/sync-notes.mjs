import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import matter from "gray-matter";
import { glob } from "glob";
import { rimraf } from "rimraf";

const execFileAsync = promisify(execFile);

const rootDir = process.cwd();
const targetNotesDir = path.join(rootDir, "src", "content", "notes", "generated");

const repo = process.env.NOTES_REPO ?? "LiuJrX/Notebook";
const branch = process.env.NOTES_BRANCH ?? "main";
const ignoredDirs = (process.env.NOTES_IGNORE_DIRS ??
  ".git,.obsidian,node_modules,Daily,Templates,Private")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*?\]\((?<path>[^)\s]+)(?:\s+"[^"]*")?\)/g;
const URL_SCHEME_PATTERN = /^(?:[a-z]+:)?\/\//i;

async function ensureCleanDirs() {
  await rimraf(targetNotesDir);
  await fs.mkdir(targetNotesDir, { recursive: true });
}

async function copyFileSafe(from, to) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

async function stageLocalFixtures() {
  await ensureCleanDirs();
  console.warn("[sync-notes] Missing NOTES_REPO. Skipping remote sync and keeping local sample notes only.");
}

async function pullRepo(tempDir) {
  const token = process.env.GITHUB_TOKEN;
  if (!repo) {
    await stageLocalFixtures();
    return null;
  }

  const cloneUrl = `https://github.com/${repo}.git`;
  const gitEnv = {
    ...process.env,
    GIT_LFS_SKIP_SMUDGE: "1"
  };
  const cloneArgs = ["clone", "--depth", "1", "--filter=blob:none", "--sparse", "--branch", branch];

  if (token) {
    const basicAuth = Buffer.from(`x-access-token:${token}`).toString("base64");
    cloneArgs.push("-c", `http.https://github.com/.extraheader=AUTHORIZATION: basic ${basicAuth}`);
  }

  cloneArgs.push(cloneUrl, tempDir);

  try {
    await execFileAsync("git", cloneArgs, {
      cwd: rootDir,
      env: gitEnv
    });
    await execFileAsync(
      "git",
      ["sparse-checkout", "set", "--no-cone", "**/*.md"],
      {
        cwd: tempDir,
        env: gitEnv
      }
    );
    return tempDir;
  } catch {
    throw new Error(
      token
        ? `Unable to clone ${repo}. Please check NOTES_REPO / NOTES_BRANCH / GITHUB_TOKEN.`
        : `Unable to clone ${repo}. If the repository is private, set GITHUB_TOKEN before running sync.`
    );
  }
}

function getIgnoreGlobs() {
  return ignoredDirs.flatMap((dir) => [`**/${dir}/**`, `**/${dir}`]);
}

function getLocalImageReferences(markdown) {
  const matches = markdown.matchAll(MARKDOWN_IMAGE_PATTERN);
  return [...matches]
    .map((match) => match.groups?.path?.trim())
    .filter(Boolean)
    .filter((assetPath) => !assetPath.startsWith("#"))
    .filter((assetPath) => !URL_SCHEME_PATTERN.test(assetPath))
    .filter((assetPath) => !assetPath.startsWith("/"))
    .filter((assetPath) => !assetPath.startsWith("data:"));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyReferencedAssets(raw, repoDir, relativeNoteFile) {
  const noteDir = path.dirname(relativeNoteFile);
  const localAssets = getLocalImageReferences(raw);

  for (const assetRef of localAssets) {
    const resolvedAsset = path.normalize(path.join(repoDir, noteDir, assetRef));
    if (!resolvedAsset.startsWith(repoDir)) {
      continue;
    }

    if (!(await fileExists(resolvedAsset))) {
      try {
        await execFileAsync("git", ["checkout", "HEAD", "--", path.relative(repoDir, resolvedAsset)], {
          cwd: repoDir,
          env: {
            ...process.env,
            GIT_LFS_SKIP_SMUDGE: "1"
          }
        });
      } catch {
        // Fall through to the existence check below so we can emit one warning path.
      }
    }

    if (!(await fileExists(resolvedAsset))) {
      console.warn(`[sync-notes] Skipping missing asset reference "${assetRef}" in "${relativeNoteFile}".`);
      continue;
    }

    const relativeAssetPath = path.relative(repoDir, resolvedAsset);
    await copyFileSafe(
      resolvedAsset,
      path.join(targetNotesDir, relativeAssetPath)
    );
  }
}

async function syncPublishedNotes(repoDir) {
  await ensureCleanDirs();
  const markdownFiles = await glob("**/*.md", {
    cwd: repoDir,
    nodir: true,
    ignore: getIgnoreGlobs()
  });

  for (const relativeFile of markdownFiles) {
    const fullPath = path.join(repoDir, relativeFile);
    const raw = await fs.readFile(fullPath, "utf8");
    const parsed = matter(raw);
    if (parsed.data.publish !== true) {
      continue;
    }

    const missing = ["title", "pubDate", "updatedDate", "summary", "tags"].filter(
      (field) => parsed.data[field] === undefined
    );
    if (missing.length > 0) {
      throw new Error(
        `Published note "${relativeFile}" is missing required fields: ${missing.join(", ")}`
      );
    }

    const targetFile = path.join(targetNotesDir, relativeFile);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, raw, "utf8");
    await copyReferencedAssets(raw, repoDir, relativeFile);
  }
}

async function main() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "personal-site-notes-"));
  try {
    const repoDir = await pullRepo(tempDir);
    if (repoDir) {
      await syncPublishedNotes(repoDir);
      console.log("[sync-notes] Synced published notes from private repository.");
    }
  } finally {
    await rimraf(tempDir);
  }
}

main().catch((error) => {
  console.error(`[sync-notes] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
