import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeadingLevel,
  ImageRun,
  ShadingType,
} from 'docx';
import sharp from 'sharp';
import { TrussCalculationResult, CanopyRoofType, MaterialItem, LoadResult, TrussElementDetail } from '../truss/types';

const COL_WIDTHS = {
  NUM: 5,
  NAME: 30,
  TYPE: 15,
  LENGTH: 10,
  BOTTOM_ANGLE: 12,
  TOP_ANGLE: 12,
  PROFILE: 18,
  THICKNESS: 10,
  COUNT: 8,
  WEIGHT: 10,
  PRICE: 10,
  TOTAL: 11,
};

function getCanopyTypeName(type: CanopyRoofType): string {
  switch (type) {
    case 'SINGLE_SLOPE': return 'Односкатная';
    case 'DOUBLE_SLOPE': return 'Двухскатная';
    case 'ARCH': return 'Арочная';
    case 'SINGLE_SLOPE_CURVED': return 'Односкатная в дуге';
  }
}

function createHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { fill: '1e40af', type: ShadingType.SOLID, color: '1e40af' },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });
}

function createDataCell(text: string, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT): TableCell {
  return new TableCell({
    width: { size: 20, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 18, font: 'Times New Roman' })],
        alignment: align,
      }),
    ],
  });
}

async function svgToPng(svgString: string): Promise<Buffer> {
  const svgBuffer = Buffer.from(svgString);
  return sharp(svgBuffer).resize(800, 450, { fit: 'contain', background: { r: 255, g: 255, b: 255 } }).png().toBuffer();
}

export interface TrussWordData {
  canopyType: CanopyRoofType;
  width: number;
  length: number;
  ridgeHeight: number;
  wallHeight?: number;
  trussSpacing: number;
  roofCoveringName: string;
  calculation: TrussCalculationResult;
}

export async function generateTrussWord(data: TrussWordData): Promise<Buffer> {
  const { canopyType, width, length, ridgeHeight, wallHeight, trussSpacing, roofCoveringName, calculation } = data;
  const { loads, materialList, svgDrawing, safetyFactor, allProfilesPassed, elementDetails, archProfileLength } = calculation;

  const pngBuffer = await svgToPng(svgDrawing);

  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'ТЕХНИЧЕСКОЕ ЗАДАНИЕ', bold: true, size: 32, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'на изготовление навеса', bold: true, size: 26, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: '1. Исходные данные', bold: true, size: 22, font: 'Times New Roman' })],
      spacing: { before: 200, after: 100 },
    }),
  );

  const params = [
    ['Тип крыши', getCanopyTypeName(canopyType)],
    ['Ширина навеса (пролёт)', `${width} мм`],
    ['Длина навеса', `${length} мм`],
    ['Высота в коньке/центре', `${ridgeHeight} мм`],
    ...(wallHeight ? [['Высота у низкой стены', `${wallHeight} мм`]] as string[][] : []),
    ['Шаг установки ферм', `${trussSpacing} мм`],
    ['Покрытие крыши', roofCoveringName],
    ['Снеговой район', 'III (Московская область, Sg = 180 кг/м²)'],
  ];

  const paramRows = params.map((p, i) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: p[0], size: 18, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: p[1], bold: true, size: 18, font: 'Times New Roman' })] })],
        }),
      ],
    })
  );

  children.push(new Table({ rows: paramRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  children.push(
    new Paragraph({
      children: [new TextRun({ text: '2. Расчёт нагрузок', bold: true, size: 22, font: 'Times New Roman' })],
      spacing: { before: 300, after: 100 },
    }),
  );

  children.push(createLoadsTable(loads, safetyFactor));

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Коэффициент запаса прочности: ${safetyFactor}`, bold: true, size: 20, font: 'Times New Roman', color: allProfilesPassed ? '059669' : 'dc2626' })],
      spacing: { before: 100, after: 100 },
    }),
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: '3. Чертёж фермы', bold: true, size: 22, font: 'Times New Roman' })],
      spacing: { before: 300, after: 100 },
      pageBreakBefore: true,
    }),
  );

  children.push(
    new Paragraph({
      children: [
        new ImageRun({
          data: pngBuffer,
          transformation: { width: 700, height: 390 },
          type: 'png',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: '4. Спецификация материалов', bold: true, size: 22, font: 'Times New Roman' })],
      spacing: { before: 300, after: 100 },
    }),
  );

  children.push(createMaterialTable(materialList));

  const totalWeight = materialList.reduce((s, m) => s + m.totalWeight, 0);
  const totalPrice = materialList.reduce((s, m) => s + m.totalPrice, 0);

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Общий вес конструкции: ${Math.round(totalWeight * 10) / 10} кг`, bold: true, size: 20, font: 'Times New Roman' }),
      ],
      spacing: { before: 100, after: 50 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Общая стоимость материалов: ${Math.round(totalPrice).toLocaleString('ru-RU')} руб.`, bold: true, size: 20, font: 'Times New Roman' }),
      ],
      spacing: { before: 50, after: 200 },
    }),
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: '5. Детализация элементов фермы', bold: true, size: 22, font: 'Times New Roman' })],
      spacing: { before: 300, after: 100 },
      pageBreakBefore: true,
    }),
  );

  children.push(
    new Paragraph({
      children: [new TextRun({
        text: 'Таблица содержит полный перечень элементов фермы с длинами, углами запила, профилем и количеством одинаковых деталей.',
        size: 16, font: 'Times New Roman', italics: true, color: '6b7280',
      })],
      spacing: { after: 100 },
    }),
  );

  if (archProfileLength && (canopyType === 'ARCH' || canopyType === 'SINGLE_SLOPE_CURVED')) {
    const bendDescription = canopyType === 'ARCH'
      ? `Радиус гибки рассчитан на основе ширины навеса (${width} мм) и высоты центральной стойки (${ridgeHeight} мм).`
      : `Длина профиля рассчитана на основе ширины навеса (${width} мм) и высоты подъёма дуги (${ridgeHeight} мм).`;
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Арочный пояс: ', bold: true, size: 18, font: 'Times New Roman' }),
          new TextRun({ text: `длина профиля для гибки = ${Math.round(archProfileLength)} мм (${(archProfileLength / 1000).toFixed(2)} м). ${bendDescription}`, size: 18, font: 'Times New Roman' }),
        ],
        spacing: { after: 100 },
      }),
    );
  }

  children.push(createElementDetailsTable(elementDetails));

  children.push(
    new Paragraph({
      children: [new TextRun({ text: '6. Примечание', bold: true, size: 22, font: 'Times New Roman' })],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Расчёт выполнен в соответствии с СП 20.13330.2016 «Нагрузки и воздействия» для снегового района III (Московская область). Данный расчёт является предварительным и не заменяет полноценный инженерный расчёт с сертификацией. Углы запила указаны как угол между элементом и поясом фермы в точке соединения.',
        size: 16, font: 'Times New Roman', italics: true, color: '6b7280',
      })],
      spacing: { after: 200 },
    }),
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } },
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}

function createLoadsTable(loads: LoadResult, safetyFactor: number): Table {
  const header = new TableRow({
    children: [
      createHeaderCell('Вид нагрузки', 35),
      createHeaderCell('Нормативная (кг/м²)', 20),
      createHeaderCell('Расчётная (кг/м²)', 20),
      createHeaderCell('Доля (%)', 12),
      ...(safetyFactor > 0 ? [createHeaderCell('Коэфф. γf', 13)] : []),
    ].slice(0, 5),
  });

  const totalNorm = loads.totalLoadNormative || 1;
  const rows = [
    { name: 'Снеговая нагрузка', norm: loads.snowLoadNormative, design: loads.snowLoadDesign, gf: 1.4 },
    { name: 'Ветровая нагрузка', norm: loads.windLoadNormative, design: loads.windLoadDesign, gf: 1.4 },
    { name: 'Собственный вес', norm: loads.deadLoadNormative, design: loads.deadLoadDesign, gf: 1.1 },
  ];

  const dataRows = rows.map((r, i) =>
    new TableRow({
      children: [
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: r.name, size: 18, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: r.norm.toFixed(1), size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: r.design.toFixed(1), size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: `${Math.round(r.design / totalNorm * 100)}%`, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: r.gf.toFixed(1), size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
      ],
    })
  );

  const totalRow = new TableRow({
    children: [
      new TableCell({
        shading: { fill: 'e2e8f0', type: ShadingType.SOLID, color: 'e2e8f0' },
        children: [new Paragraph({ children: [new TextRun({ text: 'ИТОГО', bold: true, size: 18, font: 'Times New Roman' })] })],
      }),
      new TableCell({
        shading: { fill: 'e2e8f0', type: ShadingType.SOLID, color: 'e2e8f0' },
        children: [new Paragraph({ children: [new TextRun({ text: loads.totalLoadNormative.toFixed(1), bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        shading: { fill: 'e2e8f0', type: ShadingType.SOLID, color: 'e2e8f0' },
        children: [new Paragraph({ children: [new TextRun({ text: loads.totalLoadDesign.toFixed(1), bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        shading: { fill: 'e2e8f0', type: ShadingType.SOLID, color: 'e2e8f0' },
        children: [new Paragraph({ children: [new TextRun({ text: '100%', bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        shading: { fill: 'e2e8f0', type: ShadingType.SOLID, color: 'e2e8f0' },
        children: [new Paragraph({ children: [new TextRun({ text: '—', bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
      }),
    ],
  });

  const trussRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Нагрузка на ферму', bold: true, size: 18, font: 'Times New Roman' })] })],
      }),
      new TableCell({
        columnSpan: 3,
        children: [new Paragraph({ children: [new TextRun({ text: `${loads.loadPerTruss.toFixed(1)} кг`, bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: `k=${safetyFactor}`, bold: true, size: 18, font: 'Times New Roman', color: safetyFactor >= 1.0 ? '059669' : 'dc2626' })], alignment: AlignmentType.CENTER })],
      }),
    ],
  });

  return new Table({
    rows: [header, ...dataRows, totalRow, trussRow],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function createMaterialTable(materials: MaterialItem[]): Table {
  const header = new TableRow({
    children: [
      createHeaderCell('№', COL_WIDTHS.NUM),
      createHeaderCell('Наименование', COL_WIDTHS.NAME),
      createHeaderCell('Профиль', COL_WIDTHS.PROFILE),
      createHeaderCell('Кол-во', COL_WIDTHS.COUNT),
      createHeaderCell('Вес (кг)', COL_WIDTHS.WEIGHT),
      createHeaderCell('Цена (руб)', COL_WIDTHS.TOTAL),
    ],
  });

  const dataRows = materials.map((m, i) =>
    new TableRow({
      children: [
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: `${i + 1}`, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: m.name, size: 18, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: m.profileName, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: `${m.count}`, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: m.totalWeight.toFixed(1), size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: m.totalPrice.toFixed(0), size: 18, font: 'Times New Roman' })], alignment: AlignmentType.RIGHT })],
        }),
      ],
    })
  );

  const totalW = materials.reduce((s, m) => s + m.totalWeight, 0);
  const totalP = materials.reduce((s, m) => s + m.totalPrice, 0);
  const totalRow = new TableRow({
    children: [
      new TableCell({ columnSpan: 4, shading: { fill: 'e2e8f0', type: ShadingType.SOLID, color: 'e2e8f0' }, children: [new Paragraph({ children: [new TextRun({ text: 'ИТОГО', bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.RIGHT })] }),
      new TableCell({ shading: { fill: 'e2e8f0', type: ShadingType.SOLID, color: 'e2e8f0' }, children: [new Paragraph({ children: [new TextRun({ text: totalW.toFixed(1), bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
      new TableCell({ shading: { fill: 'e2e8f0', type: ShadingType.SOLID, color: 'e2e8f0' }, children: [new Paragraph({ children: [new TextRun({ text: totalP.toFixed(0), bold: true, size: 18, font: 'Times New Roman' })], alignment: AlignmentType.RIGHT })] }),
    ],
  });

  return new Table({
    rows: [header, ...dataRows, totalRow],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function createElementDetailsTable(details: TrussElementDetail[]): Table {
  const header = new TableRow({
    children: [
      createHeaderCell('№', 5),
      createHeaderCell('Тип элемента', 14),
      createHeaderCell('Длина (мм)', 10),
      createHeaderCell('Угол запила снизу (°)', 12),
      createHeaderCell('Угол запила сверху (°)', 12),
      createHeaderCell('Профиль', 18),
      createHeaderCell('Толщина', 9),
      createHeaderCell('Кол-во (шт)', 9),
    ],
  });

  const typeLabels: Record<string, string> = {
    bottom_chord: 'Нижний пояс',
    top_chord: 'Верхний пояс',
    vertical: 'Вертикальная стойка',
    diagonal: 'Диагональный раскос',
  };

  const dataRows = details.map((d, i) =>
    new TableRow({
      children: [
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: `${i + 1}`, size: 16, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: `${typeLabels[d.elementType] || d.elementType} (${d.elementLabel})`, size: 16, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: `${d.length}`, size: 16, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: `${d.bottomCutAngle}°`, size: 16, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: `${d.topCutAngle}°`, size: 16, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: d.profileName, size: 16, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: d.profileThickness, size: 16, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: i % 2 === 0 ? { fill: 'f1f5f9', type: ShadingType.SOLID, color: 'f1f5f9' } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: `${d.quantity}`, bold: d.quantity > 1, size: 16, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })],
        }),
      ],
    })
  );

  const totalItems = details.reduce((s, d) => s + d.quantity, 0);
  const totalRow = new TableRow({
    children: [
      new TableCell({ columnSpan: 7, shading: { fill: 'e2e8f0', type: ShadingType.SOLID, color: 'e2e8f0' }, children: [new Paragraph({ children: [new TextRun({ text: `ИТОГО элементов (с учётом одинаковых):`, bold: true, size: 16, font: 'Times New Roman' })], alignment: AlignmentType.RIGHT })] }),
      new TableCell({ shading: { fill: 'e2e8f0', type: ShadingType.SOLID, color: 'e2e8f0' }, children: [new Paragraph({ children: [new TextRun({ text: `${totalItems}`, bold: true, size: 16, font: 'Times New Roman' })], alignment: AlignmentType.CENTER })] }),
    ],
  });

  return new Table({
    rows: [header, ...dataRows, totalRow],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}
