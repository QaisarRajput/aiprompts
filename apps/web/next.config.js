const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repository = process.env.GITHUB_REPOSITORY || "";
const repositoryName = repository.split("/")[1] || "";
const basePath = isGithubActions && repositoryName ? `/${repositoryName}` : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true
  },
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

export default nextConfig;
