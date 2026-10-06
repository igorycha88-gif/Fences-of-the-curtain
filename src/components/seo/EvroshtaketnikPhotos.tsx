import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { normalizeImageUrl } from '@/lib/utils/imageUrl';

/**
 * Фото-блок «Евроштакетник шахматкой с планкой» (ЧТЗ v6 TASK-ZN-2):
 * реальные фото работ из портфолио с подписями и alt-тегами под запрос
 * «забор из евроштакетника шахматка с планкой фото».
 */

const PHOTO_CAPTIONS = [
  'Шахматка',
  'Шахматка с планкой-накладкой',
  'Двусторонний евроштакетник',
  'Шахматка с планкой на створках',
  'Евроштакетник под ключ',
];

const SEO_ALT_PREFIX = 'Забор из евроштакетника шахматка с планкой — фото';

interface PortfolioPhoto {
  id: string;
  title: string;
  url: string;
}

function firstImageUrl(images: unknown): string | null {
  if (Array.isArray(images)) {
    const first = images.find((item): item is string => typeof item === 'string' && item.length > 0);
    return first ? normalizeImageUrl(first) : null;
  }
  return null;
}

export default async function EvroshtaketnikPhotos() {
  let photos: PortfolioPhoto[] = [];

  try {
    const evroshtaketnikItems = await prisma.portfolioItem.findMany({
      where: {
        active: true,
        OR: [
          { title: { contains: 'евроштакет' } },
          { title: { contains: 'Евроштакет' } },
        ],
      },
      select: { id: true, title: true, images: true },
      orderBy: { sortOrder: 'asc' },
      take: 5,
    });

    photos = evroshtaketnikItems
      .map((item) => {
        const url = firstImageUrl(item.images);
        return url ? { id: item.id, title: item.title, url } : null;
      })
      .filter((item): item is PortfolioPhoto => item !== null);

    if (photos.length < 3) {
      const fenceItems = await prisma.portfolioItem.findMany({
        where: {
          active: true,
          category: 'fence',
          NOT: {
            OR: [
              { title: { contains: 'евроштакет' } },
              { title: { contains: 'Евроштакет' } },
            ],
          },
        },
        select: { id: true, title: true, images: true },
        orderBy: { sortOrder: 'asc' },
        take: 5 - photos.length,
      });

      photos = photos.concat(
        fenceItems
          .map((item) => {
            const url = firstImageUrl(item.images);
            return url ? { id: item.id, title: item.title, url } : null;
          })
          .filter((item): item is PortfolioPhoto => item !== null)
      );
    }
  } catch (error) {
    logger.error('EvroshtaketnikPhotos: failed to load portfolio photos', {
      module: 'evroshtaketnik-photos',
      operation: 'loadPortfolioPhotos',
      error,
    });
    return null;
  }

  if (photos.length === 0) {
    logger.warn('EvroshtaketnikPhotos: no portfolio photos found, block skipped', {
      module: 'evroshtaketnik-photos',
      operation: 'loadPortfolioPhotos',
    });
    return null;
  }

  logger.info('EvroshtaketnikPhotos: block rendered', {
    module: 'evroshtaketnik-photos',
    operation: 'render',
    photoCount: photos.length,
  });

  return (
    <section className="py-12 px-4 bg-secondary/30" data-testid="evroshtaketnik-photos">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">
          Евроштакетник шахматкой с планкой — фото наших работ
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Шахматка — планки набиты с двух сторон лаг в шахматном порядке: забор
          выглядит одинаково аккуратно с улицы и со двора, продувается и не
          затеняет грядки. Планка-накладка на торцах столбов и створках ворота
          закрывает срезы металла и придаёт ограждению завершённый вид. Ниже —
          реальные объекты, смонтированные нашими бригадами в Москве и МО.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <figure key={photo.id} className="card-modern overflow-hidden hover-lift">
              <Link href={`/portfolio/${photo.id}`} className="block group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`${SEO_ALT_PREFIX}: ${PHOTO_CAPTIONS[index % PHOTO_CAPTIONS.length].toLowerCase()} — ${photo.title}`}
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
                  data-testid="evroshtaketnik-photo"
                />
                <figcaption className="p-4">
                  <span className="font-semibold group-hover:text-primary transition-colors">
                    {PHOTO_CAPTIONS[index % PHOTO_CAPTIONS.length]}
                  </span>
                  <span className="block text-sm text-muted-foreground mt-1">
                    {photo.title}
                  </span>
                </figcaption>
              </Link>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
