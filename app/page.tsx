'use client';

import { useState } from 'react';
import { Download, Link, MessageSquare, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// Progress Bar Component
interface ProgressBarProps {
  progress: number;
  text: string;
  className?: string;
}

function ProgressBar({ progress, text, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-800">{text}</span>
        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="relative w-full bg-gray-100 rounded-full h-3 shadow-inner">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm relative overflow-hidden"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
          {/* Moving shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-bounce"></div>
        </div>
        {/* Progress indicator dot */}
        <div 
          className="absolute top-0 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-blue-600 transform -translate-y-0.5 transition-all duration-500 ease-out"
          style={{ left: `calc(${Math.min(100, Math.max(0, progress))}% - 6px)` }}
        ></div>
      </div>
    </div>
  );
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  hasCodeBlocks?: boolean;
  hasLinks?: boolean;
  hasImages?: boolean;
}

interface ParseResult {
  messages: Message[];
  csv: string;
  messageCount: number;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setProgress(0);
    setProgressText('Starting conversation parsing...');
    setError(null);
    setResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Don't go to 100% until we're done
          return prev + Math.random() * 10;
        });
      }, 200);

      // Update progress text
      const textInterval = setInterval(() => {
        setProgressText(prev => {
          const texts = [
            'Starting conversation parsing...',
            'Fetching conversation data...',
            'Analyzing message content...',
            'Detecting code blocks and images...',
            'Generating CSV output...',
            'Finalizing results...'
          ];
          const currentIndex = texts.indexOf(prev);
          return texts[Math.min(currentIndex + 1, texts.length - 1)];
        });
      }, 1000);

      const response = await fetch('/api/parse-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      clearInterval(progressInterval);
      clearInterval(textInterval);

      setProgress(95);
      setProgressText('Processing response...');

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse conversation');
      }

      setProgress(100);
      setProgressText('Complete!');
      setResult(data);

      // Reset progress after a short delay
      setTimeout(() => {
        setProgress(0);
        setProgressText('');
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgress(0);
      setProgressText('');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!result?.csv) return;

    const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `chatgpt-conversation-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyCSV = async () => {
    if (!result?.csv) return;
    
    try {
      await navigator.clipboard.writeText(result.csv);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy CSV:', err);
    }
  };

  const downloadPDF = async () => {
    if (!result?.messages) return;
    
    setExporting(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: result.messages,
          url: url,
          title: `ChatGPT Conversation - ${new Date().toLocaleDateString()}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `chatgpt-conversation-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const downloadJSON = () => {
    if (!result?.messages) return;
    
    const jsonData = {
      metadata: {
        url: url,
        exportDate: new Date().toISOString(),
        messageCount: result.messageCount,
        source: 'ChatGPT Parser'
      },
      messages: result.messages
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `chatgpt-conversation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">ChatGPT Conversation Parser</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Parse ChatGPT conversation links and export them as CSV files. 
            Simply paste a ChatGPT share link and get a downloadable CSV with all messages.
          </p>
        </div>

        {/* Input Form */}
        <div className="card max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                ChatGPT Share URL
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://chatgpt.com/share/..."
                  className="input-field pl-10"
                  disabled={loading}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Enter a public ChatGPT conversation share link
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className={`w-full flex items-center justify-center py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
                loading 
                  ? 'bg-gray-50 border-2 border-blue-200 cursor-not-allowed' 
                  : 'btn-primary hover:shadow-lg'
              }`}
            >
              {loading ? (
                <ProgressBar progress={progress} text={progressText} />
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Parse & Generate CSV
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card max-w-2xl mx-auto mb-8 border-red-200 bg-red-50">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="card max-w-2xl mx-auto border-green-200 bg-green-50">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Success!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Parsed {result.messageCount} messages from the conversation
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={downloadCSV}
                  className="btn-primary flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </button>
                <button
                  onClick={copyCSV}
                  className="btn-secondary flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Copy CSV
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={exporting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {exporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {exporting ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={downloadJSON}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download JSON
                </button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>CSV:</strong> Best for data analysis in Excel/Google Sheets</p>
                <p><strong>PDF:</strong> Best for visual preservation and sharing</p>
                <p><strong>JSON:</strong> Best for data portability and integration</p>
              </div>
            </div>

            {/* CSV Preview */}
            <div className="card max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CSV Preview</h3>
              <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Message #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Content</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Quote Block</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Links</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Images</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.messages.map((message, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900 border-b">{index + 1}</td>
                          <td className="px-4 py-2 text-sm border-b">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              message.role === 'user' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {message.role === 'user' ? 'User' : 'Assistant'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 border-b max-w-md">
                            <div className="truncate" title={message.content}>
                              {message.content.length > 100 
                                ? `${message.content.substring(0, 100)}...` 
                                : message.content
                              }
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center text-sm border-b">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              message.hasCodeBlocks 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {message.hasCodeBlocks ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center text-sm border-b">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              message.hasLinks 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {message.hasLinks ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center text-sm border-b">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              message.hasImages 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {message.hasImages ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 border-b">
                            {message.timestamp ? new Date(message.timestamp).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Built with Next.js and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}
