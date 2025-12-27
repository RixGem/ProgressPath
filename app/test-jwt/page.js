'use client';

import { useState } from 'react';

export default function JWTTestPage() {
  const [accessToken, setAccessToken] = useState('');
  const [duration, setDuration] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [requestInfo, setRequestInfo] = useState(null);
  const [responseInfo, setResponseInfo] = useState(null);
  const [jwtToken, setJwtToken] = useState(null);
  const [decodedPayload, setDecodedPayload] = useState(null);
  const [error, setError] = useState(null);
  const [timing, setTiming] = useState(null);

  // Decode JWT payload
  const decodeJWT = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload;
    } catch (err) {
      console.error('Failed to decode JWT:', err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponseInfo(null);
    setJwtToken(null);
    setDecodedPayload(null);

    const startTime = performance.now();

    try {
      // Prepare request
      const requestBody = { duration };
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };

      setRequestInfo({
        url: '/api/auth/generate-embed-token',
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
        timestamp: new Date().toISOString(),
      });

      console.log('🚀 Sending request:', {
        url: '/api/auth/generate-embed-token',
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
      });

      // Make the API call
      const response = await fetch('/api/auth/generate-embed-token', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });

      const endTime = performance.now();
      const timeTaken = endTime - startTime;

      setTiming({
        duration: timeTaken.toFixed(2),
        start: new Date(Date.now() - timeTaken).toISOString(),
        end: new Date().toISOString(),
      });

      // Get response headers
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      const responseData = await response.json();

      console.log('✅ Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseData,
        timeTaken: `${timeTaken.toFixed(2)}ms`,
      });

      setResponseInfo({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseData,
        ok: response.ok,
      });

      if (response.ok && responseData.token) {
        setJwtToken(responseData.token);
        const decoded = decodeJWT(responseData.token);
        setDecodedPayload(decoded);
        console.log('🔓 Decoded JWT payload:', decoded);
      } else {
        const errorMsg = responseData.error || responseData.message || 'Unknown error occurred';
        setError({
          message: errorMsg,
          status: response.status,
          details: responseData,
        });
        console.error('❌ Error response:', {
          status: response.status,
          error: errorMsg,
          details: responseData,
        });
      }
    } catch (err) {
      const endTime = performance.now();
      const timeTaken = endTime - startTime;

      setTiming({
        duration: timeTaken.toFixed(2),
        start: new Date(Date.now() - timeTaken).toISOString(),
        end: new Date().toISOString(),
      });

      console.error('💥 Request failed:', err);
      setError({
        message: err.message,
        type: err.name,
        stack: err.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            JWT API Test Page
          </h1>
          <p className="text-gray-600 mb-6">
            Test the <code className="bg-gray-100 px-2 py-1 rounded">/api/auth/generate-embed-token</code> endpoint
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Access Token *
              </label>
              <textarea
                id="accessToken"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Paste your Supabase access token here..."
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Token Duration
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1d">1 Day</option>
                <option value="7d">7 Days (Default)</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !accessToken}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Testing...' : 'Generate Embed Token'}
            </button>
          </form>
        </div>

        {/* Timing Information */}
        {timing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">⏱️ Timing Information</h2>
            <div className="space-y-1 text-sm font-mono">
              <div><span className="font-bold">Duration:</span> {timing.duration}ms</div>
              <div><span className="font-bold">Started:</span> {timing.start}</div>
              <div><span className="font-bold">Completed:</span> {timing.end}</div>
            </div>
          </div>
        )}

        {/* Request Information */}
        {requestInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">📤 Request Details</h2>
            <div className="space-y-3">
              <div>
                <span className="font-bold text-sm text-gray-700">URL:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm overflow-x-auto">{requestInfo.url}</pre>
              </div>
              <div>
                <span className="font-bold text-sm text-gray-700">Method:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm">{requestInfo.method}</pre>
              </div>
              <div>
                <span className="font-bold text-sm text-gray-700">Headers:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm overflow-x-auto">
                  {JSON.stringify(requestInfo.headers, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-bold text-sm text-gray-700">Body:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm overflow-x-auto">
                  {JSON.stringify(requestInfo.body, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-bold text-sm text-gray-700">Timestamp:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm">{requestInfo.timestamp}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Error Information */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-900 mb-3">❌ Error Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-bold text-sm text-red-700">Message:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm text-red-600">{error.message}</pre>
              </div>
              {error.status && (
                <div>
                  <span className="font-bold text-sm text-red-700">Status Code:</span>
                  <pre className="bg-white p-2 rounded mt-1 text-sm">{error.status}</pre>
                </div>
              )}
              {error.type && (
                <div>
                  <span className="font-bold text-sm text-red-700">Error Type:</span>
                  <pre className="bg-white p-2 rounded mt-1 text-sm">{error.type}</pre>
                </div>
              )}
              {error.details && (
                <div>
                  <span className="font-bold text-sm text-red-700">Additional Details:</span>
                  <pre className="bg-white p-2 rounded mt-1 text-sm overflow-x-auto">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                </div>
              )}
              {error.stack && (
                <div>
                  <span className="font-bold text-sm text-red-700">Stack Trace:</span>
                  <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Response Information */}
        {responseInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-900 mb-3">📥 Response Details</h2>
            <div className="space-y-3">
              <div>
                <span className="font-bold text-sm text-green-700">Status:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm">
                  {responseInfo.status} {responseInfo.statusText}
                </pre>
              </div>
              <div>
                <span className="font-bold text-sm text-green-700">OK:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm">
                  {responseInfo.ok ? '✅ Yes' : '❌ No'}
                </pre>
              </div>
              <div>
                <span className="font-bold text-sm text-green-700">Headers:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm overflow-x-auto">
                  {JSON.stringify(responseInfo.headers, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-bold text-sm text-green-700">Body:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm overflow-x-auto">
                  {JSON.stringify(responseInfo.body, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* JWT Token Display */}
        {jwtToken && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-purple-900 mb-3">🔑 Generated JWT Token</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-purple-700">Token:</span>
                  <button
                    onClick={() => copyToClipboard(jwtToken)}
                    className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                  >
                    Copy Token
                  </button>
                </div>
                <pre className="bg-white p-2 rounded text-xs overflow-x-auto break-all whitespace-pre-wrap">
                  {jwtToken}
                </pre>
              </div>
              <div>
                <span className="font-bold text-sm text-purple-700">Token Length:</span>
                <pre className="bg-white p-2 rounded mt-1 text-sm">{jwtToken.length} characters</pre>
              </div>
            </div>
          </div>
        )}

        {/* Decoded Payload */}
        {decodedPayload && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-3">🔓 Decoded JWT Payload</h2>
            <pre className="bg-white p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(decodedPayload, null, 2)}
            </pre>
            {decodedPayload.exp && (
              <div className="mt-3 space-y-1 text-sm">
                <div>
                  <span className="font-bold">Expires At:</span>{' '}
                  {new Date(decodedPayload.exp * 1000).toLocaleString()}
                </div>
                <div>
                  <span className="font-bold">Issued At:</span>{' '}
                  {decodedPayload.iat ? new Date(decodedPayload.iat * 1000).toLocaleString() : 'N/A'}
                </div>
                <div>
                  <span className="font-bold">Valid For:</span>{' '}
                  {decodedPayload.exp && decodedPayload.iat
                    ? `${Math.round((decodedPayload.exp - decodedPayload.iat) / 86400)} days`
                    : 'N/A'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Console Log Notice */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">💡 Developer Tips</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Check the browser console for detailed logs of all requests and responses</li>
            <li>All request/response data is logged with emoji prefixes for easy identification</li>
            <li>Use the Copy Token button to quickly copy the JWT for testing in other tools</li>
            <li>Token payload shows expiration times in both Unix timestamp and human-readable format</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
