import dotenv from 'dotenv';

dotenv.config();

export interface EmailAccountConfig {
  email: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    index: 'emails'
  },
  
  emailAccounts: [
    {
      email: process.env.EMAIL_1_ADDRESS || '',
      password: process.env.EMAIL_1_PASSWORD || '',
      host: process.env.EMAIL_1_IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.EMAIL_1_IMAP_PORT || '993'),
      tls: true
    },
    {
      email: process.env.EMAIL_2_ADDRESS || '',
      password: process.env.EMAIL_2_PASSWORD || '',
      host: process.env.EMAIL_2_IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.EMAIL_2_IMAP_PORT || '993'),
      tls: true
    }
  ].filter(account => account.email && account.password),
  
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    openaiKey: process.env.OPENAI_API_KEY || '',
    geminiKey: process.env.GEMINI_API_KEY || ''
  },
  
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || ''
  },
  
  webhook: {
    externalUrl: process.env.EXTERNAL_WEBHOOK_URL || ''
  },
  
  rag: {
    productName: process.env.PRODUCT_NAME || 'Email Assistant',
    outreachAgenda: process.env.OUTREACH_AGENDA || ''
  }
};
