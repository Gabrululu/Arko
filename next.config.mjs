/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@uiw/react-md-editor", "@uiw/react-codemirror"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // wagmi v3 ships all connectors in the barrel export, including ones that
    // require optional peer deps. Alias them to false so webpack skips them —
    // we only use the `injected()` connector.
    config.resolve.alias = {
      ...config.resolve.alias,
      "porto/internal": false,
      "@coinbase/wallet-sdk": false,
      "@metamask/sdk": false,
      "@safe-global/safe-apps-sdk": false,
      "@safe-global/safe-apps-provider": false,
      "@base-org/account": false,
      "@walletconnect/ethereum-provider": false,
    };

    return config;
  },
};

export default nextConfig;
