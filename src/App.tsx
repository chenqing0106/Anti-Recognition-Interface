import React, { useState, useCallback } from 'react';
import { MeshWarpCanvas } from './components/MeshWarpCanvas';
import { Upload, RefreshCcw, Download, Sparkles, Sliders, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const INITIAL_LABELS = [
  'Texture',
  'Moisture',
  'Transparency',
  'Elasticity',
  'Melanin',
  'Pores',
  'Sebum',
  'Firmness'
];

export default function App() {
  const [labels, setLabels] = useState<string[]>(INITIAL_LABELS);
  const [metrics, setMetrics] = useState<number[]>(INITIAL_LABELS.map(() => 0.7));
  const [imageUrl, setImageUrl] = useState<string>('https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=1000');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  const [uvPoints, setUvPoints] = useState<{x: number, y: number}[]>(
    INITIAL_LABELS.map((_, i) => {
      const angle = i * (Math.PI * 2 / INITIAL_LABELS.length) - Math.PI / 2;
      const r = 0.3;
      return {
        x: 0.5 + Math.cos(angle) * r,
        y: 0.5 + Math.sin(angle) * r
      };
    })
  );

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
        newUv.push({ x: 0.5 + Math.cos(angle) * 0.3, y: 0.5 + Math.sin(angle) * 0.3 });
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
    setUvPoints(labels.map((_, i) => {
      const angle = i * (Math.PI * 2 / labels.length) - Math.PI / 2;
      const r = 0.3;
      return {
        x: 0.5 + Math.cos(angle) * r,
        y: 0.5 + Math.sin(angle) * r
      };
    }));
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
    resetCalibration();
    setActiveTab('metrics');
  };

  const downloadImage = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `morph-analysis-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const PRESETS = [
    { name: 'Dehydrated', metrics: [0.4, 0.2, 0.5, 0.4, 0.6, 0.8, 0.3, 0.4] },
    { name: 'Crystal Clear', metrics: [0.9, 0.9, 1.0, 0.8, 0.1, 0.2, 0.1, 0.9] },
    { name: 'Elastic Focus', metrics: [0.7, 0.6, 0.7, 1.0, 0.3, 0.4, 0.2, 0.9] },
    { name: 'Deep Pore', metrics: [0.5, 0.4, 0.5, 0.5, 0.4, 1.0, 0.8, 0.5] },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-black flex items-center justify-center">
              <span className="text-[10px] font-bold">P.A.X</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-[0.3em] uppercase">Epidermal Anatomy</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-medium">Advanced Symmetry Analysis Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={randomize}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-500"
              title="Randomize"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-full text-sm font-medium cursor-pointer hover:bg-black transition-all active:scale-95 shadow-sm">
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
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
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <span className="font-bold">⚠️ 解析失败:</span> 
                这可能是由于照片分辨率过高或格式不兼容导致的。建议尝试缩小尺寸后再上传。
              </div>
            )}
          </motion.div>
          
          <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl">
            <div className="flex items-center gap-2 text-gray-500">
              <ImageIcon className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Source: {imageUrl.includes('blob') ? 'Uploaded Local URL' : 'Default Analytics Plate'}</span>
            </div>
            <button 
              onClick={downloadImage}
              className="text-xs text-gray-400 hover:text-black font-medium transition-colors underline underline-offset-4"
            >
              Download Result
            </button>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button 
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'metrics' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Sliders className="w-4 h-4" />
              Metrics
            </button>
            <button 
              onClick={() => setActiveTab('alignment')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'alignment' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
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
                      <label className="text-sm font-medium text-gray-700 group-hover:text-[#1A1A1A] transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-orange-400 transition-colors" />
                        {label}
                      </label>
                      <span className="text-xs font-mono text-gray-400">{(metrics[index] * 100).toFixed(0)}%</span>
                    </div>
                    <div className="relative h-6 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={metrics[index]}
                        onChange={(e) => handleMetricChange(index, parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#1A1A1A] hover:bg-gray-200 transition-colors"
                      />
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg pointer-events-none transition-all duration-300"
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
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-orange-800">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold">Manual Calibration</span>
                  </div>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    Drag the <b>{labels.length} dots</b> on the face to align with features.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Dimensions</h4>
                    <button 
                      onClick={() => updateDimensionCount(labels.length + 1)}
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase tracking-widest px-2 py-1 rounded-md bg-orange-50 transition-colors"
                    >
                      + Add Dimension
                    </button>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {labels.map((label, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg group">
                        <span className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded-md text-[10px] font-mono text-gray-400">{i + 1}</span>
                        <input 
                          type="text"
                          value={label}
                          onChange={(e) => handleLabelChange(i, e.target.value)}
                          className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 p-0 text-gray-700"
                        />
                        <button 
                          onClick={() => updateDimensionCount(labels.length - 1)}
                          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-xs font-medium hover:bg-gray-50 transition-all text-gray-600"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Reset Points
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={resetAll}
                className="w-full px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all active:scale-95"
              >
                Reset Configuration
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setMetrics(p.metrics)}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 border border-gray-100 rounded-lg text-xs font-medium transition-all"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-gray-400 text-xs">
          <p>© 2026 MorphSymmetry. Experimental Visual Engine.</p>
          <div className="flex items-center gap-8 font-medium uppercase tracking-widest">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Documentation</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
