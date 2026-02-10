
import React, { useState, useEffect, useMemo, useRef } from 'react';

interface VirtualizerProps {
    itemCount: number;
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
}

export const useVirtualizer = ({ itemCount, itemHeight, containerHeight, overscan = 3 }: VirtualizerProps) => {
    const [scrollTop, setScrollTop] = useState(0);

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(itemCount, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);

    const visibleItems = useMemo(() => {
        const items = [];
        for (let i = startIndex; i < endIndex; i++) {
            items.push({
                index: i,
                offsetTop: i * itemHeight,
            });
        }
        return items;
    }, [startIndex, endIndex, itemHeight]);

    const totalHeight = itemCount * itemHeight;

    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollTop = e.currentTarget.scrollTop;
        // Use requestAnimationFrame for smoother scrolling performance
        requestAnimationFrame(() => {
            setScrollTop(currentScrollTop);
        });
    };

    return { visibleItems, totalHeight, onScroll, startIndex, endIndex };
};