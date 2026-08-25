import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import type { GeoCity, GeoDirection } from '@/lib/geo/cities';
import { DIRECTION_LABELS } from '@/lib/geo/cities';

interface CityGridProps {
  cities: GeoCity[];
  groupByDirection?: boolean;
  currentSlug?: string;
}

export default function CityGrid({ cities, groupByDirection = false, currentSlug }: CityGridProps) {
  if (!groupByDirection) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cities.map((city) => (
          <CityLink key={city.slug} city={city} current={city.slug === currentSlug} />
        ))}
      </div>
    );
  }

  const directions: GeoDirection[] = ['east', 'southeast', 'south'];

  return (
    <div className="space-y-8">
      {directions.map((direction) => {
        const directionCities = cities.filter((c) => c.direction === direction);
        if (directionCities.length === 0) return null;
        return (
          <div key={direction}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {DIRECTION_LABELS[direction].name}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {directionCities.map((city) => (
                <CityLink key={city.slug} city={city} current={city.slug === currentSlug} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CityLink({ city, current }: { city: GeoCity; current?: boolean }) {
  if (current) {
    return (
      <span className="flex items-center justify-between p-4 rounded-xl border bg-secondary/50 font-medium">
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          {city.name}
        </span>
        <span className="text-xs text-muted-foreground">вы здесь</span>
      </span>
    );
  }

  return (
    <Link
      href={`/zabory-navesy/${city.slug}`}
      className="flex items-center justify-between p-4 rounded-xl border hover:border-primary/50 hover:bg-secondary/30 transition-colors group"
    >
      <span className="flex items-center gap-2 font-medium group-hover:text-primary transition-colors">
        <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        {city.name}
      </span>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}
