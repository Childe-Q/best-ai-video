'use client';

type FeatureTrackEvent =
  | 'page_view'
  | 'click_tool_card'
  | 'click_outbound'
  | 'click_internal_link';

type FeatureTrackPayload = Record<string, string | number | boolean | null | undefined>;

type FeatureTrackEntry = {
  event: FeatureTrackEvent;
  payload: FeatureTrackPayload;
  timestamp: number;
};

type FeatureWindow = Window & {
  __events?: FeatureTrackEntry[];
};

export function track(event: FeatureTrackEvent, payload: FeatureTrackPayload): void {
  if (typeof window === 'undefined') {
    return;
  }

  const entry: FeatureTrackEntry = {
    event,
    payload,
    timestamp: Date.now(),
  };

  const featureWindow = window as FeatureWindow;
  featureWindow.__events = featureWindow.__events || [];
  featureWindow.__events.push(entry);

  console.log('[track]', event, payload);
}
