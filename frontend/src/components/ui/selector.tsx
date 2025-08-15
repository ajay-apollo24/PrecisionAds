import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectorOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectorOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function Selector({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className,
  error = false
}: SelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectorOption | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the selected option based on value
  useEffect(() => {
    if (value) {
      const option = options.find(opt => opt.value === value);
      setSelectedOption(option || null);
    } else {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (option: SelectorOption) => {
    if (option.disabled) return;
    
    setSelectedOption(option);
    onValueChange?.(option.value);
    setIsOpen(false);
  };

  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md transition-colors",
          "bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          disabled && "bg-gray-100 cursor-not-allowed opacity-60",
          error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300",
          isOpen && "border-blue-500 ring-2 ring-blue-500"
        )}
      >
        <span className={cn(
          "truncate",
          !selectedOption && "text-gray-500"
        )}>
          {displayText}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              No options available
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left transition-colors flex items-center justify-between",
                  "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                  option.disabled && "text-gray-400 cursor-not-allowed hover:bg-transparent",
                  option.value === value && "bg-blue-50 text-blue-900 hover:bg-blue-100"
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
} 