import jsPDF from 'jspdf';

export interface PDFData {
  type: 'fence' | 'canopy';
  parameters: any;
  result: {
    materials: Array<{ name: string; quantity: number; unit: string; pricePerUnit: number; total: number }>;
    works: Array<{ name: string; quantity: number; unit: string; pricePerUnit: number; total: number }>;
    materialsTotal: number;
    worksTotal: number;
    grandTotal: number;
  };
}

export function generatePDF(data: PDFData): Blob {
  const doc = new jsPDF();

  let yPos = 20;

  doc.setFontSize(20);
  doc.text(data.type === 'fence' ? 'Расчет забора' : 'Расчет навеса', 20, yPos);
  yPos += 15;

  doc.setFontSize(12);
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, yPos);
  yPos += 10;

  if (data.type === 'fence') {
    doc.text(`Длина: ${data.parameters.length} м`, 20, yPos);
    yPos += 7;
    doc.text(`Высота: ${data.parameters.height} м`, 20, yPos);
    yPos += 7;
    doc.text(`Тип забора: ${data.parameters.fenceType}`, 20, yPos);
    yPos += 7;
    doc.text(`Количество лаг: ${data.parameters.lagRows}`, 20, yPos);
    yPos += 15;
  } else {
    doc.text(`Длина: ${data.parameters.length} м`, 20, yPos);
    yPos += 7;
    doc.text(`Ширина: ${data.parameters.width} м`, 20, yPos);
    yPos += 7;
    doc.text(`Высота: ${data.parameters.height} м`, 20, yPos);
    yPos += 7;
    doc.text(`Тип навеса: ${data.parameters.canopyType}`, 20, yPos);
    yPos += 15;
  }

  doc.setFontSize(14);
  doc.text('Материалы:', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  data.result.materials.forEach((material) => {
    doc.text(`${material.name} (${material.quantity} ${material.unit})`, 20, yPos);
    doc.text(`${material.total.toLocaleString('ru-RU')} ₽`, 150, yPos);
    yPos += 7;
  });

  yPos += 5;
  doc.setFontSize(14);
  doc.text(`Итого материалы: ${data.result.materialsTotal.toLocaleString('ru-RU')} ₽`, 20, yPos);
  yPos += 15;

  doc.setFontSize(14);
  doc.text('Работы:', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  data.result.works.forEach((work) => {
    doc.text(`${work.name} (${work.quantity} ${work.unit})`, 20, yPos);
    doc.text(`${work.total.toLocaleString('ru-RU')} ₽`, 150, yPos);
    yPos += 7;
  });

  yPos += 5;
  doc.setFontSize(14);
  doc.text(`Итого работы: ${data.result.worksTotal.toLocaleString('ru-RU')} ₽`, 20, yPos);
  yPos += 15;

  yPos += 5;
  doc.setFontSize(16);
  doc.setFillColor(221, 221, 221);
  doc.rect(20, yPos, 170, 25, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text(`ИТОГО: ${data.result.grandTotal.toLocaleString('ru-RU')} ₽`, 30, yPos + 15);

  return doc.output('blob');
}
