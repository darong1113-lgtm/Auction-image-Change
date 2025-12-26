import React, { useState } from 'react';
import { Image as ImageIcon, Layers } from 'lucide-react';
import CoverMaker from './components/CoverMaker';
import Watermarker from './components/Watermarker';

enum Tab {
  COVER = 'COVER',
  WATERMARK = 'WATERMARK'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.COVER);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                H
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                화성부동산경매학원
              </h1>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab(Tab.COVER)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === Tab.COVER
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                표지 만들기
              </button>
              <button
                onClick={() => setActiveTab(Tab.WATERMARK)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === Tab.WATERMARK
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                일괄 워터마크
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === Tab.COVER ? <CoverMaker /> : <Watermarker />}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} 화성부동산경매학원. All rights reserved.
      </footer>
    </div>
  );
};

export default App;