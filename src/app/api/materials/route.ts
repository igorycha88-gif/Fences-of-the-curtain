import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const active = searchParams.get('active');

  const where: any = {};

  if (category) {
    where.category = category;
  }

  if (active !== null) {
    where.active = active === 'true';
  }

  const materials = await prisma.fenceMaterial.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ materials });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const material = await prisma.fenceMaterial.create({
      data: {
        name: body.name,
        category: body.category,
        unit: body.unit,
        basePrice: body.basePrice,
        description: body.description,
        image: body.image,
        thickness: body.thickness,
        width: body.width,
        height: body.height,
        coating: body.coating,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ id: material.id }, { status: 201 });
  } catch (error) {
    console.error('Material creation error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания материала' },
      { status: 500 }
    );
  }
}
