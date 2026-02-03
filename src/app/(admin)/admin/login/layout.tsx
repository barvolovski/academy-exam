export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Override the admin layout for the login page - no sidebar needed
  return <>{children}</>;
}
