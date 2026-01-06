import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
}

const UTM_STORAGE_KEY = 'quickliqi_utm_params';

export function useUTM() {
  const [searchParams] = useSearchParams();
  const [utmParams, setUtmParams] = useState<UTMParams>(() => {
    // Try to get from session storage first
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
    };
  });

  useEffect(() => {
    // Check URL for UTM params
    const utm_source = searchParams.get('utm_source');
    const utm_medium = searchParams.get('utm_medium');
    const utm_campaign = searchParams.get('utm_campaign');
    const utm_term = searchParams.get('utm_term');
    const utm_content = searchParams.get('utm_content');

    // Only update if we have new UTM params
    if (utm_source || utm_medium || utm_campaign || utm_term || utm_content) {
      const newParams: UTMParams = {
        utm_source: utm_source || utmParams.utm_source,
        utm_medium: utm_medium || utmParams.utm_medium,
        utm_campaign: utm_campaign || utmParams.utm_campaign,
        utm_term: utm_term || utmParams.utm_term,
        utm_content: utm_content || utmParams.utm_content,
      };
      setUtmParams(newParams);
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(newParams));
    }
  }, [searchParams]);

  const clearUTM = () => {
    sessionStorage.removeItem(UTM_STORAGE_KEY);
    setUtmParams({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
    });
  };

  return { utmParams, clearUTM };
}
