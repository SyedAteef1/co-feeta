import { Inter } from "next/font/google";
import "./globals.css";

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
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/Images/F.png" />
        <link rel="apple-touch-icon" href="/Images/F.png" />
        <meta name="theme-color" content="#4C3BCF" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://Feeta.ch/" />
        <meta property="og:title" content="Feeta | Autonomous AI Project Manager" />
        <meta property="og:description" content="Stop burning cash on inefficiency. Feeta is an AI Project Manager that automates tasks, eliminates stand-ups, and reclaims your team's lost time." />
        <meta property="og:image" content="https://Feeta.ch/Images/F.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />
        <meta property="og:image:alt" content="Feeta - AI Operational Co-Pilot" />
        <meta name="twitter:url" content="https://Feeta.ch/" />
        <meta name="twitter:title" content="Feeta | Autonomous AI Project Manager" />
        <meta name="twitter:description" content="Stop burning cash on inefficiency. Feeta is an AI Project Manager that automates tasks, eliminates stand-ups, and reclaims your team's lost time." />
        <meta name="twitter:image" content="https://Feeta.ch/Images/F.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className="font-inter antialiased">
        {children}
      </body>
    </html>
  );
}
