/**
 * Webhook Manager
 * Sistema de webhooks para notificações de eventos blockchain
 */

import axios from 'axios';
import crypto from 'crypto';
import { EventEmitter } from 'eventemitter3';
import { logger } from '../utils/logger';
import { Network, WebhookConfig, WebhookEvent } from '../types';
import { WEBHOOK_EVENTS } from '../utils/constants';

interface WebhookRegistration extends WebhookConfig {
  id: string;
  createdAt: string;
  lastTriggered?: string;
  failureCount: number;
}

export class WebhookManager extends EventEmitter {
  private webhooks: Map<string, WebhookRegistration>;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    super();
    this.webhooks = new Map();
  }

  /**
   * Registra um novo webhook
   */
  register(config: WebhookConfig): string {
    const id = crypto.randomUUID();

    const registration: WebhookRegistration = {
      ...config,
      id,
      createdAt: new Date().toISOString(),
      failureCount: 0,
    };

    this.webhooks.set(id, registration);

    logger.info(`Webhook registered: ${id} for events: ${config.events.join(', ')}`);

    return id;
  }

  /**
   * Remove um webhook
   */
  unregister(id: string): boolean {
    const result = this.webhooks.delete(id);

    if (result) {
      logger.info(`Webhook unregistered: ${id}`);
    }

    return result;
  }

  /**
   * Lista todos os webhooks
   */
  list(): WebhookRegistration[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Obtém um webhook por ID
   */
  get(id: string): WebhookRegistration | undefined {
    return this.webhooks.get(id);
  }

  /**
   * Emite um evento para todos os webhooks registrados
   */
  async emit(eventName: string, data: any, network: Network = 'testnet'): Promise<void> {
    const event: WebhookEvent = {
      event: eventName,
      data,
      timestamp: new Date().toISOString(),
      network,
    };

    // Encontrar webhooks que escutam este evento
    const matchingWebhooks = Array.from(this.webhooks.values()).filter((webhook) =>
      webhook.events.includes(eventName) || webhook.events.includes('*')
    );

    if (matchingWebhooks.length === 0) {
      logger.debug(`No webhooks registered for event: ${eventName}`);
      return;
    }

    logger.debug(`Emitting event ${eventName} to ${matchingWebhooks.length} webhooks`);

    // Enviar para cada webhook em paralelo
    await Promise.allSettled(
      matchingWebhooks.map((webhook) => this.sendWebhook(webhook, event))
    );
  }

  /**
   * Envia um evento para um webhook específico
   */
  private async sendWebhook(webhook: WebhookRegistration, event: WebhookEvent): Promise<void> {
    const payload = {
      ...event,
      webhookId: webhook.id,
    };

    // Gerar assinatura se secret estiver definido
    let signature: string | undefined;
    if (webhook.secret) {
      signature = this.generateSignature(JSON.stringify(payload), webhook.secret);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (signature) {
      headers['X-Webhook-Signature'] = signature;
    }

    let attempt = 0;
    let success = false;

    while (attempt < this.retryAttempts && !success) {
      try {
        await axios.post(webhook.url, payload, { headers, timeout: 10000 });

        success = true;
        webhook.lastTriggered = new Date().toISOString();
        webhook.failureCount = 0;

        logger.debug(`Webhook ${webhook.id} delivered: ${event.event}`);
      } catch (error: any) {
        attempt++;

        if (attempt >= this.retryAttempts) {
          webhook.failureCount++;
          logger.error(`Webhook ${webhook.id} failed after ${this.retryAttempts} attempts: ${error.message}`);

          // Desativar webhook após muitas falhas
          if (webhook.failureCount >= 10) {
            logger.warn(`Webhook ${webhook.id} disabled due to excessive failures`);
            this.webhooks.delete(webhook.id);
          }
        } else {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
  }

  /**
   * Gera assinatura HMAC para payload
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verifica assinatura de webhook
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Helper para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Limpa todos os webhooks
   */
  clear(): void {
    this.webhooks.clear();
    logger.info('All webhooks cleared');
  }

  /**
   * Obtém estatísticas dos webhooks
   */
  getStats(): {
    total: number;
    active: number;
    failed: number;
  } {
    const webhooks = Array.from(this.webhooks.values());
    return {
      total: webhooks.length,
      active: webhooks.filter((w) => w.failureCount < 10).length,
      failed: webhooks.filter((w) => w.failureCount >= 10).length,
    };
  }
}

// Singleton instance
export const webhookManager = new WebhookManager();

// Re-export events
export { WEBHOOK_EVENTS };
