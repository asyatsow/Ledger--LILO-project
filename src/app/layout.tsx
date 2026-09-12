import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/Shell';

export const metadata: Metadata = { title: 'Ledger — Copilot makes you faster. Ledger tells you if you\u2019re getting better.', description: 'AI helps you fix bugs fast. Ledger checks whether the skill behind the fix actually became yours — and lets you re-check it anytime, before an interview, exam, or project.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body><Shell>{children}</Shell></body></html>;
}
