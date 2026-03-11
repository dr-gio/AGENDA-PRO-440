import React from 'react';
import {
  Plus,
  Box,
  MoreVertical,
  Circle,
  Clock,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Resources = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-text-primary tracking-tight">Recursos Reservables</h3>
        <button className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-hover shadow-lg shadow-accent-blue/20 transition-all">
          <Plus size={18} />
          Nuevo Recurso
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { name: 'Consultorio 1', type: 'Consultorio', status: 'active', occupancy: '80%' },
          { name: 'Consultorio 2', type: 'Consultorio', status: 'active', occupancy: '45%' },
          { name: 'Sala Procedimientos', type: 'Quirófano Menor', status: 'active', occupancy: '90%' },
          { name: 'Cámara Hiperbárica', type: 'Equipo Especial', status: 'active', occupancy: '30%' },
        ].map((res, i) => (
          <div key={i} className="bg-navy-card p-6 rounded-2xl border border-border-subtle shadow-lg hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-navy-deep rounded-xl text-text-primary group-hover:bg-accent-blue group-hover:text-white transition-all border border-border-subtle">
                <Box size={24} />
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg text-text-secondary">
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="space-y-1 mb-6">
              <h4 className="font-bold text-text-primary">{res.name}</h4>
              <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">{res.type}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-secondary/50">
                  <span>Ocupación</span>
                  <span>{res.occupancy}</span>
                </div>
                <div className="h-1 bg-navy-deep rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-blue transition-all duration-1000"
                    style={{ width: res.occupancy }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  <Circle size={8} className="fill-emerald-500" />
                  <span>Disponible</span>
                </div>
                <button className="text-text-secondary/40 hover:text-text-primary transition-colors">
                  <Settings size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
