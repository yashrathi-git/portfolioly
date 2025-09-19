"use client";
// ThemeProvider is now simplified since theme initialization
// happens in the layout script and theme management in useTheme hook
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
