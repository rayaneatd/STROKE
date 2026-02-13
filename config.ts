export const Config = {
  app: {
    name: 'STROKE',
    version: '1.0.0',
    description: 'Next-generation B2B SaaS platform for AI-powered recruitment.',
  },
  api: {
    // The API key is obtained exclusively from the environment variable process.env.API_KEY
    // Do not hardcode the key here.
    geminiApiKey: process.env.API_KEY || '',
    baseUrl: 'https://api.stroke.com/v1', 
    resendApiKey: '',
  },
  upload: {
    maxAttachmentSizeMB: 200,
    allowedFileTypes: ['image/png', 'image/jpeg', 'application/pdf', 'application/msword'],
  },
  features: {
    enableMockData: true,
    enableAnalytics: true,
  }
};