cd ~/projects/craftworks-english-lab
cat > app/layout.tsx << 'EOF'
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "craftworks-english-lab",
  description: "TOEIC Part 5 Trainer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
EOF
