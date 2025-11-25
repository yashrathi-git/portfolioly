import { env } from "@/lib/env";

const DEFAULT_DISCORD_LINK = "https://discord.gg/Vu7tfCr8zj";

export function getDiscordLink(): string {
  return env.DISCORD_LINK || DEFAULT_DISCORD_LINK;
}

export const GITHUB_REPO_URL = "https://github.com/yashrathi-git/portfolioly";
