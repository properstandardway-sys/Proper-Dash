import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon,
  className = '',
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
        {label}
        {props.required && <span className="text-[#C9A84C] ml-1">*</span>}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7D8F]">
          {icon}
        </div>
      )}
      <input
        className={`
          w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#3D3D3D]
          placeholder:text-[#6B7D8F]
          focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent
          disabled:bg-[#FAF7F2] disabled:cursor-not-allowed
          transition-all duration-150
          ${error ? 'border-red-400' : 'border-[#F0EDE6]'}
          ${icon ? 'pl-10' : ''}
          ${className}
        `}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    {hint && !error && <p className="mt-1 text-xs text-[#6B7D8F]">{hint}</p>}
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label, error, hint, className = '', ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">
        {label}
        {props.required && <span className="text-[#C9A84C] ml-1">*</span>}
      </label>
    )}
    <textarea
      className={`
        w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#3D3D3D]
        placeholder:text-[#6B7D8F] resize-none
        focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent
        disabled:bg-[#FAF7F2] disabled:cursor-not-allowed
        transition-all duration-150
        ${error ? 'border-red-400' : 'border-[#F0EDE6]'}
        ${className}
      `}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    {hint && !error && <p className="mt-1 text-xs text-[#6B7D8F]">{hint}</p>}
  </div>
);