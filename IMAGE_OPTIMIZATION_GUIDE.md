# Next.js Image Optimization Guide

## Next.js Image Component

Use the optimized Next.js Image component instead of the HTML `<img>` tag:

```tsx
import Image from 'next/image';

export default function PortfolioGallery({ images }) {
  return (
    <div className="grid">
      {images.map((image) => (
        <div key={image.id} className="card">
          <Image
            src={image.url}
            alt={image.alt}
            width={800}
            height={600}
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, (max-width: 1920px) 33vw"
            placeholder="blur"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
```

## Configuration (next.config.js)

Add image optimization settings:

```javascript
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zabor-i-naves.ru',
        pathname: '/portfolio/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/uploads/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## Image Optimization Best Practices

### 1. Use Appropriate File Formats

- **AVIF** - Smallest size, highest quality
- **WebP** - Better compression than JPEG/PNG
- **JPEG/PNG** - Fallback for older browsers

```tsx
// next.config.js
formats: ['image/avif', 'image/webp']
```

### 2. Responsive Images

Use multiple sizes and breakpoints:

```tsx
// Example sizes for responsive images
const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384];

// In component
<Image
  width={800}
  height={600}
  priority
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
/>
```

### 3. Lazy Loading

Load images only when needed:

```tsx
<Image
  loading="lazy"
  placeholder="blur"
  src={imageUrl}
  alt="Description"
/>
```

### 4. Image Caching

Set appropriate cache headers:

```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.png|.jpg|.jpeg|.webp|.avif)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        {
          key: 'Vary',
          value: 'Accept',
        },
      ],
    },
  ];
}
```

### 5. Remote Images

Configure remote images properly:

```javascript
// next.config.js
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'zabor-i-naves.ru',
    pathname: '/portfolio/**',
  },
  {
    protocol: 'https',
    hostname: 'cdn.example.com',
    pathname: '/uploads/**',
  },
],
```

### 6. Image Pre-processing

Before uploading, optimize images:

```bash
# Install sharp for image processing
npm install sharp

# Pre-process images (resize, convert format, optimize)
node scripts/optimize-images.js
```

Example script:

```javascript
// scripts/optimize-images.js
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function optimizeImage(inputPath, outputPath) {
  await sharp(inputPath)
    .rotate() // Auto-rotate based on EXIF data
    .resize(1920, null, { // Resize to max width
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 }) // Convert to WebP
    .toFile(outputPath);
}
```

### 7. Placeholder Images

Use blurred placeholders while loading:

```tsx
<Image
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..." // Base64 encoded 1x1 pixel SVG
  src={imageUrl}
  alt="Description"
/>
```

Generate placeholder:

```bash
# Generate base64 placeholder
node scripts/generate-placeholder.js
```

## Performance Tips

### Before Optimization

- ❌ Large unoptimized images (500KB - 5MB)
- ❌ No lazy loading
- ❌ Single format (JPEG only)
- ❌ No responsive sizes
- ❌ No caching headers

### After Optimization

- ✅ Optimized formats (AVIF + WebP)
- ✅ Lazy loading for below-the-fold images
- ✅ Multiple responsive sizes
- ✅ Browser-negotiated content (Vary header)
- ✅ Long-term caching (max-age=31536000)
- ✅ Progressive loading with blur placeholder

## Implementation Example

### Complete Component

```tsx
// src/components/portfolio/OptimizedImageGallery.tsx
import Image from 'next/image';

interface OptimizedImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

export default function OptimizedImageGallery({ images }: { images: OptimizedImage[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image) => (
        <div key={image.id} className="relative">
          <Image
            src={image.url}
            alt={image.alt}
            width={image.width}
            height={image.height}
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, (max-width: 1920px) 33vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3b3gAAAAAAElEQVR42mPb9ybmRpb6QAAAAPklEQVR42mPb9ybmQAAAABJRU5ErkJggg=="
            loading="lazy"
            className="rounded-lg shadow-lg"
          />
          
          <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 text-white text-xs rounded">
            {image.width}x{image.height}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Monitoring

Track image performance with Vercel Analytics:

```typescript
import { trackEvent } from '@/lib/analytics';

// Track image load times
export function trackImageLoad(imageId: string, loadTime: number) {
  trackEvent('image_loaded', {
    image_id: imageId,
    load_time_ms: loadTime,
    image_size_kb: calculateImageSizeKB(imageId),
  });
}

// Track cache hits
export function trackImageCache(imageId: string, cached: boolean) {
  trackEvent('image_cache_hit', {
    image_id: imageId,
    cached: cached,
  });
}
```

## CDN Integration

For optimal performance, use CDN:

```javascript
// next.config.js
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'cdn.example.com', // Your CDN domain
    pathname: '/portfolio/**',
  },
],
```

## Tools

### Image Optimization Tools

- **Squoosh** - Command-line tool for image optimization
- **Sharp** - Node.js library for image processing (already installed)
- **ImageMagick** - Alternative image processing library

### Online Tools

- **Squoosh.app** - Online image optimizer
- **TinyPNG** - Online PNG compressor
- **ImageOptim.com** - Batch image optimization
- **Cloudinary** - Cloud-based image optimization and CDN

## Migration Steps

1. Update `next.config.js` with optimization settings
2. Create optimized image components
3. Update portfolio/admin components to use Next.js Image
4. Run image optimization script for existing images
5. Add image load time tracking
6. Test with Lighthouse
7. Deploy and verify improvements

## Benefits

- 📉 50-70% reduction in image size
- 🚀 30-50% faster page load times
- 💰 Reduced bandwidth costs
- 📊 Better SEO scores
- 🎯 Improved Core Web Vitals scores

## Resources

- **Next.js Image Optimization:** https://nextjs.org/docs/app/api-reference/components/image
- **Sharp Documentation:** https://sharp.pixelplumbing.com/
- **WebP vs AVIF:** https://developers.google.com/speed/webp/avif
