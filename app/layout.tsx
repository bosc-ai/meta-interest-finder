import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Meta Interest Finder",
  description:
    "Find highly related Meta Ads targeting (Interests, Behaviors, Job Titles, Employers, Demographics, Life Events, Industries, Geos).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="theme-transition min-h-screen bg-neutral-950 text-neutral-100">
        {children}
      </body>
    </html>
  );
}
