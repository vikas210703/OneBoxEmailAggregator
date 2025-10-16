import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { EventEmitter } from 'events';
import { Email, EmailCategory } from '../types/email';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { EmailAccountConfig } from '../config/config';

export class ImapService extends EventEmitter {
  private imap: Imap;
  private account: EmailAccountConfig;
  private reconnectTimer?: NodeJS.Timeout;
  private isConnected: boolean = false;
  private currentBox?: Imap.Box;

  constructor(account: EmailAccountConfig) {
    super();
    this.account = account;
    this.imap = this.createImapConnection();
  }

  private createImapConnection(): Imap {
    return new Imap({
      user: this.account.email,
      password: this.account.password,
      host: this.account.host,
      port: this.account.port,
      tls: this.account.tls,
      tlsOptions: { rejectUnauthorized: false },
      keepalive: {
        interval: 10000,
        idleInterval: 300000,
        forceNoop: true
      }
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.isConnected = true;
        logger.info(`IMAP connected for ${this.account.email}`);
        this.setupEventHandlers();
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        logger.error(`IMAP connection error for ${this.account.email}:`, err);
        this.isConnected = false;
        reject(err);
      });

      this.imap.once('end', () => {
        logger.info(`IMAP connection ended for ${this.account.email}`);
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.imap.connect();
    });
  }

  private setupEventHandlers(): void {
    this.imap.on('mail', (numNewMsgs: number) => {
      logger.info(`${numNewMsgs} new email(s) received in ${this.account.email}`);
      this.fetchNewEmails();
    });

    this.imap.on('update', (seqno: number, info: any) => {
      logger.info(`Email updated: ${seqno} in ${this.account.email}`);
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      logger.info(`Attempting to reconnect ${this.account.email}...`);
      this.imap = this.createImapConnection();
      this.connect().catch(err => {
        logger.error(`Reconnection failed for ${this.account.email}:`, err);
      });
    }, 5000);
  }

  async openInbox(boxName: string = 'INBOX'): Promise<Imap.Box> {
    return new Promise((resolve, reject) => {
      this.imap.openBox(boxName, false, (err, box) => {
        if (err) {
          logger.error(`Error opening box ${boxName} for ${this.account.email}:`, err);
          reject(err);
        } else {
          this.currentBox = box;
          logger.info(`Opened box ${boxName} for ${this.account.email}`);
          resolve(box);
        }
      });
    });
  }

  async fetchRecentEmails(days: number = 30): Promise<Email[]> {
    const emails: Email[] = [];
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return new Promise((resolve, reject) => {
      this.imap.search(['ALL', ['SINCE', sinceDate]], (err, results) => {
        if (err) {
          logger.error(`Error searching emails for ${this.account.email}:`, err);
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          logger.info(`No emails found for ${this.account.email}`);
          resolve(emails);
          return;
        }

        logger.info(`Found ${results.length} emails for ${this.account.email}`);

        const fetch = this.imap.fetch(results, {
          bodies: '',
          struct: true,
          markSeen: false
        });

        fetch.on('message', (msg, seqno) => {
          let buffer = '';

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(buffer);
              const email = this.parseEmailToModel(parsed, this.currentBox?.name || 'INBOX');
              emails.push(email);
            } catch (error) {
              logger.error(`Error parsing email ${seqno}:`, error);
            }
          });
        });

        fetch.once('error', (fetchErr) => {
          logger.error(`Fetch error for ${this.account.email}:`, fetchErr);
          reject(fetchErr);
        });

        fetch.once('end', () => {
          logger.info(`Fetched ${emails.length} emails for ${this.account.email}`);
          resolve(emails);
        });
      });
    });
  }

  private async fetchNewEmails(): Promise<void> {
    try {
      const emails = await this.fetchRecentEmails(1); // Fetch last day's emails
      if (emails.length > 0) {
        this.emit('newEmails', emails);
      }
    } catch (error) {
      logger.error(`Error fetching new emails for ${this.account.email}:`, error);
    }
  }

  async startIdleMode(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('IMAP not connected');
    }

    try {
      // Check if idle function exists
      if (typeof (this.imap as any).idle === 'function') {
        this.imap.on('update', () => {
          // Re-enter IDLE mode after update
          if (this.isConnected && typeof (this.imap as any).idle === 'function') {
            (this.imap as any).idle();
          }
        });

        // Start IDLE mode
        (this.imap as any).idle();
        logger.info(`IDLE mode started for ${this.account.email}`);
      } else {
        logger.warn(`IDLE mode not available for ${this.account.email}, using polling fallback`);
        // Fallback: poll for new emails every 30 seconds
        setInterval(() => {
          if (this.isConnected) {
            this.imap.emit('mail', 1);
          }
        }, 30000);
      }
    } catch (error) {
      logger.error(`Error starting IDLE mode for ${this.account.email}:`, error);
      throw error;
    }
  }

  private parseEmailToModel(parsed: ParsedMail, folder: string): Email {
    // Handle from address
    const fromAddr = parsed.from as any;
    const fromValue = fromAddr?.value || [];
    const fromArray = Array.isArray(fromValue) ? fromValue : [fromValue];
    
    // Handle to addresses
    const toAddr = parsed.to as any;
    const toValue = toAddr?.value || [];
    const toArray = Array.isArray(toValue) ? toValue : [toValue];
    
    const email: Email = {
      id: uuidv4(),
      messageId: parsed.messageId || uuidv4(),
      account: this.account.email,
      folder: folder,
      from: {
        name: fromArray[0]?.name,
        address: fromArray[0]?.address || ''
      },
      to: toArray.map((addr: any) => ({
        name: addr.name,
        address: addr.address || ''
      })),
      subject: parsed.subject || '(No Subject)',
      body: parsed.text || '',
      bodyHtml: parsed.html || undefined,
      date: parsed.date || new Date(),
      category: EmailCategory.UNCATEGORIZED,
      read: false,
      attachments: (parsed.attachments || []).map(att => ({
        filename: att.filename || 'unknown',
        contentType: att.contentType,
        size: att.size
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return email;
  }

  async getBoxes(): Promise<Imap.MailBoxes> {
    return new Promise((resolve, reject) => {
      this.imap.getBoxes((err, boxes) => {
        if (err) {
          reject(err);
        } else {
          resolve(boxes);
        }
      });
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.isConnected) {
      this.imap.end();
    }
  }

  getAccountEmail(): string {
    return this.account.email;
  }
}
