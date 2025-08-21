import React from 'react';
import { cn } from '../../lib/utils';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartData[];
  type: 'bar' | 'line';
  height?: number;
  className?: string;
  showValues?: boolean;
}

export function SimpleChart({ 
  data, 
  type, 
  height = 200, 
  className,
  showValues = false 
}: SimpleChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className={cn("flex items-center justify-center bg-muted rounded-lg", className)}
        style={{ height }}
      >
        <div className="text-center text-muted-foreground">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));

  const renderBarChart = () => (
    <div className="flex items-end justify-between h-full gap-2">
      {data.map((item, index) => {
        const heightPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const color = item.color || 'bg-primary';
        
        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            {showValues && (
              <div className="text-xs text-muted-foreground mb-1">
                {item.value.toLocaleString()}
              </div>
            )}
            <div
              className={cn("w-full rounded-t transition-all duration-300 hover:opacity-80", color)}
              style={{ height: `${heightPercentage}%` }}
            />
            <div className="text-xs text-muted-foreground mt-1 text-center">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = maxValue > 0 ? 100 - ((item.value - minValue) / (maxValue - minValue)) * 100 : 50;
      return `${x}% ${y}%`;
    }).join(', ');

    return (
      <div className="relative h-full">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
            points={points}
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = maxValue > 0 ? 100 - ((item.value - minValue) / (maxValue - minValue)) * 100 : 50;
            
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="3"
                className="fill-primary"
              />
            );
          })}
        </svg>
        
        {showValues && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
            {data.map((item, index) => (
              <span key={index} className="text-center">
                {item.value.toLocaleString()}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={cn("w-full", className)}
      style={{ height }}
    >
      {type === 'bar' ? renderBarChart() : renderLineChart()}
    </div>
  );
} 