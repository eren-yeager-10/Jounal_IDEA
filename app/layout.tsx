import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Gemini Journal & Reflections',
  description: 'An authenticated AI journaling companion powered by Gemini 3.6 Flash and Cloud Firestore with private user-isolated reflections.',
  openGraph: {
    title: 'Gemini Journal & Reflections',
    description: 'An authenticated AI journaling companion powered by Gemini 3.6 Flash and Cloud Firestore with private user-isolated reflections.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gemini Journal & Reflections',
    description: 'An authenticated AI journaling companion powered by Gemini 3.6 Flash and Cloud Firestore with private user-isolated reflections.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
