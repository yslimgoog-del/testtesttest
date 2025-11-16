
import React, { useState, useCallback, useEffect } from 'react';
import { generateWallpapers } from './services/geminiService';
import { getApiKey } from './services/apiKeyService';
import Spinner from './components/Spinner';
import ImageModal from './components/ImageModal';
import ApiKeyManager from './components/ApiKeyManager';

// --- Helper Components ---

const SettingsIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 cursor-pointer text-gray-400 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Header: React.FC<{ onSettingsClick: () => void }> = ({ onSettingsClick }) => (
    <header className="text-center p-4 pt-6 relative">
        <div className="absolute top-6 right-6">
            <SettingsIcon onClick={onSettingsClick} />
        </div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          AI 배경화면 생성기
        </h1>
        <p className="text-gray-400 mt-2">당신만의 특별한 휴대폰 배경화면을 만들어보세요.</p>
    </header>
);

interface PromptFormProps {
    prompt: string;
    setPrompt: (value: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
    isKeySet: boolean;
    onSettingsClick: () => void;
}

const PromptForm: React.FC<PromptFormProps> = ({ prompt, setPrompt, onGenerate, isLoading, isKeySet, onSettingsClick }) => (
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700">
        {!isKeySet && (
            <div className="max-w-xl mx-auto mb-2 text-center text-sm bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-2 rounded-lg">
                API 키가 설정되지 않았습니다. <button onClick={onSettingsClick} className="font-bold underline hover:text-white">여기</button>를 클릭하여 키를 설정해주세요.
            </div>
        )}
        <div className="max-w-xl mx-auto flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 고요한 밤하늘의 은하수"
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white transition-shadow disabled:opacity-50"
              disabled={isLoading || !isKeySet}
            />
            <button
              onClick={onGenerate}
              disabled={isLoading || !isKeySet}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              생성
            </button>
        </div>
    </div>
);

interface ImageGridProps {
    images: string[];
    onImageClick: (url: string) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, onImageClick }) => (
    <div className="grid grid-cols-2 gap-4 p-4 max-w-xl mx-auto">
        {images.map((img, index) => (
          <div 
            key={index} 
            className="aspect-[9/16] rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-purple-500/30" 
            onClick={() => onImageClick(img)}>
            <img src={img} alt={`Generated wallpaper ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
    </div>
);

const WelcomeMessage: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center p-8 mt-10">
        <svg className="w-24 h-24 mb-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-2xl font-semibold mb-2">어떤 배경화면을 만들어 볼까요?</h2>
        <p className="text-gray-400">화면 하단에 원하는 분위기를 설명하고 '생성' 버튼을 눌러보세요.</p>
    </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('비 오는 서정적인 도시 풍경');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkApiKey = async () => {
      const key = await getApiKey();
      setIsApiKeySet(!!key);
    };
    checkApiKey();
  }, []);

  const executeGeneration = useCallback(async (generationPrompt: string) => {
    if (!isApiKeySet) {
      setError('API 키를 먼저 설정해주세요.');
      setIsApiModalOpen(true);
      return;
    }
    if (!generationPrompt.trim()) {
      setError('배경화면으로 만들고 싶은 분위기를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setImages([]);

    try {
      const generatedImages = await generateWallpapers(generationPrompt);
      setImages(generatedImages);
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [isApiKeySet]);

  const handleGenerate = useCallback(() => {
    executeGeneration(prompt);
  }, [prompt, executeGeneration]);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };
  
  const handleKeySaved = () => {
    setIsApiKeySet(true);
    setIsApiModalOpen(false);
    setError(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      <Header onSettingsClick={() => setIsApiModalOpen(true)} />
      
      <main className="flex-grow pb-28">
        {isLoading && <div className="mt-10"><Spinner /></div>}
        {error && <p className="text-red-500 text-center mt-4 p-4">{error}</p>}
        
        {!isLoading && images.length === 0 && !error && <WelcomeMessage />}
        
        {images.length > 0 && <ImageGrid images={images} onImageClick={handleImageClick} />}
      </main>

      <PromptForm 
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerate={handleGenerate}
        isLoading={isLoading}
        isKeySet={isApiKeySet}
        onSettingsClick={() => setIsApiModalOpen(true)}
      />

      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          onClose={handleCloseModal}
        />
      )}
      
      {isApiModalOpen && (
        <ApiKeyManager 
            onClose={() => setIsApiModalOpen(false)}
            onKeySaved={handleKeySaved}
        />
      )}
    </div>
  );
};

export default App;
