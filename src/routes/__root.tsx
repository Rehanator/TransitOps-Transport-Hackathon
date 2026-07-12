import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppLayout } from "../components/layout/AppLayout";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TransitOps — Smart Transport Operations Platform" },
      {
        name: "description",
        content:
          "TransitOps digitizes fleet operations: vehicle tracking, driver allocation, maintenance workflows, and financial analytics in one platform.",
      },
      { property: "og:title", content: "TransitOps — Smart Transport Operations" },
      {
        property: "og:description",
        content: "End-to-end logistics, dispatch, maintenance, and financial analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <QueryClientProvider client={queryClient}>
      {mounted ? (
        <AppLayout>
          <Outlet />
        </AppLayout>
      ) : (
        <div className="min-h-screen bg-background" />
      )}
    </QueryClientProvider>
  );
}
