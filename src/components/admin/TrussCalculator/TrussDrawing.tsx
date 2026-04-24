'use client';

import { sanitizeSvg } from '@/lib/sanitize';

interface Props {
  svgString: string;
}

export default function TrussDrawing({ svgString }: Props) {
  if (!svgString) return null;

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Чертёж фермы</h3>
      <div
        className="w-full overflow-auto"
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgString) }}
      />
    </div>
  );
}
