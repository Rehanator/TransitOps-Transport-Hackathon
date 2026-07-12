import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";

import appCss from "../styles.css?url";
import { AppLayout } from "../components/layout/AppLayout";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

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
      { property: "og:title", content: "TransitOps — Smart Transport Operations Platform" },
      {
        property: "og:description",
        content: "TransitOps digitizes fleet operations: vehicle tracking, driver allocation, maintenance workflows, and financial analytics in one platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TransitOps — Smart Transport Operations Platform" },
      { name: "twitter:description", content: "TransitOps digitizes fleet operations: vehicle tracking, driver allocation, maintenance workflows, and financial analytics in one platform." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/14873ba8-df21-4dd3-92a1-51f55f13c4f0/id-preview-9ce2ef50--651eb6b6-397b-474e-bac3-8bb32a144afc.lovable.app-1783845269631.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/14873ba8-df21-4dd3-92a1-51f55f13c4f0/id-preview-9ce2ef50--651eb6b6-397b-474e-bac3-8bb32a144afc.lovable.app-1783845269631.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/transitops-icon.png" },
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
        CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
            <AppLayout>
              <Outlet />
            </AppLayout>
          </ClerkProvider>
        ) : (
          <AppLayout>
            <Outlet />
          </AppLayout>
        )
      ) : (
        <div className="min-h-screen bg-background" />
      )}
    </QueryClientProvider>
  );
}
