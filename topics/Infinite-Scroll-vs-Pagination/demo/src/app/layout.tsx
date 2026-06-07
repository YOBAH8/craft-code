import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Infinite Scroll vs Pagination — craft-code",
  description:
    "Interactive demo showing the real tradeoffs between infinite scroll and pagination. Side-by-side comparison with cursor-based API, IntersectionObserver, and TanStack Query.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#080D0A",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  );
}
