
/**
 * Creates a debounced function that delays invoking func until after wait milliseconds.
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Creates a throttled function that only invokes func at most once per every limit milliseconds.
 */
export function throttle<T extends (...args: any[]) => void>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Memoization helper for expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map();
    return ((...args: any[]) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        const result = func(...args);
        cache.set(key, result);
        return result;
    }) as T;
}
