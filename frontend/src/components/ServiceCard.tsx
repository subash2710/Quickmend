import React from 'react';
import { Service } from '../types';
import * as Icons from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
  selected?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect, selected }) => {
  const iconName = service.icon || 'Wrench';
  const IconComponent = (Icons as any)[iconName] || Icons.Wrench;

  return (
    <div
      onClick={() => onSelect && onSelect(service)}
      className={`group cursor-pointer p-6 rounded-2xl border transition-all duration-200 ${
        selected
          ? 'bg-sky-50/80 border-sky-500 shadow-md ring-2 ring-sky-500/20'
          : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
          selected ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white'
        }`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
          Starting ₹{service.base_price}
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-sky-700 transition-colors">
        {service.name}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
        {service.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-xs font-semibold text-sky-600 group-hover:underline">
          Select & Book &rarr;
        </span>
      </div>
    </div>
  );
};
