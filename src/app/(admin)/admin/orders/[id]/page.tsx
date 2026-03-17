'use client';

import { useParams } from 'next/navigation';
import { OrderDetailPage } from '@/components/admin/Orders/OrderDetailPage';

export default function Page() {
  const params = useParams();
  const id = params.id as string;
  return <OrderDetailPage orderId={id} />;
}
