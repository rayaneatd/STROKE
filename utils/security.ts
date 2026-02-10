
// --- SECURITY UTILITIES ---

/**
 * Sanitizes string input to prevent XSS.
 * In a real environment, use DOMPurify. Here we use a basic regex replacer for demo.
 */
export const sanitizeInput = (input: string): string => {
    return input.replace(/[&<>"'/]/g, (match) => {
        const chars: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
        };
        return chars[match];
    });
};

/**
 * Validates email format using strict regex.
 */
export const isValidEmail = (email: string): boolean => {
    // RFC 5322 Official Standard Regex
    const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
    return emailRegex.test(email);
};

/**
 * Simple Mock Encryption for LocalStorage
 * WARNING: Client-side encryption is not a replacement for server-side security.
 * This prevents casual snooping of local storage.
 */
export const secureStorage = {
    setItem: (key: string, value: any) => {
        try {
            const stringValue = JSON.stringify(value);
            const encoded = btoa(encodeURIComponent(stringValue)); // Base64 encode
            localStorage.setItem(key, encoded);
        } catch (e) {
            console.error("Storage Error", e);
        }
    },
    getItem: <T>(key: string): T | null => {
        try {
            const encoded = localStorage.getItem(key);
            if (!encoded) return null;
            const decoded = decodeURIComponent(atob(encoded));
            return JSON.parse(decoded) as T;
        } catch (e) {
            console.error("Retrieval Error", e);
            return null;
        }
    },
    removeItem: (key: string) => localStorage.removeItem(key)
};

/**
 * Validates password strength
 */
export const isStrongPassword = (password: string): boolean => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
};
