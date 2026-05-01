import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    enabled: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    enableNativeFramesTracking: true,
    debug: __DEV__,
  });
}

export { Sentry };
