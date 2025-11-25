import { Inter } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "@/components/AnalyticsTracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Feeta | Autonomous AI Project Manager",
  description: "Stop burning cash on inefficiency. Feeta is an AI Project Manager that automates tasks, eliminates stand-ups, and reclaims your team's lost time.",
  keywords: "AI project management, project planning, team collaboration, task automation, productivity tools",
  authors: [{ name: "Feeta Team" }],
  creator: "Feeta",
  publisher: "Feeta",
  robots: "index, follow",
  openGraph: {
    type: "website",
    url: "https://Feeta.ch/",
    title: "Feeta AI| Autonomous AI Project Manager",
    description: "Stop burning cash on inefficiency. Feeta is an AI Project Manager that automates tasks, eliminates stand-ups, and reclaims your team's lost time.",
    siteName: "Feeta",
    locale: "en_US",
    images: [{
      url: "https://Feeta.ch/Images/F.png",
      width: 1200,
      height: 628,
      alt: "Feeta AI- AI Operational Co-Pilot",
    }],
  },
  twitter: {
    card: "summary_large_image",
    url: "https://Feeta.ch/",
    title: "Feeta AI| Autonomous AI Project Manager",
    description: "Stop burning cash on inefficiency. Feeta is an AI Project Manager that automates tasks, eliminates stand-ups, and reclaims your team's lost time.",
    images: ["https://Feeta.ch/Images/F.png"],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/Images/F.png" />
        <link rel="apple-touch-icon" href="/Images/F.png" />
        <meta name="theme-color" content="#4C3BCF" />
      </head>
      <body className="font-inter antialiased">
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
