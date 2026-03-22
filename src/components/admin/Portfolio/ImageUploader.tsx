'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { getThumbnailUrl } from '@/lib/utils/imageUrl';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images,  onChange,
  maxImages = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 5 * 1024 * 1024;
      
      if (!validTypes.includes(file.type)) {
        alert(`Неподдерживаемый формат файла: ${file.name}`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`Файл слишком большой: ${file.name}. Максимум 5 MB`);
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > maxImages) {
      alert(`Максимум ${maxImages} изображений`);
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of validFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/portfolio/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.url);
        } else {
          const error = await res.json();
          alert(error.message || 'Ошибка загрузки');
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки изображений');
    } finally {
      setUploading(false);
    }
  }, [images, onChange, maxImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleRemove = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((image, index) => (
          <div
            key={image}
            className="relative group"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', String(index));
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
              if (fromIndex !== index) {
                handleMove(fromIndex, index);
              }
            }}
          >
            <img
              src={getThumbnailUrl(image)}
              alt={`Изображение ${index + 1}`}
              className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {index === 0 ? 'Главное' : `#${index + 1}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label
            className={`w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">Добавить</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Перетащите изображения для изменения порядка. Первое изображение — главное.
        <br />
        JPEG, PNG, WebP, GIF. Максимум 5 MB.
      </p>
    </div>
  );
}
