import { Banknote, Clock, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { AnimatedSection } from '@/hooks/useScrollReveal';

interface CommercialFactorsProps {
  className?: string;
}

const factors = [
  {
    icon: Banknote,
    value: 'от 2 600 ₽/м',
    label: 'Цена за метр',
  },
  {
    icon: Clock,
    value: 'от 1 дня',
    label: 'Срок монтажа',
  },
  {
    icon: ShieldCheck,
    value: '1 год',
    label: 'Гарантия по договору',
  },
  {
    icon: Truck,
    value: 'Бесплатно',
    label: 'Замер при заказе услуги',
  },
  {
    icon: CreditCard,
    value: 'Любая оплата',
    label: 'Нал, карта, перевод, рассрочка',
  },
];

export default function CommercialFactors({ className }: CommercialFactorsProps) {
  return (
    <section className={`py-12 px-4 bg-secondary/30 ${className || ''}`}>
      <div className="container mx-auto">
        <AnimatedSection animation="fade-in-up">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {factors.map((factor, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 text-center border hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <factor.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-base font-bold text-gray-900">{factor.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{factor.label}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
