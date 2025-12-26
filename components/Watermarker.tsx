import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Trash2, Layers, FolderOutput } from 'lucide-react';
import { ProcessedImage } from '../types';

const Watermarker: React.FC = () => {
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Ref for hidden canvas to process images
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processFile = useCallback((file: File): Promise<ProcessedImage> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) return;

          // Watermark Settings
          const bannerHeightRatio = 0.12; // Banner takes up bottom 12%
          const bannerHeight = Math.max(img.height * bannerHeightRatio, 60); // Minimum 60px
          const totalHeight = img.height + bannerHeight; // Add banner to bottom
          
          canvas.width = img.width;
          canvas.height = totalHeight;

          // Draw Original Image
          ctx.drawImage(img, 0, 0);

          // Draw Footer Background (Yellow/Gold or High Contrast White)
          // User requested "화성부동산 경매학원 010-8213-6711" to be very visible.
          // A bright yellow background with black text is very standard for high visibility in Korea.
          ctx.fillStyle = '#FFD700'; // Gold/Yellow
          ctx.fillRect(0, img.height, canvas.width, bannerHeight);

          // Draw Text
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Dynamic Font Size based on width
          const fontSize = Math.min(canvas.width * 0.06, bannerHeight * 0.5); 
          ctx.font = `bold ${fontSize}px "Noto Sans KR", sans-serif`;

          const text = "화성부동산 경매학원 010-8213-6711";
          ctx.fillText(text, canvas.width / 2, img.height + (bannerHeight / 2));

          resolve({
            id: Math.random().toString(36).substr(2, 9),
            originalName: file.name,
            dataUrl: canvas.toDataURL('image/jpeg', 0.9)
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsProcessing(true);
    const files = Array.from(e.target.files);
    
    try {
      const newImages = await Promise.all(files.map(processFile));
      setProcessedImages(prev => [...prev, ...newImages]);
    } catch (err) {
      console.error(err);
      alert("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
      // Reset input
      e.target.value = ''; 
    }
  };

  const downloadImage = (img: ProcessedImage) => {
    const link = document.createElement('a');
    link.href = img.dataUrl;
    // Prepend 'watermarked_' to original filename
    link.download = `wm_${img.originalName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = async () => {
    // Check if File System Access API (Directory Picker) is supported
    // @ts-ignore
    if (window.showDirectoryPicker) {
      try {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        
        // Loop through images and write to the selected directory
        for (const img of processedImages) {
          // Convert DataURL to Blob
          const response = await fetch(img.dataUrl);
          const blob = await response.blob();
          
          const fileName = `wm_${img.originalName}`;
          // @ts-ignore
          const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
          // @ts-ignore
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }
        
        alert("선택한 폴더에 모든 이미지가 저장되었습니다.");
        return;

      } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled
        console.warn("Directory Picker failed, falling back to legacy download", err);
      }
    }

    // Fallback: Trigger download for all (Legacy)
    processedImages.forEach((img, idx) => {
      setTimeout(() => downloadImage(img), idx * 300);
    });
  };

  const removeImage = (id: string) => {
    setProcessedImages(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Layers className="w-6 h-6 text-purple-600" />
          일괄 하단 광고바 생성
        </h2>
        <p className="text-gray-500 mb-6">
          여러 장의 사진을 선택하면 하단에 <strong>"화성부동산 경매학원 010-8213-6711"</strong> 문구를 자동으로 추가합니다.
        </p>

        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-200 rounded-xl cursor-pointer bg-purple-50 hover:bg-purple-100 transition-colors">
          <div className="text-center">
            {isProcessing ? (
               <div className="animate-pulse text-purple-600 font-bold">처리중...</div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-purple-700">여러 사진 선택 (클릭 또는 드래그)</span>
              </>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            multiple 
            accept="image/*" 
            onChange={handleFiles} 
            disabled={isProcessing} 
          />
        </label>
      </div>

      {processedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">완료된 이미지 ({processedImages.length})</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setProcessedImages([])}
                className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm transition-colors"
              >
                전체 삭제
              </button>
              <button 
                onClick={downloadAll}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors"
              >
                <FolderOutput className="w-5 h-5" />
                폴더 지정하여 모두 저장
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedImages.map((img) => (
              <div key={img.id} className="group relative bg-white p-2 rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                   <img src={img.dataUrl} alt="Processed" className="max-w-full max-h-full object-contain" />
                </div>
                
                <div className="mt-3 flex justify-between items-center px-2">
                   <span className="text-xs text-gray-500 truncate w-32">{img.originalName}</span>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => downloadImage(img)}
                       className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                       title="Download"
                     >
                       <Download className="w-5 h-5" />
                     </button>
                     <button 
                       onClick={() => removeImage(img.id)}
                       className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                       title="Remove"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default Watermarker;