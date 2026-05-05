interface BlogSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function BlogSlugLayout({
  children,
}: BlogSlugLayoutProps) {
  return children;
}
