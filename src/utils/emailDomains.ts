
/**
 * List of common public email domains.
 * This list can be expanded as needed.
 */
export const PUBLIC_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'zoho.com',
  'yandex.com',
  'mail.com',
  'gmx.com',
  'live.com',
  'me.com',
  'msn.com',
  'wanadoo.fr',
  'orange.fr',
  'comcast.net',
  'verizon.net',
  'sbcglobal.net',
  'att.net'
]);

export enum EmailType {
  PUBLIC = 'PUBLIC',
  CUSTOM = 'CUSTOM'
}

/**
 * Classifies an email address as belonging to a public domain or a custom domain.
 * @param email The email address to check
 * @returns EmailType.PUBLIC or EmailType.CUSTOM
 */
export const classifyEmailDomain = (email: string): EmailType => {
  if (!email || !email.includes('@')) {
    return EmailType.CUSTOM; // Fallback for invalid emails
  }

  const domain = email.split('@')[1].toLowerCase();
  
  if (PUBLIC_DOMAINS.has(domain)) {
    return EmailType.PUBLIC;
  }
  
  return EmailType.CUSTOM;
};
