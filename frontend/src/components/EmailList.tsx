import React from 'react';
import { Email } from '../types';
import { format } from 'date-fns';
import { Star, Calendar, XCircle, AlertCircle, Mail } from 'lucide-react';

interface EmailListProps {
  emails: Email[];
  selectedEmail: Email | null;
  onEmailSelect: (email: Email) => void;
}

const EmailList: React.FC<EmailListProps> = ({ emails, selectedEmail, onEmailSelect }) => {
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Interested':
        return <Star className="w-4 h-4 text-green-600" />;
      case 'Meeting Booked':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'Not Interested':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Spam':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'Out of Office':
        return <Mail className="w-4 h-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Interested':
        return 'bg-green-100 text-green-800';
      case 'Meeting Booked':
        return 'bg-blue-100 text-blue-800';
      case 'Not Interested':
        return 'bg-red-100 text-red-800';
      case 'Spam':
        return 'bg-orange-100 text-orange-800';
      case 'Out of Office':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No emails found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={() => onEmailSelect(email)}
          className={`p-4 cursor-pointer transition-colors ${
            selectedEmail?.id === email.id
              ? 'bg-blue-50 border-l-4 border-blue-600'
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {email.from.name || email.from.address}
              </p>
              <p className="text-xs text-gray-500">{email.from.address}</p>
            </div>
            <div className="ml-2 flex items-center space-x-2">
              {email.category && getCategoryIcon(email.category)}
              <span className="text-xs text-gray-500">
                {format(new Date(email.date), 'MMM d')}
              </span>
            </div>
          </div>
          
          <p className="text-sm font-medium text-gray-900 truncate mb-1">
            {email.subject}
          </p>
          
          <p className="text-xs text-gray-600 line-clamp-2">
            {email.body}
          </p>

          {email.category && email.category !== 'Uncategorized' && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(email.category)}`}>
                {email.category}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EmailList;
