import { IncomingWebhook } from '@slack/webhook';
import axios from 'axios';
import { config } from '../config/config';
import { Email } from '../types/email';
import { logger } from '../utils/logger';

export class NotificationService {
  private slackWebhook?: IncomingWebhook;

  constructor() {
    if (config.slack.webhookUrl) {
      this.slackWebhook = new IncomingWebhook(config.slack.webhookUrl);
    }
  }

  async sendSlackNotification(email: Email): Promise<void> {
    if (!this.slackWebhook) {
      logger.warn('Slack webhook not configured');
      return;
    }

    try {
      await this.slackWebhook.send({
        text: '🎯 New Interested Email Received!',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 New Interested Email',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:*\n${email.from.name || email.from.address}`
              },
              {
                type: 'mrkdwn',
                text: `*Account:*\n${email.account}`
              },
              {
                type: 'mrkdwn',
                text: `*Subject:*\n${email.subject}`
              },
              {
                type: 'mrkdwn',
                text: `*Date:*\n${email.date.toLocaleString()}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Preview:*\n${email.body.substring(0, 200)}${email.body.length > 200 ? '...' : ''}`
            }
          },
          {
            type: 'divider'
          }
        ]
      });

      logger.info(`Slack notification sent for email: ${email.id}`);
    } catch (error) {
      logger.error('Error sending Slack notification:', error);
    }
  }

  async triggerWebhook(email: Email): Promise<void> {
    if (!config.webhook.externalUrl) {
      logger.warn('External webhook URL not configured');
      return;
    }

    try {
      const payload = {
        event: 'email.interested',
        timestamp: new Date().toISOString(),
        email: {
          id: email.id,
          from: email.from,
          to: email.to,
          subject: email.subject,
          body: email.body,
          date: email.date,
          account: email.account,
          category: email.category
        }
      };

      await axios.post(config.webhook.externalUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      logger.info(`Webhook triggered for email: ${email.id}`);
    } catch (error) {
      logger.error('Error triggering webhook:', error);
    }
  }

  async notifyInterestedEmail(email: Email): Promise<void> {
    await Promise.all([
      this.sendSlackNotification(email),
      this.triggerWebhook(email)
    ]);
  }
}
