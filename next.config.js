const pkg = require('./package.json')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: function (config, options) {
    config.experiments = { 
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
  publicRuntimeConfig: {
    ringsNodeVersion: pkg.dependencies['@ringsnetwork/rings-node']
  }
}

module.exports = nextConfig
