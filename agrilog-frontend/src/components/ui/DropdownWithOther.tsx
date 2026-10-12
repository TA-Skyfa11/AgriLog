'use client';

import React, { useState, useEffect, useRef } from 'react';
import CustomSelect from './CustomSelect';

const AutoResizeTextarea = (props: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
        if (props.onInput) props.onInput(e);
      }}
      style={{
        minWidth: '120px',
        whiteSpace: 'normal',
        wordBreak: 'normal',
        ...props.style,
        resize: 'none',
        overflow: 'hidden',
      }}
    />
  );
};

interface DropdownWithOtherProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  maxLength?: number;
  disabled?: boolean;
}

export default function DropdownWithOther({
  value,
  options,
  onChange,
  onBlur,
  placeholder = '—',
  className,
  style,
  maxLength,
  disabled = false,
}: DropdownWithOtherProps) {
  const isInvalidPlaceholder = value === 'Chưa đặt tên' || value === '—' || !value;
  const cleanValue = isInvalidPlaceholder ? '' : value;
  const isOther = Boolean(cleanValue && !options.includes(cleanValue) && cleanValue.trim() !== '');
  const [showInput, setShowInput] = useState(isOther);

  useEffect(() => {
    const curClean = value === 'Chưa đặt tên' || value === '—' || !value ? '' : value;
    setShowInput(Boolean(curClean && !options.includes(curClean) && curClean.trim() !== ''));
  }, [value, options]);

  if (disabled) {
    return (
      <div
        style={{
          ...style,
          color: '#9ca3af',
          background: '#f3f4f6',
          cursor: 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
        }}
        className={className}
      >
        {cleanValue || placeholder}
      </div>
    );
  }

  if (showInput) {
    return (
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        <AutoResizeTextarea
          style={{ ...style, paddingRight: '24px' }}
          className={className}
          value={cleanValue}
          maxLength={maxLength}
          onChange={(e: any) => {
            onChange(e.target.value);
          }}
          onBlur={() => {
            if (!cleanValue || cleanValue.trim() === '') {
              setShowInput(false);
              onChange('');
            }
            if (onBlur) onBlur();
          }}
          placeholder="Nhập tùy chỉnh..."
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setShowInput(false);
            onChange('');
          }}
          title="Hủy nhập tay, quay lại danh sách chọn"
          style={{
            position: 'absolute',
            right: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            color: '#9ca3af',
            fontSize: '12px',
            lineHeight: 1,
            borderRadius: '4px',
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  const selectOptions = [
    ...options.map((opt) => ({ label: opt, value: opt })),
    { label: '✏️ Khác (Nhập tay)...', value: '__OTHER__' },
  ];

  return (
    <CustomSelect
      style={{ ...style, padding: 0, border: 'none', background: 'transparent' }}
      className={className}
      value={cleanValue}
      onChange={(val) => {
        if (val === '__OTHER__') {
          setShowInput(true);
          onChange('');
        } else {
          setShowInput(false);
          onChange(val);
        }
        if (onBlur) setTimeout(onBlur, 100);
      }}
      options={selectOptions}
      placeholder={placeholder}
    />
  );
}
