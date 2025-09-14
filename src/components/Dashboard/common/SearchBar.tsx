import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  isSearching?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Search Appointment, Patient or etc...",
  isSearching = false
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999999]" size={16} />
      <input
        type="text"
        placeholder={placeholder}
        className="pl-10 pr-4 py-2 border border-[#E0E0E0] rounded-lg focus:ring-2 focus:ring-[#28542F] focus:border-transparent text-sm"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;