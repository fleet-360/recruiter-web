'use client';

import { format } from 'date-fns';
import { useEffect, useState } from 'react';

interface FormattedDateProps {
  date: string | Date;
  formatString: string;
  fallback?: string;
}

/**
 * Client-side date formatter that prevents hydration errors
 * by only rendering the formatted date after client-side hydration
 */
export function FormattedDate({ date, formatString, fallback = '...' }: FormattedDateProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState(fallback);

  useEffect(() => {
    setIsMounted(true);
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      setFormattedDate(format(dateObj, formatString));
    } catch (error) {
      console.error('Error formatting date:', error);
      setFormattedDate(fallback);
    }
  }, [date, formatString, fallback]);

  // During SSR and initial render, show fallback to prevent hydration mismatch
  if (!isMounted) {
    return <span suppressHydrationWarning>{fallback}</span>;
  }

  return <span>{formattedDate}</span>;
}

