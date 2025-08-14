/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  webpack: (config, { dev }) => { 
    // Votre configuration d'alias existante
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // Ajout du hot reloading pour le développement
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }

    return config;
  },
}

module.exports = nextConfig