import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import AppLayout from "./components/AppLayout";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FCDC Helpdesk Enterprise IT Support",
  description: "Professional FCDC IT Support Ticketing System for efficient support management and issue resolution.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {/* AppLayout handles header and sidebar */}
            <div className="flex-1">
              <AppLayout>
                {children}
              </AppLayout>
            </div>
            
            {/* Footer - Always visible */}
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
