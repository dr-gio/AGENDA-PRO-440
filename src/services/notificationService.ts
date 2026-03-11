/**
 * Service for sending notifications (Email/WhatsApp)
 */

export const notificationService = {
  async sendEmail(to: string, subject: string, body: string) {
    console.log(`Sending email to ${to}: ${subject}`);
    // Integration with SendGrid, Mailgun, etc.
  },

  async sendWhatsApp(to: string, message: string) {
    console.log(`Sending WhatsApp to ${to}: ${message}`);
    // Integration with Twilio, etc.
  }
};
