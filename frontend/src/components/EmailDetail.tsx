import React, { useState } from 'react';
import { Email, SuggestedReply } from '../types';
import { emailApi } from '../api';
import { format } from 'date-fns';
import { Sparkles, RefreshCw, Loader2, Copy, Check } from 'lucide-react';

interface EmailDetailProps {
  email: Email;
  onRefresh: () => void;
}

const EmailDetail: React.FC<EmailDetailProps> = ({ email, onRefresh }) => {
  const [suggestedReply, setSuggestedReply] = useState<SuggestedReply | null>(null);
  const [loadingReply, setLoadingReply] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSuggestReply = async () => {
    setLoadingReply(true);
    try {
      const response = await emailApi.suggestReply(email.id);
      if (response.success) {
        setSuggestedReply(response.data);
      }
    } catch (error) {
      console.error('Error suggesting reply:', error);
    } finally {
      setLoadingReply(false);
    }
  };

  const handleRecategorize = async () => {
    setCategorizing(true);
    try {
      await emailApi.categorizeEmail(email.id);
      onRefresh();
    } catch (error) {
      console.error('Error categorizing email:', error);
    } finally {
      setCategorizing(false);
    }
  };

  const handleCopyReply = () => {
    if (suggestedReply) {
      navigator.clipboard.writeText(suggestedReply.suggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Interested':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Meeting Booked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Not Interested':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Spam':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Out of Office':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Email Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{email.subject}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">From:</span>{' '}
                {email.from.name || email.from.address}
              </div>
              <div>
                <span className="font-medium">Date:</span>{' '}
                {format(new Date(email.date), 'PPpp')}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Account:</span> {email.account}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {email.category && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(email.category)}`}>
                {email.category}
              </span>
            )}
            <button
              onClick={handleRecategorize}
              disabled={categorizing}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {categorizing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Recategorize</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleSuggestReply}
            disabled={loadingReply}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingReply ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="font-medium">AI Suggest Reply</span>
          </button>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        <div className="prose max-w-none">
          {email.bodyHtml ? (
            <div dangerouslySetInnerHTML={{ __html: email.bodyHtml }} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-gray-800">
              {email.body}
            </pre>
          )}
        </div>

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Attachments ({email.attachments.length})
            </h3>
            <div className="space-y-2">
              {email.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(attachment.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested Reply */}
      {suggestedReply && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                AI Suggested Reply
              </h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                {(suggestedReply.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <button
              onClick={handleCopyReply}
              className="flex items-center space-x-2 px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Copy</span>
                </>
              )}
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-gray-800 whitespace-pre-wrap">
              {suggestedReply.suggestion}
            </p>
          </div>

          {suggestedReply.context.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-1">Context used:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedReply.context.map((ctx, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white text-xs text-gray-700 rounded border border-gray-200"
                  >
                    {ctx.substring(0, 50)}...
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailDetail;
