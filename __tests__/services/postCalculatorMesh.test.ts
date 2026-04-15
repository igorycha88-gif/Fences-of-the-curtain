import { calculatePostsForMesh } from '@/services/calculator/postCalculator';

jest.mock('@/lib/cache', () => ({
  cache: {
    getOrSet: jest.fn((_key: string, fn: () => Promise<unknown>) => fn()),
    del: jest.fn(),
    delPattern: jest.fn(),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    postType: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockPosts = [
  {
    id: 'post-1',
    name: 'Столб 60x60x2 2.5м',
    sectionWidth: 60,
    sectionHeight: 60,
    wallThickness: 2,
    pricePerMeter: 300,
    image: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    expirationDate: null,
    validFrom: null,
    length: 2.5,
    priority: 0,
    retailPricePerUnit: 750,
    purchasePricePerUnit: 500,
    forMesh: false,
  },
  {
    id: 'post-mesh-1',
    name: 'Столб для сетки 60x60x2 3.0м',
    sectionWidth: 60,
    sectionHeight: 60,
    wallThickness: 2,
    pricePerMeter: 300,
    image: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    expirationDate: null,
    validFrom: null,
    length: 3.0,
    priority: 0,
    retailPricePerUnit: 900,
    purchasePricePerUnit: 600,
    forMesh: true,
  },
  {
    id: 'post-mesh-2',
    name: 'Столб для сетки 60x60x2 3.5м',
    sectionWidth: 60,
    sectionHeight: 60,
    wallThickness: 2,
    pricePerMeter: 300,
    image: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    expirationDate: null,
    validFrom: null,
    length: 3.5,
    priority: 1,
    retailPricePerUnit: 1050,
    purchasePricePerUnit: 700,
    forMesh: true,
  },
];

describe('postCalculator - calculatePostsForMesh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select mesh posts (forMesh=true) with sufficient height', async () => {
    (prisma.postType.findMany as jest.Mock).mockResolvedValue(mockPosts);

    const result = await calculatePostsForMesh(30, 1.5, 2.5);

    expect(result.category).toBe('posts');
    expect(result.nomenclatureId).toBe('post-mesh-1');
    expect(result.quantity).toBe(14); // ceil(30/2.5) + 2
  });

  it('should select taller mesh post when shorter ones are insufficient', async () => {
    (prisma.postType.findMany as jest.Mock).mockResolvedValue(mockPosts);

    const result = await calculatePostsForMesh(30, 2.0, 2.5);

    expect(result.nomenclatureId).toBe('post-mesh-2');
  });

  it('should throw NO_POSTS_FOUND when no mesh posts with sufficient height', async () => {
    (prisma.postType.findMany as jest.Mock).mockResolvedValue(mockPosts);

    await expect(
      calculatePostsForMesh(30, 3.0, 2.5)
    ).rejects.toEqual({
      error: 'NO_POSTS_FOUND',
      message: 'Не найдены столбы для сетки-рабицы подходящей высоты',
      details: {
        requiredHeight: 4200,
        availableMaxHeight: 3500,
        suggestion: 'Свяжитесь с нами для индивидуального расчета',
      },
    });
  });

  it('should not select non-mesh posts even if they have sufficient height', async () => {
    (prisma.postType.findMany as jest.Mock).mockResolvedValue(mockPosts);

    const result = await calculatePostsForMesh(30, 1.5, 2.5);

    expect(result.nomenclatureId).not.toBe('post-1');
    expect(result.nomenclatureId).toBe('post-mesh-1');
  });
});
