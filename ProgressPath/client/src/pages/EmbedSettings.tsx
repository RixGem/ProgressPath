import { useState } from 'react';

const EmbedSettings = () => {
  const [token, setToken] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateToken = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/embed/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Embed Settings
          </h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              JWT Token Generator
            </h2>
            <p className="text-gray-600 mb-4">
              Generate a JWT token to embed ProgressPath content on external websites.
              This token will allow secure, read-only access to your progress data.
            </p>
            
            <button
              onClick={generateToken}
              disabled={isGenerating}
              className={
                `px-6 py-3 rounded-md font-medium text-white transition-colors ${
                  isGenerating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`
              }
            >
              {isGenerating ? 'Generating...' : 'Generate Token'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {token && (
            <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Token
                </h3>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
              <div className="bg-white p-4 rounded border border-gray-300 overflow-x-auto">
                <code className="text-sm text-gray-800 break-all">{token}</code>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Keep this token secure. It provides access to your progress data.
              </p>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">
              Security Notice
            </h3>
            <p className="text-sm text-yellow-800">
              This token should be used only for embedding read-only content.
              Do not share this token publicly or use it in insecure contexts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedSettings;
