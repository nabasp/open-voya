import type { AppProps } from "next/app";
import { Space_Mono } from "next/font/google";

import "../styles/globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={`${spaceMono.variable} h-full`}>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </div>
  );
}
