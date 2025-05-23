import { MailerSend, Recipient, EmailParams } from 'mailersend';

// Initialize MailerSend with API key from environment variables
const mailersend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// Default sender configuration
const DEFAULT_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || "info@domain.com";
const DEFAULT_FROM_NAME = process.env.MAILERSEND_FROM_NAME || "MealTime App";

/**
 * Generic function to send an email using MailerSend
 */
export async function sendEmail({
  to,
  toName,
  from = DEFAULT_FROM_EMAIL,
  fromName = DEFAULT_FROM_NAME,
  subject,
  html,
  text,
  cc,
  bcc,
  templateId,
  variables,
  tags,
}: {
  to: string;
  toName?: string;
  from?: string;
  fromName?: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  templateId?: string;
  variables?: Record<string, any>;
  tags?: string[];
}) {
  console.log('[MailerSend] Attempting to send email', { to, subject, from, fromName });
  // Create recipients
  const recipients = [new Recipient(to, toName || to)];
  
  // Initialize email params
  const emailParams = new EmailParams()
    .setFrom(from)
    .setFromName(fromName)
    .setRecipients(recipients)
    .setSubject(subject)
    .setReplyTo({ email: from, name: fromName });

  // Add CC recipients if provided
  if (cc && cc.length > 0) {
    emailParams.setCc(cc.map(recipient => new Recipient(recipient.email, recipient.name || recipient.email)));
  }

  // Add BCC recipients if provided
  if (bcc && bcc.length > 0) {
    emailParams.setBcc(bcc.map(recipient => new Recipient(recipient.email, recipient.name || recipient.email)));
  }

  // Set content: either HTML/text or template
  if (templateId) {
    emailParams.setTemplateId(templateId);
    if (variables) {
      emailParams.setVariables(variables);
    }
  } else {
    if (html) emailParams.setHtml(html);
    if (text) emailParams.setText(text);
  }

  // Add tags if provided
  if (tags && tags.length > 0) {
    emailParams.setTags(tags);
  }

  try {
    console.log('[MailerSend] Sending email with params:', emailParams);
    const result = await mailersend.email.send(emailParams);
    console.log('[MailerSend] Email sent successfully', { to, subject, result });
    return result;
  } catch (error) {
    console.error('[MailerSend] Failed to send email', { to, subject, error: error instanceof Error ? error.message : error });
    throw error; // Re-throw the error so calling functions can handle it
  }
}

/**
 * Sends a household invitation email using MailerSend
 */
export async function sendHouseholdInviteEmail({
  to,
  toName,
  from = DEFAULT_FROM_EMAIL,
  fromName = DEFAULT_FROM_NAME,
  subject = "You're invited to join a household!",
  inviteLink,
  householdName,
  inviterName,
}: {
  to: string;
  toName: string;
  from?: string;
  fromName?: string;
  subject?: string;
  inviteLink: string;
  householdName: string;
  inviterName: string;
}) {
  const html = `
    <p>Hello ${toName},</p>
    <p><strong>${inviterName}</strong> has invited you to join the household <strong>${householdName}</strong>.</p>
    <p><a href="${inviteLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
    <p>Or copy and paste this URL into your browser:</p>
    <p>${inviteLink}</p>
    <p>If you did not expect this invitation, you can safely ignore this email.</p>
    <p>Thanks,<br>The MealTime Team</p>
  `;

  const text = `Hello ${toName},\n\n${inviterName} has invited you to join the household "${householdName}".\n\nAccept your invitation: ${inviteLink}\n\nIf you did not expect this invitation, you can safely ignore this email.\n\nThanks,\nThe MealTime Team`;

  return sendEmail({
    to,
    toName,
    from,
    fromName,
    subject,
    html,
    text,
    tags: ['household-invitation']
  });
}

/**
 * Example: Send a password reset email
 */
export async function sendPasswordResetEmail({
  to,
  toName,
  resetLink,
}: {
  to: string;
  toName: string;
  resetLink: string;
}) {
  const subject = "Reset your password";
  const html = `
    <p>Hello ${toName},</p>
    <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
    <p><a href="${resetLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
    <p>Or copy and paste this URL into your browser:</p>
    <p>${resetLink}</p>
    <p>This link will expire in 1 hour.</p>
    <p>Thanks,<br>The MealTime Team</p>
  `;
  const text = `Hello ${toName},\n\nWe received a request to reset your password. If you didn't make this request, you can ignore this email.\n\nReset your password: ${resetLink}\n\nThis link will expire in 1 hour.\n\nThanks,\nThe MealTime Team`;

  return sendEmail({
    to,
    toName,
    subject,
    html,
    text,
    tags: ['password-reset']
  });
}

/**
 * Example: Send a notification email
 */
export async function sendNotificationEmail({
  to,
  toName,
  notificationType,
  notificationDetails,
}: {
  to: string;
  toName: string;
  notificationType: 'feeding_reminder' | 'weight_reminder' | 'household_update';
  notificationDetails: Record<string, any>;
}) {
  let subject = '';
  let html = '';
  let text = '';

  switch (notificationType) {
    case 'feeding_reminder':
      subject = "Feeding Reminder";
      html = `
        <p>Hello ${toName},</p>
        <p>This is a reminder that ${notificationDetails.catName} is due for feeding at ${notificationDetails.time}.</p>
        <p>Thanks,<br>The MealTime Team</p>
      `;
      text = `Hello ${toName},\n\nThis is a reminder that ${notificationDetails.catName} is due for feeding at ${notificationDetails.time}.\n\nThanks,\nThe MealTime Team`;
      break;
    
    case 'weight_reminder':
      subject = "Weight Tracking Reminder";
      html = `
        <p>Hello ${toName},</p>
        <p>It's time to record ${notificationDetails.catName}'s weight for your monitoring schedule.</p>
        <p>Thanks,<br>The MealTime Team</p>
      `;
      text = `Hello ${toName},\n\nIt's time to record ${notificationDetails.catName}'s weight for your monitoring schedule.\n\nThanks,\nThe MealTime Team`;
      break;
    
    case 'household_update':
      subject = "Household Update";
      html = `
        <p>Hello ${toName},</p>
        <p>There has been an update to your household: ${notificationDetails.updateMessage}</p>
        <p>Thanks,<br>The MealTime Team</p>
      `;
      text = `Hello ${toName},\n\nThere has been an update to your household: ${notificationDetails.updateMessage}\n\nThanks,\nThe MealTime Team`;
      break;
  }

  return sendEmail({
    to,
    toName,
    subject,
    html,
    text,
    tags: ['notification', notificationType]
  });
} 