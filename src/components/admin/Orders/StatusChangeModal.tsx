'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { STATUS_LABELS, StatusChangeData } from '@/lib/validators/order';
import { EstimateApprovalForm } from './StatusChangeForms/EstimateApprovalForm';
import { MeasurementForm } from './StatusChangeForms/MeasurementForm';
import { ProductionForm } from './StatusChangeForms/ProductionForm';
import { InstallationForm } from './StatusChangeForms/InstallationForm';
import { CompletedForm } from './StatusChangeForms/CompletedForm';
import { CancelledForm } from './StatusChangeForms/CancelledForm';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  currentStatus: string;
  newStatus: string;
  onSuccess: () => void;
}

export function StatusChangeModal({
  isOpen,
  onClose,
  orderId,
  currentStatus,
  newStatus,
  onSuccess,
}: StatusChangeModalProps) {
  const [data, setData] = useState<StatusChangeData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setData({});
      setErrors({});
    }
  }, [isOpen, newStatus]);

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    console.log('[StatusChangeModal] Submitting status change:', {
      orderId,
      currentStatus,
      newStatus,
      data,
    });

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          data,
        }),
      });

      const result = await res.json();
      
      console.log('[StatusChangeModal] Response:', { status: res.status, result });

      if (!res.ok) {
        if (result.details) {
          setErrors(result.details);
        } else {
          setErrors({ general: result.error || result.message || 'Ошибка обновления' });
        }
        return;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('[StatusChangeModal] Error:', error);
      setErrors({ general: 'Ошибка соединения' });
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    const transitionKey = `${currentStatus}->${newStatus}`;

    switch (transitionKey) {
      case 'NEW->ESTIMATE_APPROVAL':
        return (
          <EstimateApprovalForm
            data={data}
            onChange={setData}
            errors={errors}
          />
        );
      case 'ESTIMATE_APPROVAL->MEASUREMENT':
        return (
          <MeasurementForm
            data={data}
            onChange={setData}
            errors={errors}
          />
        );
      case 'MEASUREMENT->PRODUCTION':
        return (
          <ProductionForm
            data={data}
            onChange={setData}
            errors={errors}
          />
        );
      case 'PRODUCTION->INSTALLATION':
        return (
          <InstallationForm
            data={data}
            onChange={setData}
            errors={errors}
          />
        );
      case 'INSTALLATION->COMPLETED':
        return (
          <CompletedForm
            data={data}
            onChange={setData}
            errors={errors}
          />
        );
      default:
        if (newStatus === 'CANCELLED') {
          return (
            <CancelledForm
              data={data}
              onChange={setData}
              errors={errors}
            />
          );
        }
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Смена статуса заявки #${orderId.slice(0, 8)}`}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 bg-gray-100 rounded">
            {STATUS_LABELS[currentStatus]}
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
            {STATUS_LABELS[newStatus]}
          </span>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {errors.general}
          </div>
        )}

        {renderForm()}

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
