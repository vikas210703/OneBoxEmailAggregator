import axios from 'axios';
import { EmailCategory, SuggestedReply } from './types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const emailApi = {
  searchEmails: async (params: {
    query?: string;
    account?: string;
    folder?: string;
    category?: EmailCategory;
    from?: number;
    size?: number;
  }) => {
    const response = await api.get('/emails/search', { params });
    return response.data;
  },

  getAllEmails: async (params: {
    account?: string;
    folder?: string;
    category?: EmailCategory;
    from?: number;
    size?: number;
  }) => {
    const response = await api.get('/emails', { params });
    return response.data;
  },

  getEmailById: async (id: string) => {
    const response = await api.get(`/emails/${id}`);
    return response.data;
  },

  categorizeEmail: async (id: string) => {
    const response = await api.post(`/emails/${id}/categorize`);
    return response.data;
  },

  suggestReply: async (id: string): Promise<{ success: boolean; data: SuggestedReply }> => {
    const response = await api.get(`/emails/${id}/suggest-reply`);
    return response.data;
  }
};

export const knowledgeApi = {
  getKnowledgeBase: async () => {
    const response = await api.get('/knowledge');
    return response.data;
  },

  addKnowledge: async (text: string, metadata: any) => {
    const response = await api.post('/knowledge', { text, metadata });
    return response.data;
  }
};

export const healthApi = {
  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};
