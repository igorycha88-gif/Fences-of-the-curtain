import React from 'react';

interface MobileCardField {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

interface MobileCardProps {
  title: React.ReactNode;
  fields: MobileCardField[];
  actions?: React.ReactNode;
  onClick?: () => void;
  badge?: React.ReactNode;
}

export function MobileCard({ title, fields, actions, onClick, badge }: MobileCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-4 ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {typeof title === 'string' ? (
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          ) : (
            title
          )}
        </div>
        {badge && <div className="ml-2 flex-shrink-0">{badge}</div>}
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={index} className={field.fullWidth ? '' : 'grid grid-cols-2 gap-2'}>
            {field.fullWidth ? (
              <div>
                <span className="text-xs text-gray-500 block">{field.label}</span>
                <div className="text-sm text-gray-900 mt-0.5">{field.value}</div>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-xs text-gray-500 block">{field.label}</span>
                  <div className="text-sm text-gray-900 mt-0.5">{field.value}</div>
                </div>
                {fields[index + 1] && !fields[index + 1].fullWidth && (
                  <div>
                    <span className="text-xs text-gray-500 block">{fields[index + 1].label}</span>
                    <div className="text-sm text-gray-900 mt-0.5">{fields[index + 1].value}</div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {actions && (
        <div className="mt-3 pt-3 border-t flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
