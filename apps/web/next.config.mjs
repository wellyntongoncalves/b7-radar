/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the workspace TS packages directly (no pre-build step needed).
  transpilePackages: ['@b7/brand', '@b7/calculations', '@b7/shared-types'],
  webpack(config) {
    // The @b7/* packages use explicit ".js" ESM import specifiers that resolve
    // to ".ts" source files. Teach webpack to follow them.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
