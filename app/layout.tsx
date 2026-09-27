import type { Metadata } from "next";
import "./globals.css";
import { Outfit } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";

import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Provider from "./provider";
import { toast, Toaster } from 'sonner'

export const metadata: Metadata = {
  title: "Alpha Agents | Build AI workflows that work for you",
  description: "Design intelligent agents, connect your tools, and bring your workflows to life with Alpha Agents.",
};

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={outfit.className}>
          <ConvexClientProvider>
            <Provider>
              {children}
              <Toaster />
            </Provider></ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
