// Shared Auth Input Components
import { Mail, Lock, User, Shield } from 'lucide-react';

export function MinimalInput({ 
  label, 
  icon, 
  placeholder, 
  type = 'text', 
  onChange, 
  value,
  required = false,
  error = null 
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold ml-1 block">
          {label}
        </label>
      )}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-300 ${
            error
              ? 'border-rose-300 focus:ring-rose-200'
              : 'border-slate-100 focus:ring-indigo-200'
          }`}
        />
      </div>
      {error && <p className="text-[10px] text-rose-600 ml-1">{error}</p>}
    </div>
  );
}

export function Stat({ block, label }) {
  return (
    <div className="space-y-2">
      <p className="text-3xl font-light text-white tracking-tight">{block}</p>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">{label}</p>
    </div>
  );
}

export function SocialBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-3 py-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-xs font-medium text-slate-600"
    >
      {icon} {label}
    </button>
  );
}
