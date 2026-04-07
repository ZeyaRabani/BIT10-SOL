import '@/styles/globals.css'
import { cn, constructMetadata } from '@/lib/utils'
import { CSPostHogProvider } from '@/app/_analytics/provider'
import Providers from '@/app/_provider/Providers'
import ScrollToTopBtn from '@/components/ScrollToTopBtn'
import { Toaster } from '@/components/ui/sonner'

export const metadata = constructMetadata();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background antialiased font-dm-sans tracking-wide')}>
          <Providers>
            <main>
              {children}
            </main>
            <ScrollToTopBtn />
            <Toaster richColors closeButton />
          </Providers>
      </body>
    </html>
  );
}
