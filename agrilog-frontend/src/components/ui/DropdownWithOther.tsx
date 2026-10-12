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
  onAddCustomOption?: (value: string) => void;
  onDeleteCustomOption?: (value: string) => void;
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
  onAddCustomOption,
  onDeleteCustomOption,
  placeholder = '—',
  className,
  style,
  maxLength,
  disabled = false,
}: DropdownWithOtherProps) {
  const isInvalidPlaceholder = value === 'Chưa đặt tên' || value === '—' || !value;
  const cleanValue = isInvalidPlaceholder ? '' : value;
  const [showInput, setShowInput] = useState(false);
  const [localText, setLocalText] = useState(cleanValue);
  const [committedValue, setCommittedValue] = useState<string | null>(null);
  const isCommittingRef = useRef(false);

  useEffect(() => {
    const curClean = value === 'Chưa đặt tên' || value === '—' || !value ? '' : value;
    setLocalText(curClean);
    if (committedValue && curClean === committedValue) {
      setCommittedValue(null);
    }
  }, [value, committedValue]);

  const commitCustomValue = (inputToCommit?: string) => {
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;
    setTimeout(() => {
      isCommittingRef.current = false;
    }, 300);

    const rawVal = inputToCommit !== undefined ? inputToCommit : localText;
    const trimmed = (rawVal || '').trim();
    if (!trimmed || trimmed === '—') {
      setShowInput(false);
      setCommittedValue('');
      onChange('');
      if (onBlur) setTimeout(onBlur, 100);
    } else {
      setShowInput(false);
      setCommittedValue(trimmed);
      onChange(trimmed);
      if (onAddCustomOption) {
        onAddCustomOption(trimmed);
      }
      if (onBlur) setTimeout(onBlur, 100);
    }
  };

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
          value={localText}
          maxLength={maxLength}
          onChange={(e: any) => {
            setLocalText(e.target.value);
          }}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitCustomValue(e.target.value);
            }
          }}
          onBlur={(e: any) => {
            commitCustomValue(e.target.value);
          }}
          placeholder="Nhập tên mới..."
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setShowInput(false);
            setLocalText(cleanValue);
            setCommittedValue(null);
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

  // Active value prioritizes cleanValue from prop or newly committed local value
  const activeValue = cleanValue || committedValue || '';

  // Ensure current activeValue is always in the options list so CustomSelect displays it immediately
  const hasValueInOptions = options.some((opt) => opt === activeValue);
  const effectiveOptions =
    activeValue && !hasValueInOptions && activeValue !== '__OTHER__'
      ? [activeValue, ...options]
      : options;

  const selectOptions = [
    ...effectiveOptions.map((opt) => ({
      label: opt,
      value: opt,
      isRemovable: opt !== 'Chủ hộ' && Boolean(onDeleteCustomOption),
    })),
    { label: '✏️ Khác (Nhập tay)...', value: '__OTHER__', isRemovable: false },
  ];

  return (
    <CustomSelect
      style={{ ...style, padding: 0, border: 'none', background: 'transparent' }}
      className={className}
      value={activeValue}
      onChange={(val) => {
        if (val === '__OTHER__') {
          setShowInput(true);
          setLocalText('');
          // Do NOT trigger onBlur when toggling input mode
        } else {
          setShowInput(false);
          setCommittedValue(null);
          onChange(val);
          if (onBlur) setTimeout(onBlur, 100);
        }
      }}
      onDeleteOption={onDeleteCustomOption}
      options={selectOptions}
      placeholder={placeholder}
    />
  );
}
