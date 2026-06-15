import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Trash2, CheckCircle, Type } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  title: string;
  suggestedName: string;
}

export default function SignaturePad({ onSave, onCancel, title, suggestedName }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [useTyped, setUseTyped] = useState(false);
  const [typedName, setTypedName] = useState(suggestedName);
  const [selectedStyle, setSelectedStyle] = useState('font-signature-1');

  // Prevent scrolling when drawing on touch screens
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (e.target === canvasRef.current) {
        e.preventDefault();
      }
    };
    document.body.addEventListener('touchmove', preventDefault, { passive: false });
    return () => {
      document.body.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Scale corresponding to the visual dimensions vs canvas backbuffer
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height)
      };
    } else {
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    
    // Configure stroke settings
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    if (useTyped) {
      // Create signature from text using canvas
      const canvas = document.createElement('canvas');
      canvas.width = 450;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear background with transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw typed name in a recursive style font
        ctx.fillStyle = '#0f172a'; // Deep Navy
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (selectedStyle === 'font-signature-1') {
          ctx.font = 'italic 500 38px "Playfair Display", Georgia, serif';
        } else if (selectedStyle === 'font-signature-2') {
          ctx.font = 'italic 600 42px "Times New Roman", serif';
        } else {
          ctx.font = 'normal 400 36px "Brush Script MT", cursive, sans-serif';
        }
        
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
        
        // Add decorative line underneath
        ctx.beginPath();
        ctx.moveTo(70, 110);
        ctx.bezierCurveTo(150, 100, 300, 120, 380, 105);
        ctx.strokeStyle = '#22c55e'; // green-500 line
        ctx.lineWidth = 2;
        ctx.stroke();
        
        onSave(canvas.toDataURL());
      }
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Check if canvas is empty
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const buffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
        const isEmpty = !buffer.some(color => color !== 0);
        if (isEmpty) {
          alert('Tanda tangan masih kosong. Silakan gambar atau pilih opsi "Ketik Nama"');
          return;
        }
      }
      
      onSave(canvas.toDataURL());
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-neutral-100 overflow-hidden" id="signature-pad-modal">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PenTool className="h-5 w-5 text-emerald-300" />
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-xs text-emerald-100">Bubuhkan tanda tangan persetujuan SOP secara digital</p>
            </div>
          </div>
        </div>

        {/* Action Toggle Tab */}
        <div className="flex border-b border-neutral-100 bg-neutral-50 p-2">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              !useTyped
                ? 'bg-white text-emerald-800 shadow-xs border border-neutral-200/50'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
            onClick={() => setUseTyped(false)}
          >
            <PenTool className="h-4 w-4" />
            Gambar Manual
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              useTyped
                ? 'bg-white text-emerald-800 shadow-xs border border-neutral-200/50'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
            onClick={() => setUseTyped(true)}
          >
            <Type className="h-4 w-4" />
            Ketik Nama
          </button>
        </div>

        {/* Draw Body */}
        <div className="p-6">
          {!useTyped ? (
            <div>
              <div className="relative border border-dashed border-neutral-300 rounded-xl bg-neutral-50 aspect-video overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={450}
                  height={220}
                  className="w-full h-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-neutral-400 font-mono tracking-wider pointer-events-none">
                  AREA TANDA TANGAN (SENTUH / SERET MOUSE)
                </span>
                
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 hover:text-red-600 transition-colors h-8 px-2.5 rounded-lg border border-neutral-200 text-xs font-semibold flex items-center gap-1.5 text-neutral-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus Coretan
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-2 text-center">
                *Tanda tangan ini akan direkam ke dalam berkas SOP harian dan dapat diunduh/dicetak.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                  Nama yang Tercantum:
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full text-base font-medium text-neutral-800 border border-neutral-200 rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden transition-all bg-neutral-50/50"
                  placeholder="Ketik Nama Anda..."
                  maxLength={40}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-2 uppercase tracking-wide">
                  Pilih Gaya Tanda Tangan:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStyle('font-signature-1')}
                    className={`p-3 border rounded-xl flex items-center justify-center text-lg aspect-square text-neutral-800 transition-all ${
                      selectedStyle === 'font-signature-1'
                        ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/10 font-serif'
                        : 'border-neutral-200 hover:bg-neutral-50 font-serif'
                    }`}
                  >
                    <div className="text-center">
                      <span className="italic block font-bold text-slate-800">Classic</span>
                      <span className="text-[10px] text-neutral-400">Playfair</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStyle('font-signature-2')}
                    className={`p-3 border rounded-xl flex items-center justify-center text-lg aspect-square text-neutral-800 transition-all ${
                      selectedStyle === 'font-signature-2'
                        ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/10 font-serif'
                        : 'border-neutral-200 hover:bg-neutral-50 font-serif'
                    }`}
                  >
                    <div className="text-center">
                      <span className="italic block font-bold text-slate-800">Formal</span>
                      <span className="text-[10px] text-neutral-400">Garamond</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStyle('font-signature-3')}
                    className={`p-3 border rounded-xl flex items-center justify-center text-lg aspect-square text-neutral-800 transition-all ${
                      selectedStyle === 'font-signature-3'
                        ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/10'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                    style={{ fontFamily: 'Brush Script MT, cursive, sans-serif' }}
                  >
                    <div className="text-center">
                      <span className="italic block font-bold text-emerald-800 text-xl">Casual</span>
                      <span className="text-[10px] text-neutral-400">Script</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="border border-neutral-100 rounded-xl bg-neutral-50 p-4 min-h-[90px] flex items-center justify-center relative overflow-hidden">
                <span className="absolute top-1 left-2 text-[8px] text-neutral-400 uppercase tracking-widest font-mono">
                  Pratinjau Hasil Tanda Tangan
                </span>
                <div className="text-center">
                  <p 
                    className="text-3xl text-neutral-800 font-semibold"
                    style={{ 
                      fontFamily: selectedStyle === 'font-signature-1' 
                        ? '"Playfair Display", Georgia, serif'
                        : selectedStyle === 'font-signature-2'
                        ? '"Times New Roman", serif'
                        : '"Brush Script MT", cursive, sans-serif'
                    }}
                  >
                    {typedName || 'Ketik Nama'}
                  </p>
                  <div className="h-0.5 bg-emerald-500 w-32 mx-auto mt-2 opacity-50 relative">
                    <span className="absolute -top-1 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-neutral-100 p-4 bg-neutral-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-neutral-300 hover:bg-neutral-100 focus:ring-2 focus:ring-neutral-200 text-neutral-700 py-2.5 rounded-xl text-sm font-semibold transition-colors uppercase tracking-wide"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white focus:ring-4 focus:ring-emerald-500/20 active:scale-98 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide"
          >
            <CheckCircle className="h-4 w-4" />
            Terapkan & Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
