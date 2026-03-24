import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Updating Panel3D data...');

  const panel2000 = await prisma.panel3D.findFirst({
    where: { panelHeight: 2000 },
  });

  if (panel2000) {
    console.log('Found 2000mm panel:', panel2000.id, panel2000.name);
    await prisma.panel3D.update({
      where: { id: panel2000.id },
      data: {
        panelWidth: 2500,
        retailPricePerUnit: 5000,
      },
    });
    console.log('Updated 2000mm panel: width=2500mm, price=5000');
  } else {
    console.log('Creating new 2000mm panel...');
    await prisma.panel3D.create({
      data: {
        id: 'cmn3p85n8000wxgme2k3ovwvk',
        name: '3D-панель 2000x2500',
        panelHeight: 2000,
        panelWidth: 2500,
        rodDiameter: 4.0,
        cellWidth: 50,
        cellHeight: 200,
        retailPricePerUnit: 5000,
        active: true,
        priority: 0,
      },
    });
    console.log('Created new 2000mm panel');
  }

  await prisma.$disconnect();
  console.log('Done!');
}

main().catch(console.error);
