
import React from 'react';
import { remixWallpaper } from '../services/geminiService';

// --- Helper Components (Defined outside ImageModal) ---
const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const RemixIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const MiniSpinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const [isRemixing, setIsRemixing] = React.useState(false);
  const [remixPrompt, setRemixPrompt] = React.useState('');
  const [currentImageUrl, setCurrentImageUrl] = React.useState(imageUrl);
  const [isRemixLoading, setIsRemixLoading] = React.useState(false);
  const [remixError, setRemixError] = React.useState<string | null>(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `ai-wallpaper-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemixClick = () => {
    setIsRemixing(true);
    setRemixError(null);
  };

  const handleGenerateRemix = async () => {
    if (!remixPrompt.trim()) return;

    setIsRemixLoading(true);
    setRemixError(null);

    try {
      const newImage = await remixWallpaper(currentImageUrl, remixPrompt);
      setCurrentImageUrl(newImage);
      setRemixPrompt('');
      setIsRemixing(false);
    } catch (err: any) {
      setRemixError(err.message || '리믹스 중 오류가 발생했습니다.');
    } finally {
      setIsRemixLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col justify-center items-center z-50 p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl font-bold opacity-70 hover:opacity-100 transition-opacity">&times;</button>
      
      <div className="relative w-full max-w-[calc(100vh*9/16*0.8)] h-[80vh] flex justify-center items-center" onClick={e => e.stopPropagation()}>
        <img src={currentImageUrl} alt="Generated Wallpaper Fullscreen" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black" />
        {isRemixLoading && (
          <div className="absolute inset-0 bg-black/60 flex justify-center items-center rounded-lg backdrop-blur-sm">
            <div className="flex flex-col justify-center items-center h-full gap-4">
              <svg className="animate-spin h-10 w-10 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg text-gray-300">리믹스 적용 중...</span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-lg px-4" onClick={e => e.stopPropagation()}>
        {remixError && <p className="text-red-500 text-center mb-2 bg-gray-800/80 p-2 rounded-lg">{remixError}</p>}
        {!isRemixing ? (
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300 shadow-lg">
              <DownloadIcon />
              다운로드
            </button>
            <div className="relative group">
              <button
                onClick={handleRemixClick}
                className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300 shadow-lg">
                <RemixIcon />
                Remix
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-sm text-white bg-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-max">
                이미지를 기반으로 프롬프트를 수정하여 새로운 버전을 만듭니다.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 p-2 bg-gray-800/80 backdrop-blur-sm rounded-xl">
            <input
              type="text"
              value={remixPrompt}
              onChange={(e) => setRemixPrompt(e.target.value)}
              placeholder="예: 밤하늘에 오로라를 추가해줘"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white transition-shadow"
              disabled={isRemixLoading}
            />
            <button onClick={handleGenerateRemix} disabled={isRemixLoading || !remixPrompt.trim()} className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center shrink-0 w-[90px]">
                {isRemixLoading ? <MiniSpinner/> : '생성'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
