import RootProviders from "@/components/RootProviders";

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootProviders>{children}</RootProviders>;
}
