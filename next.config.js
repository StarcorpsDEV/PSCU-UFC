/** @type {import('next').NextConfig} */
require('dotenv').config();

module.exports = {
  env: {
    REACT_APP_PRIVATE_KEY: process.env.REACT_APP_PRIVATE_KEY,
    REACT_APP_ALCHEMY_API_URL: process.env.REACT_APP_ALCHEMY_API_URL,
    REACT_APP_WALLET_ADDRESS: process.env.REACT_APP_WALLET_ADDRESS,
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    REACT_APP_DEFAUT_DAO_MEMBERS: process.env.REACT_APP_DEFAUT_DAO_MEMBERS,
  },
  reactStrictMode: true,
  swcMinify: false,
  productionBrowserSourceMaps: true,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  images: {
    domains: ['media.giphy.com'],
  },
};
