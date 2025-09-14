import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useSearchDebounce = (
  searchTerm: string,
  delay: number = 500,
  minLength: number = 0
) => {
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  const shouldSearch = debouncedSearchTerm.length >= minLength;
  const finalSearchTerm = shouldSearch ? debouncedSearchTerm : '';

  return {
    debouncedSearchTerm: finalSearchTerm,
    isSearching,
    shouldSearch
  };
}; 