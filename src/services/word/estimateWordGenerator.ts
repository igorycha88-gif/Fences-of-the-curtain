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
  PageBreak,
  ShadingType,
} from 'docx';
import { LEGAL_REQUISITES, BUSINESS_INFO } from '@/lib/seo/constants';
import logger from '@/lib/logger';

export interface WordEstimateItem {
  name: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface WordEstimateSection {
  fenceTypeName: string;
  length: number;
  height: number;
  lagRows: number;
  coatingLabel: string;
  picketMountingType?: 'SINGLE' | 'CHESS' | string | null;
  picketStep?: number | null;
  picketProfileType?: string | null;
  picketCoatingName?: string | null;
  meshCoating?: string | null;
  meshCellSize?: number | null;
  meshWireThickness?: number | null;
  automationName?: string | null;
  hasGate: boolean;
  gateTypeLabel: string | null;
  gateLength: number | null;
  hasWicket: boolean;
  wicketWidth: number | null;
  materials: WordEstimateItem[];
  works: WordEstimateItem[];
  materialsTotal: number;
  installationTotal: number;
  grandTotal: number;
  promotion?: {
    name: string;
    discountType: string;
    discountPercent: number;
    discountTotal: number;
    totalBeforeDiscount: number;
  } | null;
}

export interface WordEstimateData {
  orderId: string;
  clientName: string;
  createdAt: string;
  measurementAddress: string | null;
  estimates: WordEstimateSection[];
  totalMaterials: number;
  totalInstallation: number;
  grandTotal: number;
}

const COL_WIDTHS = {
  NUM: 6,
  NAME: 48,
  UNIT: 8,
  QTY: 10,
  PRICE: 14,
  TOTAL: 14,
};

const BORDER_TABLE = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

const BORDER_BOTTOM_BOLD = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 3, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

const formatPrice = (price: number): string => {
  return price.toLocaleString('ru-RU');
};

const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

function createHeaderCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: 'E8E8E8' },
    borders: BORDER_BOTTOM_BOLD,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });
}

function createDataCell(text: string, width: number, alignment: Align = AlignmentType.LEFT): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    borders: BORDER_TABLE,
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20, font: 'Times New Roman' })],
        alignment,
      }),
    ],
  });
}

function createBoldCell(text: string, width: number, alignment: Align = AlignmentType.LEFT): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    borders: BORDER_TABLE,
    shading: { type: ShadingType.SOLID, color: 'F2F2F2' },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, font: 'Times New Roman' })],
        alignment,
      }),
    ],
  });
}

function createTotalRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      createBoldCell(label, COL_WIDTHS.NUM + COL_WIDTHS.NAME + COL_WIDTHS.UNIT + COL_WIDTHS.QTY, AlignmentType.RIGHT),
      createBoldCell('', COL_WIDTHS.PRICE),
      createBoldCell(value, COL_WIDTHS.TOTAL, AlignmentType.RIGHT),
    ],
  });
}

function createItemsTable(items: WordEstimateItem[]): TableRow[] {
  const rows: TableRow[] = [];
  let rowNum = 1;

  for (const item of items) {
    rows.push(
      new TableRow({
        children: [
          createDataCell(String(rowNum), COL_WIDTHS.NUM, AlignmentType.CENTER),
          createDataCell(item.name, COL_WIDTHS.NAME),
          createDataCell(item.unit, COL_WIDTHS.UNIT, AlignmentType.CENTER),
          createDataCell(String(item.quantity), COL_WIDTHS.QTY, AlignmentType.RIGHT),
          createDataCell(formatPrice(item.pricePerUnit), COL_WIDTHS.PRICE, AlignmentType.RIGHT),
          createDataCell(formatPrice(item.totalPrice), COL_WIDTHS.TOTAL, AlignmentType.RIGHT),
        ],
      })
    );
    rowNum++;
  }

  return rows;
}

function createSectionHeaderRow(text: string, color: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnSpan: 6,
        borders: BORDER_TABLE,
        shading: { type: ShadingType.SOLID, color },
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: true, size: 20, font: 'Times New Roman' })],
          }),
        ],
      }),
    ],
  });
}

const PICKET_MOUNTING_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Односторонний',
  CHESS: 'В шахматном порядке',
};

function createEstimateSection(estimate: WordEstimateSection, index: number): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (index > 0) {
    paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Расчет №${index + 1}: ${estimate.fenceTypeName}`,
          bold: true,
          size: 24,
          font: 'Times New Roman',
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  const isMeshEstimate =
    estimate.meshCoating != null || estimate.meshCellSize != null || estimate.meshWireThickness != null;
  const isPicketEstimate =
    estimate.picketMountingType != null || estimate.picketStep != null || estimate.picketProfileType != null;

  const params: string[] = [
    `Длина: ${estimate.length} м`,
    `Высота: ${estimate.height} м`,
  ];

  if (isMeshEstimate) {
    if (estimate.meshCoating) {
      params.push(`Покрытие сетки: ${estimate.meshCoating}`);
    }
    if (estimate.meshCellSize != null) {
      params.push(`Ячейка: ${estimate.meshCellSize} мм`);
    }
    if (estimate.meshWireThickness != null) {
      params.push(`Пруток: ${estimate.meshWireThickness} мм`);
    }
  } else {
    params.push(`Покрытие: ${estimate.coatingLabel}`);
    params.push(`Лаги: ${estimate.lagRows}`);
  }

  if (isPicketEstimate) {
    if (estimate.picketProfileType) {
      params.push(`Профиль: ${estimate.picketProfileType}`);
    }
    if (estimate.picketStep != null) {
      params.push(`Шаг: ${estimate.picketStep} см`);
    }
    if (estimate.picketMountingType) {
      params.push(`Монтаж: ${PICKET_MOUNTING_TYPE_LABELS[estimate.picketMountingType] || estimate.picketMountingType}`);
    }
    if (estimate.picketCoatingName) {
      params.push(`Покрытие штакетника: ${estimate.picketCoatingName}`);
    }
  }

  if (estimate.hasGate && estimate.gateTypeLabel) {
    params.push(`Ворота: ${estimate.gateTypeLabel}${estimate.gateLength ? `, ${estimate.gateLength / 1000} м` : ''}`);
  }
  if (estimate.hasWicket && estimate.wicketWidth) {
    params.push(`Калитка: ${estimate.wicketWidth / 1000} м`);
  }
  if (estimate.automationName) {
    params.push(`Автоматика: ${estimate.automationName}`);
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: params.join(' | '),
          size: 20,
          font: 'Times New Roman',
          italics: true,
        }),
      ],
      spacing: { after: 150 },
    })
  );

  const headerRow = new TableRow({
    children: [
      createHeaderCell('№', COL_WIDTHS.NUM),
      createHeaderCell('Наименование работ и материалов', COL_WIDTHS.NAME),
      createHeaderCell('Ед.изм.', COL_WIDTHS.UNIT),
      createHeaderCell('Кол-во', COL_WIDTHS.QTY),
      createHeaderCell('Цена, руб.', COL_WIDTHS.PRICE),
      createHeaderCell('Сумма, руб.', COL_WIDTHS.TOTAL),
    ],
  });

  const materialRows = createItemsTable(estimate.materials);
  const materialTotalRow = createTotalRow('Итого материалы:', formatPrice(estimate.materialsTotal));

  const workRows = createItemsTable(estimate.works);
  const workTotalRow = createTotalRow('Итого работы:', formatPrice(estimate.installationTotal));

  const grandTotalRow = new TableRow({
    children: [
      createBoldCell('ВСЕГО по расчету:', COL_WIDTHS.NUM + COL_WIDTHS.NAME + COL_WIDTHS.UNIT + COL_WIDTHS.QTY, AlignmentType.RIGHT),
      createBoldCell('', COL_WIDTHS.PRICE),
      createBoldCell(formatPrice(estimate.grandTotal), COL_WIDTHS.TOTAL, AlignmentType.RIGHT),
    ],
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      headerRow,
      createSectionHeaderRow('Материалы', 'E8F0FE'),
      ...materialRows,
      materialTotalRow,
      createSectionHeaderRow('Работы', 'FEF3E0'),
      ...workRows,
      workTotalRow,
      grandTotalRow,
    ],
  });

  paragraphs.push(new Paragraph({ children: [] }));
  paragraphs.push(table as unknown as Paragraph);
  paragraphs.push(new Paragraph({ children: [] }));

  if (estimate.promotion) {
    const discountLabel = estimate.promotion.discountType === 'MATERIALS'
      ? 'на материалы'
      : estimate.promotion.discountType === 'WORKS'
        ? 'на работы'
        : 'на материалы и работы';

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Акция: ${estimate.promotion.name} — скидка ${estimate.promotion.discountPercent}% ${discountLabel}`,
            bold: true,
            size: 20,
            font: 'Times New Roman',
          }),
        ],
        spacing: { before: 100, after: 50 },
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Стоимость без скидки: ${formatPrice(estimate.promotion.totalBeforeDiscount)} руб.`, size: 20, font: 'Times New Roman' }),
        ],
        spacing: { after: 50 },
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Скидка по акции: -${formatPrice(estimate.promotion.discountTotal)} руб.`, size: 20, font: 'Times New Roman', bold: true }),
        ],
        spacing: { after: 50 },
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `ИТОГО со скидкой: ${formatPrice(estimate.grandTotal)} руб.`, size: 22, font: 'Times New Roman', bold: true }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  return paragraphs;
}

function createSummaryTable(data: WordEstimateData): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Сводная таблица по заявке',
          bold: true,
          size: 26,
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    })
  );

  const headerRow = new TableRow({
    children: [
      createHeaderCell('Показатель', 70),
      createHeaderCell('Сумма, руб.', 30),
    ],
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      headerRow,
      new TableRow({
        children: [
          createDataCell('Итого материалы', 70),
          createDataCell(formatPrice(data.totalMaterials), 30, AlignmentType.RIGHT),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Итого работы', 70),
          createDataCell(formatPrice(data.totalInstallation), 30, AlignmentType.RIGHT),
        ],
      }),
      new TableRow({
        children: [
          createBoldCell('ВСЕГО ПО СМЕТЕ', 70),
          createBoldCell(formatPrice(data.grandTotal), 30, AlignmentType.RIGHT),
        ],
      }),
    ],
  });

  paragraphs.push(table as unknown as Paragraph);
  paragraphs.push(new Paragraph({ children: [] }));

  return paragraphs;
}

function createSignatures(): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], spacing: { before: 600 } }));

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Подрядчик: __________ / __________________ /', size: 20, font: 'Times New Roman' }),
      ],
      spacing: { after: 100 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'М.П.', size: 20, font: 'Times New Roman' }),
        new TextRun({ text: '                                                                     ', size: 20, font: 'Times New Roman' }),
        new TextRun({ text: 'Заказчик: __________ / __________________ /', size: 20, font: 'Times New Roman' }),
      ],
      spacing: { after: 300 },
    })
  );

  return paragraphs;
}

function createRequisites(): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Реквизиты подрядчика:',
          bold: true,
          size: 18,
          font: 'Times New Roman',
        }),
      ],
      spacing: { before: 400, after: 60 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: LEGAL_REQUISITES.fullName, size: 18, font: 'Times New Roman' })],
      spacing: { after: 40 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `ИНН: ${LEGAL_REQUISITES.inn} · ОГРНИП: ${LEGAL_REQUISITES.ogrnip}`,
          size: 18,
          font: 'Times New Roman',
        }),
      ],
      spacing: { after: 40 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Тел.: ${BUSINESS_INFO.telephoneDisplay} · E-mail: ${BUSINESS_INFO.email}`,
          size: 18,
          font: 'Times New Roman',
        }),
      ],
      spacing: { after: 0 },
    })
  );

  return paragraphs;
}

export async function generateEstimateWord(data: WordEstimateData): Promise<Buffer> {
  logger.info('Word estimate generation started', {
    module: 'estimateWordGenerator',
    orderId: data.orderId,
    sections: data.estimates.length,
  });

  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: LEGAL_REQUISITES.shortName,
          bold: true,
          size: 24,
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.LEFT,
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Дата: ${formatDate(data.createdAt)}`, size: 20, font: 'Times New Roman' }),
        new TextRun({ text: '                              ', size: 20, font: 'Times New Roman' }),
        new TextRun({ text: `Заказчик: ${data.clientName}`, size: 20, font: 'Times New Roman' }),
      ],
      spacing: { after: 300 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `СМЕТА № ${data.orderId.slice(0, 8).toUpperCase()}`,
          bold: true,
          size: 30,
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'на выполнение работ по устройству ограждения',
          size: 24,
          font: 'Times New Roman',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Основание: ', bold: true, size: 20, font: 'Times New Roman' }),
        new TextRun({ text: `Заявка #${data.orderId.slice(0, 8)} от ${formatDate(data.createdAt)}`, size: 20, font: 'Times New Roman' }),
      ],
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Объект: ', bold: true, size: 20, font: 'Times New Roman' }),
        new TextRun({
          text: data.measurementAddress || 'по адресу Заказчика',
          size: 20,
          font: 'Times New Roman',
        }),
      ],
      spacing: { after: 300 },
    })
  );

  for (let i = 0; i < data.estimates.length; i++) {
    const sectionParagraphs = createEstimateSection(data.estimates[i], i);
    children.push(...sectionParagraphs);
  }

  if (data.estimates.length > 1) {
    const summaryParagraphs = createSummaryTable(data);
    children.push(...summaryParagraphs);
  }

  children.push(...createSignatures());
  children.push(...createRequisites());

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = Buffer.from(await Packer.toBuffer(doc));

  logger.info('Word estimate generation finished', {
    module: 'estimateWordGenerator',
    orderId: data.orderId,
    sizeBytes: buffer.length,
  });

  return buffer;
}
