'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';

export interface City {
  display_name: string;
  name: string;
  country: string;
  lat: string;
  lon: string;
}

interface CitySelectorProps {
  value: string;
  onSelect: (city: City | null) => void;
  placeholder?: string;
}

export function CitySelector({
  value,
  onSelect,
  placeholder = 'Search for a city...',
}: CitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCities(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCities = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=10&` +
        `featuretype=city&` +
        `accept-language=en,he`,
        {
          headers: {
            'User-Agent': 'JobSeekingApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }

      const data = await response.json();
      
      const cities: City[] = data
        .filter((item: any) => {
          const placeType = item.type || '';
          const placeClass = item.class || '';
          return (
            placeType === 'city' ||
            placeClass === 'place' ||
            (item.address && item.address.city)
          );
        })
        .map((item: any) => {
          const cityName = item.address?.city || 
                          item.address?.town || 
                          item.address?.village ||
                          item.name || 
                          item.display_name.split(',')[0];
          const country = item.address?.country || 
                         item.display_name.split(',').pop()?.trim() || 
                         'Unknown';

          return {
            display_name: `${cityName}, ${country}`,
            name: cityName,
            country: country,
            lat: item.lat,
            lon: item.lon,
          };
        })
        .filter((city: City, index: number, self: City[]) => {
          return index === self.findIndex((c) => 
            c.name === city.name && c.country === city.country
          );
        });

      setSuggestions(cities);
      setShowSuggestions(cities.length > 0);
    } catch (error) {
      console.error('Error searching cities:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (city: City) => {
    setSearchQuery(city.display_name);
    setShowSuggestions(false);
    onSelect(city);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect(null);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-600 bg-gray-700 pl-10 pr-10 py-2 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        {searchQuery.length > 0 && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg bg-gray-800 p-4">
          <div className="text-center text-gray-400">Loading...</div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-gray-700 bg-gray-800">
          {suggestions.map((item, index) => (
            <button
              key={`${item.name}-${item.country}-${index}`}
              onClick={() => handleSelectCity(item)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors"
            >
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="flex-1">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && !loading && suggestions.length === 0 && searchQuery.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-700 bg-gray-800 p-4">
          <div className="text-center text-sm text-gray-400">No cities found</div>
        </div>
      )}
    </div>
  );
}

