import type { Metadata } from "next";
import { Montserrat, Roboto_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { AlertProvider } from "@/components/AlertProvider";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FCMM System",
  description: "FCMM System Dashboard",
  icons: {
    icon: '/fcmm/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${robotoMono.variable} font-sans antialiased`}
      >
        <Providers>
          <AlertProvider>
            {children}
          </AlertProvider>
        </Providers>
      </body>
    </html>
  );
}
