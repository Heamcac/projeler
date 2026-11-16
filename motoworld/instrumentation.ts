import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    tracesSampleRate: 0,
    beforeSend(event) {
      delete event.user;
      delete event.request;
      delete event.breadcrumbs;
      delete event.extra;
      delete event.contexts;
      delete event.transaction;
      delete event.tags;
      if (event.logentry) delete event.logentry;
      if (event.message) event.message = "MOTOWORLD sunucu hatası";
      for (const error of event.exception?.values ?? []) {
        error.value = "MOTOWORLD sunucu hatası";
        for (const frame of error.stacktrace?.frames ?? []) {
          delete frame.vars;
          delete frame.pre_context;
          delete frame.context_line;
          delete frame.post_context;
        }
      }
      return event;
    },
  });
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!process.env.SENTRY_DSN || process.env.NEXT_RUNTIME !== "nodejs") return;
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(error, request, context);
};
