import "./globals.css";
import ThemeSwitch from "@/components/ThemeSwitch";

export const metadata = {
  title: "craftworks-english-lab",
  description: "TOEIC Part 5 Trainer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ThemeSwitch />
        {children}
      </body>
    </html>
  );
}
