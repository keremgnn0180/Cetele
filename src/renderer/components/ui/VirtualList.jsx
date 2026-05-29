import React, { useMemo, useState } from 'react';

export default function VirtualList({ items, itemHeight = 52, height = 420, renderItem, overscan = 6 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = items.length * itemHeight;

  const range = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
    const end = Math.min(items.length, start + visibleCount);
    return { start, end };
  }, [height, itemHeight, items.length, overscan, scrollTop]);

  const visibleItems = items.slice(range.start, range.end);

  return (
    <div className="virtual-list" style={{ height, overflow: 'auto' }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const absoluteIndex = range.start + index;
          return (
            <div
              key={item.id ?? absoluteIndex}
              style={{
                position: 'absolute',
                top: absoluteIndex * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight
              }}
            >
              {renderItem(item, absoluteIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
