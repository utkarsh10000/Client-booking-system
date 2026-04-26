import './globals.css';

export const metadata = {
  title: 'Client Registration | Haute Developer',
  description: 'Client registration portal for Haute Developer projects',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
