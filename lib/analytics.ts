export const GA_MEASUREMENT_ID = (
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-GNV174YHV2'
).trim();

export function isAnalyticsEnabled(): boolean {
  return /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(pagePath: string, pageTitle: string): void {
  if (typeof window === 'undefined' || !isAnalyticsEnabled()) return;
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_title: pageTitle,
    page_path: pagePath,
    page_location: window.location.origin + pagePath,
    send_to: GA_MEASUREMENT_ID,
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined' || !isAnalyticsEnabled()) return;
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', eventName, {
    ...params,
    send_to: GA_MEASUREMENT_ID,
  });
}
