import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/Shell';

export const metadata: Metadata = { title: 'Ledger — Know where you stand', description: 'Turn AI-assisted coding into independent skill.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body><Shell>{children}</Shell></body></html>;
}
