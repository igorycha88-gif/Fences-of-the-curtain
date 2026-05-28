'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowRight, Warehouse, Shield, Thermometer, Truck } from 'lucide-react';
import GarageOrderModal from './GarageOrderModal';

export default function GarageBanner() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="py-20 px-4 bg-secondary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container mx-auto relative z-10">
          <div className="glass card-modern rounded-2xl overflow-hidden max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto md:min-h-[420px]">
                <Image
                  src="/images/garage-sandwich.jpg"
                  alt="Гараж из сендвич-панелей под ключ"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 md:bg-gradient-to-l md:from-transparent md:to-background/5" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    Новая услуга
                  </span>
                </div>
              </div>

              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Warehouse className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Гаражи под ключ</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Гараж из сендвич-панелей
                </h2>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Надёжный утеплённый гараж из сендвич-панелей с воротами и фундаментом. 
                  Быстрое возведение, энергоэффективность и долговечность.
                </p>

                <div className="mb-2">
                  <span className="text-lg text-muted-foreground line-through">от 1 450 000 ₽</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl md:text-4xl font-bold text-primary">от 1 250 000 ₽</span>
                  <span className="text-muted-foreground text-sm">Гараж 6×6</span>
                </div>
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                    Акция до конца июня 2026
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { icon: Shield, label: 'Гарантия' },
                    { icon: Thermometer, label: 'Утепление' },
                    { icon: Truck, label: 'Под ключ' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Icon className="w-4 h-4 text-primary" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setModalOpen(true)}
                  className="btn-primary inline-flex items-center justify-center gap-2 text-base px-6 py-3.5 w-fit"
                >
                  Оставить заявку
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GarageOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </>
  );
}
