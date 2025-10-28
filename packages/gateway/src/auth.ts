/**
 * Gateway authentication
 */

export interface AuthResult {
  authenticated: boolean;
  payload?: any;
}

export function authenticateApiKey(key: string, validKeys: string[]): AuthResult {
  const authenticated = validKeys.includes(key);
  return { authenticated };
}

export function generateJWT(payload: any, secret: string, options?: { algorithm?: string }): string {
  // Simple mock JWT generation
  const header = Buffer.from(JSON.stringify({ alg: options?.algorithm || 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = Buffer.from(secret).toString('base64').substring(0, 10);
  return `${header}.${body}.${signature}`;
}

export function authenticateJWT(token: string, secret: string): AuthResult {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { authenticated: false };
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { authenticated: false };
    }
    
    return { authenticated: true, payload };
  } catch (error) {
    return { authenticated: false };
  }
}
