import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, RefreshCw, Save } from 'lucide-react';
import html2canvas from 'html2canvas';
import { AuctionData } from '../types';

const InitialData: AuctionData = {
  caseNumber: '2024타경85900',
  saleDate: '2026년 1월 6일',
  appraisalValue: '540,000,000',
  minimumPrice: '378,000,000',
  minimumPercentage: '70%',
  landArea: '12.307평 (40.6831㎡)',
  buildingArea: '전용 18.149평 / 공급 25평형',
  address: '경기도 화성시 반월동 000-00',
  apartmentName: '반월동 SK아파트',
};

const CoverMaker: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [data, setData] = useState<AuctionData>(InitialData);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    try {
      // Temporarily modify style to ensure fonts render correctly in canvas
      const originalStyle = previewRef.current.style.transform;
      previewRef.current.style.transform = "none";
      
      const canvas = await html2canvas(previewRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        // Ensure fonts are smoothed
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('[data-preview-container]') as HTMLElement;
          if (element) {
             element.style.fontFamily = '"Noto Sans KR", sans-serif';
          }
        }
      });

      // Restore style
      previewRef.current.style.transform = originalStyle;

      const fileName = `cover_${data.caseNumber || 'auction'}.png`;

      // Try File System Access API (Modern Browsers)
      // @ts-ignore
      if (window.showSaveFilePicker) {
        try {
          // @ts-ignore
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'PNG Image',
              accept: { 'image/png': ['.png'] },
            }],
          });
          const writable = await fileHandle.createWritable();
          
          // Convert canvas to blob
          canvas.toBlob(async (blob) => {
            if (blob) {
              await writable.write(blob);
              await writable.close();
            }
          });
          return;
        } catch (err: any) {
          // If user cancels, stop. If error, fall back.
          if (err.name === 'AbortError') return;
          console.warn("File System API failed, falling back to legacy download", err);
        }
      }
      
      // Fallback for older browsers
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();

    } catch (err) {
      console.error("Export failed", err);
      alert("이미지 저장 중 오류가 발생했습니다.");
    }
  };

  const handleInputChange = (key: keyof AuctionData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    if (confirm('입력한 내용이 모두 초기화됩니다. 계속하시겠습니까?')) {
      setData(InitialData);
      setImage(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-600" />
            정보 입력 및 표지 생성
          </h2>
          <button 
            onClick={resetForm}
            className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            초기화
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Upload */}
          <div className="lg:col-span-4 space-y-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">메인 사진 업로드</label>
            <label className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors overflow-hidden group">
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Upload className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-blue-700">클릭하여 사진 선택</span>
                  <p className="text-xs text-blue-400 mt-1">또는 파일을 여기로 드래그</p>
                </div>
              )}
              {image && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-medium flex items-center gap-2">
                    <Upload className="w-5 h-5" /> 사진 변경
                  </span>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>

          {/* Right Column: Text Inputs */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">아파트명 / 물건명</label>
                <input 
                  type="text" 
                  value={data.apartmentName}
                  onChange={e => handleInputChange('apartmentName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="예: 반월동 래미안 아파트"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">상세 주소</label>
                <input 
                  type="text" 
                  value={data.address}
                  onChange={e => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="예: 경기도 화성시 영통로 123"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">사건번호</label>
                <input 
                  type="text" 
                  value={data.caseNumber}
                  onChange={e => handleInputChange('caseNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="2024 타경 12345"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">매각기일</label>
                <input 
                  type="text" 
                  value={data.saleDate}
                  onChange={e => handleInputChange('saleDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="2025년 1월 1일"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">감정가</label>
                <input 
                  type="text" 
                  value={data.appraisalValue}
                  onChange={e => handleInputChange('appraisalValue', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="500,000,000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">최저가 / 비율</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={data.minimumPrice}
                    onChange={e => handleInputChange('minimumPrice', e.target.value)}
                    className="w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="350,000,000"
                  />
                  <input 
                    type="text" 
                    value={data.minimumPercentage}
                    onChange={e => handleInputChange('minimumPercentage', e.target.value)}
                    className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center"
                    placeholder="70%"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">대지면적</label>
                <input 
                  type="text" 
                  value={data.landArea}
                  onChange={e => handleInputChange('landArea', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="00평 (00㎡)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">건물면적</label>
                <input 
                  type="text" 
                  value={data.buildingArea}
                  onChange={e => handleInputChange('buildingArea', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="전용 00평"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="flex flex-col items-center">
        <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          미리보기 및 다운로드
        </h3>
        
        <div className="bg-gray-200 p-4 md:p-8 rounded-xl overflow-auto w-full flex justify-center shadow-inner">
          <div ref={previewRef} data-preview-container className="bg-white w-[900px] min-w-[900px] flex flex-col font-[sans-serif]">
            
            {/* 1. Header Area */}
            <div className="pt-10 pb-6 px-4 text-center relative">
               <div className="inline-block relative">
                 <h1 className="text-4xl font-extrabold text-gray-900 inline-block align-middle mr-4">
                   {data.apartmentName || '아파트명 입력'}
                 </h1>
                 <span className="text-xl text-gray-500 font-medium inline-block align-bottom mb-1.5">화성부동산경매학원</span>
               </div>
               <div className="text-xl text-gray-600 font-normal mt-2 block">
                 도로명 주소 - {data.address || '주소 입력'}
               </div>
            </div>
            
            {/* 2. Content Area */}
            <div className="flex px-8 pb-8 items-start bg-white">
              {/* Left: Image (Square) */}
              <div className="w-[420px] h-[420px] shrink-0 relative rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                {image ? (
                  <img src={image} alt="Target" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-16 h-16 mb-2 opacity-30" />
                    <span>이미지 없음</span>
                  </div>
                )}
                {/* Image Watermark */}
                <div className="absolute top-6 left-0 right-0 text-center pointer-events-none">
                  <span className="text-white/90 font-bold text-xl drop-shadow-md">
                    화성부동산경매학원
                  </span>
                </div>
              </div>

              {/* Right: Details List (Table Layout for reliability) */}
              <div className="flex-1 pl-8 h-[420px]">
                <table className="w-full h-full border-collapse">
                  <tbody>
                    {/* Row 1: Case Number */}
                    <tr>
                      <td className="w-[130px] align-middle">
                        <div className="bg-gray-600 text-white rounded-full text-center text-xl font-bold h-11 leading-[44px] shadow-sm w-full">
                          사건번호
                        </div>
                      </td>
                      <td className="align-middle pl-5">
                        <span className="text-3xl font-bold text-gray-800 block leading-none">{data.caseNumber}</span>
                      </td>
                    </tr>

                    {/* Row 2: Date (RED) */}
                    <tr>
                      <td className="w-[130px] align-middle">
                        <div className="bg-gray-600 text-white rounded-full text-center text-xl font-bold h-11 leading-[44px] shadow-sm w-full">
                          매각기일
                        </div>
                      </td>
                      <td className="align-middle pl-5">
                        <span className="text-4xl font-extrabold text-red-600 block leading-none">{data.saleDate}</span>
                      </td>
                    </tr>

                    {/* Row 3: Appraisal */}
                    <tr>
                      <td className="w-[130px] align-middle">
                        <div className="bg-gray-600 text-white rounded-full text-center text-xl font-bold h-11 leading-[44px] shadow-sm w-full">
                          감정가
                        </div>
                      </td>
                      <td className="align-middle pl-5">
                        <div className="flex items-end">
                          <span className="text-3xl font-bold text-gray-800 leading-none">{data.appraisalValue}</span>
                          <span className="text-xl text-gray-400 font-medium leading-none mb-0.5 ml-2">(100%)</span>
                        </div>
                      </td>
                    </tr>

                    {/* Row 4: Min Price (RED) */}
                    <tr>
                      <td className="w-[130px] align-middle">
                        <div className="bg-gray-600 text-white rounded-full text-center text-xl font-bold h-11 leading-[44px] shadow-sm w-full">
                          최저가
                        </div>
                      </td>
                      <td className="align-middle pl-5">
                        <div className="flex items-end">
                          <span className="text-4xl font-extrabold text-red-600 leading-none">{data.minimumPrice}</span>
                          <span className="text-3xl text-red-600 font-bold leading-none mb-0.5 ml-2">({data.minimumPercentage || '70%'})</span>
                        </div>
                      </td>
                    </tr>

                    {/* Row 5: Land Area */}
                    <tr>
                      <td className="w-[130px] align-middle">
                        <div className="bg-gray-600 text-white rounded-full text-center text-xl font-bold h-11 leading-[44px] shadow-sm w-full">
                          대지면적
                        </div>
                      </td>
                      <td className="align-middle pl-5">
                        <span className="text-2xl font-bold text-gray-800 block leading-none">{data.landArea}</span>
                      </td>
                    </tr>

                    {/* Row 6: Building Area (BLUE) */}
                    <tr>
                      <td className="w-[130px] align-middle">
                        <div className="bg-gray-600 text-white rounded-full text-center text-xl font-bold h-11 leading-[44px] shadow-sm w-full">
                          건물면적
                        </div>
                      </td>
                      <td className="align-middle pl-5">
                        <span className="text-2xl font-bold text-blue-600 block leading-none">{data.buildingArea}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Footer Warning */}
            <div className="pb-8 pt-4 text-center bg-white">
               <p className="text-xl font-bold text-gray-800">
                 * 경매절차상 기일변경, 취하, 기각이 될 수 있습니다.
               </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleDownload}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-4 px-12 rounded-xl shadow-xl transition-all transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <Save className="w-6 h-6" />
            저장 위치 선택하여 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverMaker;