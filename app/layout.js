import './globals.css';

export const metadata = {
  title: 'Client Registration | Haute Developers',
  description: 'Client registration portal for Haute Developers projects',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
