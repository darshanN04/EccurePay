"use client"; // This indicates it's a client component



export default function RootLayout({ children }) {
  return (
      <html lang="en">
        <body>{children}</body>
      </html>
  );
}
