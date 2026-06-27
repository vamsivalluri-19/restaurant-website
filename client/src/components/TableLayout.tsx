import React from 'react';
import { motion } from 'framer-motion';

export interface TableItem {
  _id: string;
  number: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning';
  capacity: number;
}

interface TableLayoutProps {
  tables: TableItem[];
  selectedTableNumber?: number | null;
  onTableClick?: (table: TableItem) => void;
}

export const TableLayout: React.FC<TableLayoutProps> = ({
  tables,
  selectedTableNumber,
  onTableClick
}) => {
  
  const getStatusColor = (status: TableItem['status']) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600';
      case 'Occupied': return 'bg-red border-red-dark text-white hover:bg-red-dark';
      case 'Reserved': return 'bg-amber-500 border-amber-600 text-brown hover:bg-amber-600';
      case 'Cleaning': return 'bg-cyan-500 border-cyan-600 text-white hover:bg-cyan-600';
      default: return 'bg-gray-400 border-gray-500 text-white';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 justify-center bg-cream-light/60 dark:bg-brown-dark/40 border border-gold/15 p-4 rounded-xl text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block shadow"></span>
          <span>🟢 Available (స్వేచ్ఛగా ఉంది)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-red inline-block shadow"></span>
          <span>🔴 Occupied (నిండిపోయింది)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block shadow"></span>
          <span>🟡 Reserved (రిజర్వ్ చేయబడింది)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 inline-block shadow"></span>
          <span>🔵 Cleaning (శుభ్రం చేస్తున్నారు)</span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-[500px] overflow-y-auto p-2 border border-gold/10 rounded-xl bg-brown-dark/5">
        {tables.map((table) => {
          const isSelected = selectedTableNumber === table.number;
          return (
            <motion.button
              key={table._id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTableClick?.(table)}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 shadow font-semibold transition-all ${getStatusColor(table.status)} ${
                isSelected 
                ? 'ring-4 ring-gold ring-offset-2 ring-offset-cream dark:ring-offset-brown pulse-gold-btn border-gold scale-105 z-10' 
                : ''
              }`}
            >
              <span className="text-xs opacity-75">T</span>
              <span className="text-sm font-extrabold">{table.number}</span>
              <span className="text-[9px] opacity-90 mt-0.5">{table.capacity}p</span>

              {/* Mini glow indicator for QR Selected table */}
              {isSelected && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gold-dark"></span>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
