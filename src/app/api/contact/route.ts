import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = contactFormSchema.parse(body);

    console.log('Contact form submitted:', validatedData);

    return NextResponse.json(
      { success: true, message: 'Заявка отправлена' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error('Contact form error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Ошибка отправки заявки' },
      { status: 500 }
    );
  }
}
