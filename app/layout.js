import "./globals.css";

export const metadata = {
  title: "0&1 シフト希望調査",
  description: "Bar 0&1 スタッフ出勤可能日入力フォーム",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
