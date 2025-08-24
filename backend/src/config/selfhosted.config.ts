import { config } from 'dotenv';

config();

/**
 * Self-hosted specific configuration
 * This configuration removes cloud dependencies and enables local-first features
 */
export const selfHostedConfig = {
  // Core settings
  isSelfHosted: process.env.SELF_HOSTED === 'true',
  environment: process.env.NODE_ENV || 'production',
  
  // Network configuration
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.BIND_ADDRESS || '0.0.0.0',
  
  // Database
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/kinect',
    options: {
      // Self-hosted optimizations
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    },
  },
  
  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
    dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY,
    sessionSecret: process.env.SESSION_SECRET || 'change-this-session-secret',
    enableEncryption: process.env.ENABLE_ENCRYPTION === 'true',
  },
  
  // CORS configuration for self-hosted
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://kinect.local',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
    ],
  },
  
  // Features - disabled for self-hosted
  features: {
    telemetry: process.env.ENABLE_TELEMETRY === 'true', // Default false
    analytics: process.env.ENABLE_ANALYTICS === 'true', // Default false
    errorReporting: process.env.ENABLE_ERROR_REPORTING === 'true', // Default false
    oauth: false, // Always disabled for self-hosted
    cloudSync: false, // Always disabled for self-hosted
    pushNotifications: false, // Use local notifications instead
    emailNotifications: process.env.ENABLE_EMAIL === 'true', // Local SMTP only
  },
  
  // Local notifications (replaces cloud push)
  notifications: {
    enabled: process.env.ENABLE_DESKTOP_NOTIFICATIONS !== 'false',
    checkInterval: parseInt(process.env.NOTIFICATION_CHECK_INTERVAL || '3600000', 10), // 1 hour
    defaultIntervals: process.env.DEFAULT_REMINDER_INTERVALS?.split(',').map(Number) || [30, 90, 180],
  },
  
  // Import/Export settings
  importExport: {
    maxFileSize: process.env.MAX_IMPORT_SIZE || '50MB',
    allowedFormats: process.env.ALLOWED_IMPORT_FORMATS?.split(',') || ['csv', 'vcf', 'json'],
    importPath: process.env.IMPORT_PATH || './imports',
    exportPath: process.env.EXPORT_PATH || './exports',
    enableAutoImport: process.env.ENABLE_AUTO_IMPORT === 'true',
  },
  
  // Backup settings
  backup: {
    enabled: process.env.BACKUP_ENABLED !== 'false',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    path: process.env.BACKUP_PATH || './backups',
    encryptionKey: process.env.BACKUP_GPG_RECIPIENT,
    remoteSync: process.env.BACKUP_REMOTE_PATH,
  },
  
  // User management
  users: {
    allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
    maxUsers: parseInt(process.env.MAX_USERS || '0', 10), // 0 = unlimited
    defaultRole: process.env.DEFAULT_USER_ROLE || 'user',
  },
  
  // Data retention and privacy
  privacy: {
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '365', 10),
    logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '90', 10),
    enableDataExport: true, // Always enabled for self-hosted
    enableAccountDeletion: true, // Always enabled for self-hosted
  },
  
  // Local SMTP configuration (optional)
  smtp: {
    enabled: process.env.ENABLE_EMAIL === 'true',
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
    from: process.env.SMTP_FROM || 'noreply@kinect.local',
  },
  
  // Rate limiting
  rateLimiting: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // Health checks
  healthCheck: {
    enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
    interval: process.env.HEALTH_CHECK_INTERVAL || '30s',
  },
  
  // Companion app sync (local network only)
  companionSync: {
    enabled: process.env.ENABLE_COMPANION_SYNC === 'true',
    port: parseInt(process.env.COMPANION_SYNC_PORT || '3002', 10),
    key: process.env.COMPANION_SYNC_KEY || 'generate-random-key',
  },
  
  // Development settings
  development: {
    debug: process.env.DEBUG === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    enableDevTools: process.env.NODE_ENV === 'development',
  },
};

// Validation
export function validateSelfHostedConfig(): void {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATA_ENCRYPTION_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key] || process.env[key] === 'change-this-in-production');
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing or default security settings:', missing);
    console.warn('⚠️  Run the setup script to generate secure values');
  }
  
  // Warn about insecure configurations
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG === 'true') {
    console.warn('⚠️  Debug mode is enabled in production');
  }
  
  if (selfHostedConfig.security.enableEncryption && !selfHostedConfig.security.dataEncryptionKey) {
    console.warn('⚠️  Data encryption is enabled but no encryption key is set');
  }
}

export default selfHostedConfig;