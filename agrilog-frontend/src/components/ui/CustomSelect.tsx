'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string; disabled?: boolean; suffix?: string }[];
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = '-- Chọn --',
  style,
  className
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 200),
      });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const dropdown = isOpen ? (
    <div
      style={{
        position: 'absolute',
        top: dropdownPos.top,
        left: dropdownPos.left,
        zIndex: 9999,
        minWidth: dropdownPos.width,
        maxWidth: '380px',
        maxHeight: '260px',
        overflowY: 'auto',
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -3px rgba(0,0,0,0.15), 0 4px 8px -2px rgba(0,0,0,0.08)',
      }}
    >
      {options.map((opt) => (
        <div
          key={opt.value}
          onMouseDown={(e) => {
            e.preventDefault();
            if (!opt.disabled) {
              onChange(opt.value);
              setIsOpen(false);
            }
          }}
          style={{
            padding: '9px 12px',
            fontSize: '0.875rem',
            cursor: opt.disabled ? 'not-allowed' : 'pointer',
            background: value === opt.value ? '#eff6ff' : 'transparent',
            color: opt.disabled ? '#9ca3af' : '#111827',
            borderBottom: '1px solid #f3f4f6',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '4px',
          }}
          onMouseEnter={(e) => {
            if (!opt.disabled && value !== opt.value) {
              e.currentTarget.style.background = '#f0f9ff';
            }
          }}
          onMouseLeave={(e) => {
            if (!opt.disabled && value !== opt.value) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <span style={{ flex: 1 }}>{opt.label}</span>
          {opt.suffix && (
            <span style={{ color: opt.disabled ? '#ef4444' : '#d97706', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {opt.suffix}
            </span>
          )}
        </div>
      ))}
      {options.length === 0 && (
        <div style={{ padding: '12px', fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center' }}>
          Không có lựa chọn nào
        </div>
      )}
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', ...style }}
      className={className}
    >
      <div
        ref={triggerRef}
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          minHeight: '32px',
          padding: '5px 26px 5px 8px',
          border: '1px solid',
          borderRadius: '6px',
          background: '#f9fafb',
          cursor: 'pointer',
          fontSize: '0.875rem',
          lineHeight: '1.4',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          position: 'relative',
          borderColor: isOpen ? '#3b82f6' : '#e5e7eb',
          boxShadow: isOpen ? '0 0 0 2px rgba(59,130,246,0.15)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span style={{ color: selectedOption ? '#111827' : '#9ca3af', flex: 1, wordBreak: 'break-word' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            position: 'absolute',
            right: '7px',
            top: '50%',
            transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
            color: '#6b7280',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </div>

      {typeof window !== 'undefined' && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
