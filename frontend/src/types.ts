export interface Email {
  id: string;
  messageId: string;
  account: string;
  folder: string;
  from: {
    name?: string;
    address: string;
  };
  to: Array<{
    name?: string;
    address: string;
  }>;
  subject: string;
  body: string;
  bodyHtml?: string;
  date: string;
  category?: EmailCategory;
  read: boolean;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export enum EmailCategory {
  INTERESTED = 'Interested',
  MEETING_BOOKED = 'Meeting Booked',
  NOT_INTERESTED = 'Not Interested',
  SPAM = 'Spam',
  OUT_OF_OFFICE = 'Out of Office',
  UNCATEGORIZED = 'Uncategorized'
}

export interface SuggestedReply {
  emailId: string;
  suggestion: string;
  confidence: number;
  context: string[];
}
