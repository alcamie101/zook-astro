import { useState, useEffect, useRef } from 'react';

export interface ColumnWidths {
  left: number;
  center: number;
  right: number;
}

const DEFAULT_WIDTHS: ColumnWidths = { left: 23, center: 41, right: 36 };
const STORAGE_KEY = 'zook_astro_col_widths';

export function useResizableColumns() {
  const [colWidths, setColWidths] = useState<ColumnWidths>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WIDTHS;
  });

  const mainContainerRef = useRef<HTMLElement>(null);
  const draggingDividerRef = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingDividerRef.current || !mainContainerRef.current) return;
      const rect = mainContainerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      if (totalWidth <= 0) return;

      const mouseX = Math.max(0, Math.min(totalWidth, e.clientX - rect.left));
      const mouseXPct = (mouseX / totalWidth) * 100;

      if (draggingDividerRef.current === 'left') {
        const newLeft = Math.max(14, Math.min(38, mouseXPct));
        const newCenter = Math.max(20, 100 - newLeft - colWidths.right);
        const updated = { left: newLeft, center: newCenter, right: colWidths.right };
        setColWidths(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      } else if (draggingDividerRef.current === 'right') {
        const newRight = Math.max(20, Math.min(55, 100 - mouseXPct));
        const newCenter = Math.max(20, 100 - colWidths.left - newRight);
        const updated = { left: colWidths.left, center: newCenter, right: newRight };
        setColWidths(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
    };

    const handleMouseUp = () => {
      if (draggingDividerRef.current) {
        draggingDividerRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [colWidths]);

  const startDrag = (divider: 'left' | 'right') => {
    draggingDividerRef.current = divider;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const resetColWidths = () => {
    setColWidths(DEFAULT_WIDTHS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WIDTHS));
    } catch {}
  };

  return {
    colWidths,
    mainContainerRef,
    startDrag,
    resetColWidths,
  };
}
