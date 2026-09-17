import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/Providers";
import { AlertProvider } from "@/components/AlertProvider";
import "./globals.css";

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: "--font-poppins",
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
        className={`${poppins.variable} font-sans antialiased`}
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
