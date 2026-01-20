import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Booking Platform",
  description: "Turf / Event booking management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
