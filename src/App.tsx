import React, { useState } from 'react';
import { MeshWarpCanvas } from './components/MeshWarpCanvas';
import { Upload, RefreshCcw, Download, Sparkles, Sliders, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import defaultFaceUrl from './assets/default-face.jpeg';
const INITIAL_LABELS = [
  'Recognizability',
  'Trace',
  'Similarity',
  'Anomaly',
  'Memory',
  'Exposure',
  'Fragmentation',
  'Disguise'
];

const buildDefaultPoints = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const angle = i * (Math.PI * 2 / count) - Math.PI / 2;
    // r matches the canvas radar polygon's typical radius so the texture-to-mesh
    // ratio is ~1:1 — the face renders close to natural scale instead of being
    // squeezed from a tiny inner circle onto a large polygon.
    const r = 0.45;
    return {
      x: 0.5 + Math.cos(angle) * r,
      y: 0.5 + Math.sin(angle) * r
    };
  });
};

export default function App() {
  const [labels, setLabels] = useState<string[]>(INITIAL_LABELS);
  const [metrics, setMetrics] = useState<number[]>(INITIAL_LABELS.map(() => 0.7));
  const [imageUrl, setImageUrl] = useState<string>(defaultFaceUrl);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [uvPoints, setUvPoints] = useState<{x: number, y: number}[]>(buildDefaultPoints(INITIAL_LABELS.length));

  const updateDimensionCount = (newCount: number) => {
    const count = Math.max(3, Math.min(12, newCount));
    const newLabels = [...labels];
    const newMetrics = [...metrics];
    const newUv = [...uvPoints];

    if (count > labels.length) {
      for (let i = labels.length; i < count; i++) {
        newLabels.push(`Factor ${i + 1}`);
        newMetrics.push(0.7);
        const angle = i * (Math.PI * 2 / count) - Math.PI / 2;
        newUv.push({ x: 0.5 + Math.cos(angle) * 0.45, y: 0.5 + Math.sin(angle) * 0.45 });
      }
    } else {
      newLabels.splice(count);
      newMetrics.splice(count);
      newUv.splice(count);
    }
    setLabels(newLabels);
    setMetrics(newMetrics);
    setUvPoints(newUv);
  };

  const handleLabelChange = (index: number, newName: string) => {
    const next = [...labels];
    next[index] = newName;
    setLabels(next);
  };

  const resetCalibration = () => {
    setUvPoints(buildDefaultPoints(labels.length));
  };

  const [activeTab, setActiveTab] = useState<'metrics' | 'alignment'>('metrics');
  const [errorCount, setErrorCount] = useState(0);

  React.useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      setErrorCount(0);
    };
    img.onerror = () => {
      console.error('Failed to load image:', imageUrl);
      setErrorCount(prev => prev + 1);
    };

    return () => {
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleMetricChange = (index: number, value: number) => {
    const newMetrics = [...metrics];
    newMetrics[index] = value;
    setMetrics(newMetrics);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (JPG, PNG, etc.)');
        return;
      }
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const randomize = () => {
    setMetrics(metrics.map(() => 0.3 + Math.random() * 0.9));
  };

  const resetAll = () => {
    setLabels(INITIAL_LABELS);
    setMetrics(INITIAL_LABELS.map(() => 0.7));
    setUvPoints(buildDefaultPoints(INITIAL_LABELS.length));
    setActiveTab('metrics');
  };

  const drawExportDimensionLayer = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = (width / 2) * 0.8;
    const angleStep = (Math.PI * 2) / metrics.length;

    ctx.strokeStyle = 'rgba(17, 17, 17, 0.28)';
    ctx.lineWidth = 0.75;
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(r => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * maxRadius, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(17, 17, 17, 0.18)';
    labels.forEach((label, i) => {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * maxRadius, centerY + Math.sin(angle) * maxRadius);
      ctx.stroke();

      const labelDist = maxRadius + 26;
      const lx = centerX + Math.cos(angle) * labelDist;
      const ly = centerY + Math.sin(angle) * labelDist;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#111111';
      ctx.font = '700 11px "Space Grotesk", sans-serif';
      ctx.fillText(label.toUpperCase(), 0, -5);
      ctx.fillStyle = '#d64a2f';
      ctx.font = '600 8px "IBM Plex Mono", monospace';
      ctx.fillText(`IDX ${(metrics[i] * 100).toFixed(0)}`, 0, 6);
      ctx.restore();
    });
  };

  const downloadImage = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#EEEAE2';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);
    drawExportDimensionLayer(ctx, exportCanvas.width, exportCanvas.height);

    const link = document.createElement('a');
    link.download = `anti-recognition-interface-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png', 1.0);
    link.click();
  };

  // Axis order (clockwise from top): Recognizability, Trace, Similarity, Anomaly,
  // Memory, Exposure, Fragmentation, Disguise. Kept within [0.40, 1.00] so the
  // face stays a face — each preset only nudges the polygon toward its theme.
  const PRESETS = [
    // Traceable — upper-right lean, traceability axes high, disguise softly recessed.
    { name: 'Traceable',      metrics: [0.95, 1.00, 0.85, 0.48, 0.62, 0.78, 0.45, 0.42] },
    // Data Leak — bottom-heavy: memory & exposure swell, rest stays neutral.
    { name: 'Data Leak',      metrics: [0.62, 0.75, 0.55, 0.72, 0.95, 1.00, 0.52, 0.46] },
    // Identity Drift — diagonal: anomaly + fragmentation peak, recognizability mellow.
    { name: 'Identity Drift', metrics: [0.48, 0.55, 0.50, 0.92, 0.62, 0.55, 0.95, 0.75] },
    // Disguise Field — top-left bias: disguise tops out, traceable side trimmed but alive.
    { name: 'Disguise Field', metrics: [0.45, 0.48, 0.50, 0.65, 0.52, 0.46, 0.90, 1.00] },
  ];

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#111111] font-sans selection:bg-[#C8FFF4] selection:text-black">
      {/* Header */}
      <header className="border-b border-black/10 bg-[#F6F4EF]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-bold uppercase">Anti-Recognition Interface</h1>
              <p className="text-[9px] uppercase text-[#6B6258] font-mono">Facial coordinate / identity drift system</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={randomize}
              className="p-2 hover:bg-black hover:text-[#F6F4EF] transition-colors text-[#6B6258] border border-transparent hover:border-black"
              title="Randomize"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-[#F6F4EF] text-sm font-medium cursor-pointer hover:bg-[#2B2924] transition-all active:scale-95 shadow-sm">
              <Upload className="w-4 h-4" />
              <span>Upload Face</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Canvas */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <MeshWarpCanvas 
              image={image} 
              metrics={metrics} 
              labels={labels}
              size={600}
              uvPoints={uvPoints}
              onUVPointsChange={setUvPoints}
              onMetricsChange={setMetrics}
              isCalibrating={activeTab === 'alignment'}
            />
            {errorCount > 0 && (
              <div className="mt-4 p-4 bg-[#FFF0EC] border border-[#D64A2F]/30 text-[#B3311A] text-sm flex items-center gap-2">
                <span className="font-bold">Parse failed:</span> 
                The image may be too large or incompatible. Try a smaller file.
              </div>
            )}
          </motion.div>
          
          <div className="flex items-center justify-between p-4 bg-[#EEEAE2] border border-black/10">
            <div className="flex items-center gap-2 text-[#6B6258]">
              <ImageIcon className="w-4 h-4" />
              <span className="text-xs font-mono uppercase">Source: {imageUrl.includes('blob') ? 'Uploaded local face' : 'Default identity plate'}</span>
            </div>
            <button 
              onClick={downloadImage}
              className="inline-flex items-center gap-2 text-xs text-[#6B6258] hover:text-black font-mono uppercase transition-colors underline underline-offset-4"
            >
              <Download className="w-3.5 h-3.5" />
              Export Trace
            </button>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="flex p-1 bg-[#E6E0D7] border border-black/10">
            <button 
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all ${activeTab === 'metrics' ? 'bg-[#111111] text-[#F6F4EF]' : 'text-[#6B6258] hover:text-black'}`}
            >
              <Sliders className="w-4 h-4" />
              Coordinates
            </button>
            <button 
              onClick={() => setActiveTab('alignment')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all ${activeTab === 'alignment' ? 'bg-[#D64A2F] text-white shadow-md' : 'text-[#6B6258] hover:text-black'}`}
            >
              <ImageIcon className="w-4 h-4" />
              Calibration
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'metrics' ? (
              <motion.div 
                key="metrics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {labels.map((label, index) => (
                  <div key={label} className="group">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-[#2B2924] group-hover:text-black transition-colors flex items-center gap-2">
                        <span className="w-2 h-2 border border-black bg-[#C8FFF4] group-hover:bg-[#D64A2F] transition-colors" />
                        {label}
                      </label>
                      <span className="text-xs font-mono text-[#6B6258]">{(metrics[index] * 100).toFixed(0)}%</span>
                    </div>
                    <div className="relative h-6 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={metrics[index]}
                        onChange={(e) => handleMetricChange(index, parseFloat(e.target.value))}
                        className="w-full h-1 bg-black/10 appearance-none cursor-pointer accent-[#111111] hover:bg-black/20 transition-colors"
                      />
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#D64A2F] pointer-events-none transition-all duration-300"
                        style={{ width: `${metrics[index] * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="alignment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-4 bg-[#FFF0EC] border border-[#D64A2F]/30 space-y-3">
                  <div className="flex items-center gap-2 text-[#B3311A]">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold">Manual Face Coordinate Calibration</span>
                  </div>
                  <p className="text-xs text-[#B3311A] leading-relaxed">
                    Drag the <b>{labels.length} dots</b> to align the system with the face it tries to define.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-[#6B6258] font-mono">Identity Axes</h4>
                    <button 
                      onClick={() => updateDimensionCount(labels.length + 1)}
                      className="text-[10px] font-bold text-[#B3311A] hover:text-black uppercase px-2 py-1 bg-[#FFF0EC] border border-[#D64A2F]/20 transition-colors"
                    >
                      + Add Dimension
                    </button>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {labels.map((label, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-[#EEEAE2] border border-black/10 group">
                        <span className="w-6 h-6 flex items-center justify-center bg-[#111111] text-[#F6F4EF] text-[10px] font-mono">{i + 1}</span>
                        <input 
                          type="text"
                          value={label}
                          onChange={(e) => handleLabelChange(i, e.target.value)}
                          className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 p-0 text-[#2B2924]"
                        />
                        <button 
                          onClick={() => updateDimensionCount(labels.length - 1)}
                          className="p-1 text-[#6B6258] hover:text-[#D64A2F] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <RefreshCcw className="w-3 h-3 rotate-45" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={resetCalibration}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-black/20 text-xs font-mono uppercase hover:bg-[#EEEAE2] transition-all text-[#2B2924]"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Reset Points
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-8 border-t border-black/10 space-y-4">
            <h3 className="text-xs font-bold uppercase text-[#6B6258] font-mono">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={resetAll}
                className="w-full px-6 py-3 border border-black/20 text-sm font-medium hover:bg-[#EEEAE2] transition-all active:scale-95"
              >
                Reset Configuration
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setMetrics(p.metrics)}
                  className="px-3 py-1.5 bg-[#EEEAE2] hover:bg-[#C8FFF4] hover:text-black border border-black/10 text-xs font-mono transition-all"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-[#EEEAE2] py-10 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[#6B6258] text-xs font-mono">
          <p>© 2026 Anti-Recognition Interface. Experimental identity drift engine.</p>
          <div className="flex items-center gap-8 font-medium uppercase">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Documentation</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
