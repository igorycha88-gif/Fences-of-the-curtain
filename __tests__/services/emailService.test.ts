import { generateOrderNotificationHtml, sendEmailToAllRecipients } from '@/services/email/sender';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notificationRecipient: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOrderNotificationHtml', () => {
    it('should generate HTML for fence order', () => {
      const order = {
        id: 'order123',
        clientName: 'Иван Иванов',
        phone: '+7 (900) 123-45-67',
        email: 'client@example.com',
        serviceType: 'fence',
        calculatedCost: 150000,
        createdAt: new Date('2026-04-01'),
      };

      const html = generateOrderNotificationHtml(order);

      expect(html).toContain('Новая заявка #order123');
      expect(html).toContain('Иван Иванов');
      expect(html).toContain('+7 (900) 123-45-67');
      expect(html).toContain('Забор');
      expect(html).toContain('150');
      expect(html).toContain('₽');
    });

    it('should generate HTML for canopy order', () => {
      const order = {
        id: 'order456',
        clientName: 'Петр Петров',
        phone: '+7 (900) 987-65-43',
        serviceType: 'canopy',
        calculatedCost: 200000,
        createdAt: new Date('2026-04-02'),
      };

      const html = generateOrderNotificationHtml(order);

      expect(html).toContain('Навес');
    });

    it('should generate HTML for individual calculation', () => {
      const order = {
        id: 'order789',
        clientName: 'Анна Сидорова',
        phone: '+7 (900) 111-22-33',
        serviceType: 'INDIVIDUAL_CALCULATION',
        calculatedCost: 0,
        createdAt: new Date('2026-04-03'),
      };

      const html = generateOrderNotificationHtml(order);

      expect(html).toContain('Индивидуальный расчет');
    });

    it('should escape HTML special characters', () => {
      const order = {
        id: 'order<script>alert(1)</script>',
        clientName: 'Test <b>user</b>',
        phone: '+7 (900) 123-45-67',
        serviceType: 'fence',
        calculatedCost: 100000,
        createdAt: new Date('2026-04-01'),
      };

      const html = generateOrderNotificationHtml(order);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<b>user</b>');
      expect(html).toContain('&lt;b&gt;user&lt;/b&gt;');
    });

    it('should handle missing email', () => {
      const order = {
        id: 'order1',
        clientName: 'Test',
        phone: '+7 (900) 123-45-67',
        serviceType: 'fence',
        calculatedCost: 100000,
        createdAt: new Date('2026-04-01'),
      };

      const html = generateOrderNotificationHtml(order);

      expect(html).not.toContain('<strong>Email:</strong>');
    });
  });

  describe('sendEmailToAllRecipients', () => {
    it('should send emails to all active recipients', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.findMany.mockResolvedValue([
        { id: '1', email: 'admin1@example.com', active: true },
        { id: '2', email: 'admin2@example.com', active: true },
      ]);

      await sendEmailToAllRecipients('Test Subject', '<p>Test HTML</p>');

      expect(prisma.notificationRecipient.findMany).toHaveBeenCalledWith({
        where: { active: true },
      });
    });

    it('should do nothing when no active recipients', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.findMany.mockResolvedValue([]);

      await sendEmailToAllRecipients('Test Subject', '<p>Test HTML</p>');

      expect(prisma.notificationRecipient.findMany).toHaveBeenCalledWith({
        where: { active: true },
      });
    });

    it('should handle errors gracefully', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        sendEmailToAllRecipients('Test Subject', '<p>Test HTML</p>')
      ).resolves.toBeUndefined();
    });
  });
});
