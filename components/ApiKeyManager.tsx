
import React, { useState, useEffect, useCallback } from 'react';
import { saveApiKey, getApiKey, deleteApiKey, testApiKey } from '../services/apiKeyService';

const MiniSpinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface ApiKeyManagerProps {
  onClose: () => void;
  onKeySaved: () => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isKeyPresent, setIsKeyPresent] = useState(false);

  useEffect(() => {
    const fetchKey = async () => {
      const key = await getApiKey();
      if (key) {
        setIsKeyPresent(true);
        // For security, we don't display the key.
        // The input can be used to overwrite it.
      }
    };
    fetchKey();
  }, []);

  const handleSaveAndTest = useCallback(async () => {
    if (!apiKey.trim()) {
      setErrorMessage('API 키를 입력해주세요.');
      setTestStatus('error');
      return;
    }

    setIsTesting(true);
    setTestStatus('idle');
    setErrorMessage('');

    const isValid = await testApiKey(apiKey);

    if (isValid) {
      await saveApiKey(apiKey);
      setTestStatus('success');
      setIsKeyPresent(true);
      setTimeout(() => {
        onKeySaved();
      }, 1000);
    } else {
      setTestStatus('error');
      setErrorMessage('API 키가 유효하지 않거나 연결에 실패했습니다.');
    }

    setIsTesting(false);
  }, [apiKey, onKeySaved]);

  const handleDelete = async () => {
    await deleteApiKey();
    setApiKey('');
    setIsKeyPresent(false);
    setTestStatus('idle');
    setErrorMessage('');
    // Notify parent that key is now removed (optional, depends on desired behavior)
    // For now, user has to re-add a key to proceed.
    window.location.reload(); // Easiest way to reset app state
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">API Key 설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <p className="text-gray-400 mb-4 text-sm">
          Gemini API 키를 입력해주세요. 이 앱은 Vercel과 같은 정적 사이트 호스팅에 배포 가능하도록 설계되었습니다. 입력하신 키는 서버로 전송되지 않으며, 당신의 브라우저 내 저장소(LocalStorage)에만 암호화되어 안전하게 보관됩니다.
        </p>

        {isKeyPresent && !apiKey && (
            <div className="bg-blue-900/50 text-blue-300 border border-blue-700 p-3 rounded-md mb-4 text-sm">
                저장된 API 키가 있습니다. 새 키를 입력하여 덮어쓸 수 있습니다.
            </div>
        )}

        <div className="space-y-4">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy... 키를 여기에 붙여넣으세요"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          />
          
          <div className="flex items-center justify-between gap-2">
            {isKeyPresent && (
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-700/80 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                    키 삭제
                </button>
            )}
            <div className="flex-grow"></div>
            <button
              onClick={handleSaveAndTest}
              disabled={isTesting}
              className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isTesting ? <MiniSpinner /> : null}
              {isTesting ? '테스트 중...' : '저장 및 테스트'}
            </button>
          </div>
        </div>
        
        {testStatus === 'success' && (
          <p className="text-green-400 text-center mt-4 text-sm">성공! API 키가 유효하며 저장되었습니다.</p>
        )}
        {testStatus === 'error' && (
          <p className="text-red-400 text-center mt-4 text-sm">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default ApiKeyManager;
