import devConfig from './dev.json';
import prodConfig from './prod.json';

// Determine environment from .env file
const env = import.meta.env.VITE_ENV;

// Select configuration based on environment
const config = env === 'prod' ? prodConfig : devConfig;

export default config;
