interface ServiceSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ServiceSlugLayout({
  children,
}: ServiceSlugLayoutProps) {
  return children;
}
