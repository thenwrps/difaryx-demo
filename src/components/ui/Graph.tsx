import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

interface GraphProps {
  type?: 'xrd' | 'xps' | 'ftir' | 'raman';
  height?: number | string;
  showCalculated?: boolean;
  showBackground?: boolean;
  showResidual?: boolean;
}

// Function to generate realistic looking spectral data with noise and peaks
function generateData(type: string) {
  const data = [];
  const points = 500;
  
  // Define some peaks (center, height, width)
  const peaks = [
    { c: 100, h: 50, w: 5 },
    { c: 250, h: 90, w: 3 },
    { c: 260, h: 40, w: 4 },
    { c: 350, h: 70, w: 6 },
    { c: 420, h: 30, w: 8 },
  ];

  for (let i = 0; i < points; i++) {
    // x axis varies by type
    const x = type === 'xrd' ? 10 + (i * 70) / points // 2theta 10-80
      : type === 'xps' ? 1000 - (i * 1000) / points // binding energy 1000-0
      : type === 'ftir' ? 4000 - (i * 3600) / points // wavenumbers 4000-400
      : 100 + (i * 3900) / points; // raman shift 100-4000

    let observed = 0;
    
    // Add background (smooth curve or sloped line)
    const background = type === 'xrd' ? 15 - (i * 10) / points 
      : type === 'xps' ? 50 + (i * 20) / points 
      : 10;

    observed += background;

    // Add peaks (Lorentzian/Gaussian shape)
    for (const p of peaks) {
      // Gaussian
      observed += p.h * Math.exp(-Math.pow(i - p.c, 2) / (2 * Math.pow(p.w, 2)));
    }

    // Calculated is smooth, observed has noise
    const calculated = observed;
    
    // Add noise to observed
    const noise = (Math.random() - 0.5) * 5;
    observed += noise;

    const residual = observed - calculated;

    data.push({
      x: Number(x.toFixed(1)),
      observed: Number(observed.toFixed(2)),
      calculated: Number(calculated.toFixed(2)),
      background: Number(background.toFixed(2)),
      residual: Number(residual.toFixed(2)) - 20, // Offset residual downwards for display
    });
  }
  return data;
}

export function Graph({ type = 'xrd', height = 400, showCalculated = true, showBackground = false, showResidual = true }: GraphProps) {
  const data = useMemo(() => generateData(type), [type]);

  const xLabel = type === 'xrd' ? '2θ (°)' 
    : type === 'xps' ? 'Binding Energy (eV)' 
    : type === 'ftir' ? 'Wavenumber (cm⁻¹)' 
    : 'Raman Shift (cm⁻¹)';

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="x" 
            stroke="#9CA3AF" 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: xLabel, position: 'bottom', fill: '#9CA3AF', fontSize: 12 }}
            type="number"
            domain={['dataMin', 'dataMax']}
            reversed={type === 'xps' || type === 'ftir'} // XPS and FTIR are usually plotted reversed
          />
          <YAxis 
            stroke="#9CA3AF" 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: 'Intensity (a.u.)', angle: -90, position: 'left', fill: '#9CA3AF', fontSize: 12 }}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#101622', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          
          {showResidual && (
             <Line type="step" dataKey="residual" stroke="#ef4444" dot={false} strokeWidth={1} isAnimationActive={false} />
          )}
          {showBackground && (
             <Line type="monotone" dataKey="background" stroke="#6b7280" dot={false} strokeWidth={1} isAnimationActive={false} strokeDasharray="5 5" />
          )}
          {showCalculated && (
            <Line type="monotone" dataKey="calculated" stroke="#1D4ED8" dot={false} strokeWidth={2} isAnimationActive={false} />
          )}
          <Line type="monotone" dataKey="observed" stroke="#06B6D4" dot={false} strokeWidth={1} isAnimationActive={false} />
          
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
