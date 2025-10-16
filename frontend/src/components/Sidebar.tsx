import React from 'react';
import { EmailCategory } from '../types';
import { Inbox, Star, Calendar, XCircle, Mail, AlertCircle, Folder } from 'lucide-react';

interface SidebarProps {
  onFilterChange: (filters: any) => void;
  currentFilters: any;
}

const Sidebar: React.FC<SidebarProps> = ({ onFilterChange, currentFilters }) => {
  const categories = [
    { name: 'All Emails', category: undefined, icon: Inbox, color: 'text-gray-600' },
    { name: 'Interested', category: EmailCategory.INTERESTED, icon: Star, color: 'text-green-600' },
    { name: 'Meeting Booked', category: EmailCategory.MEETING_BOOKED, icon: Calendar, color: 'text-blue-600' },
    { name: 'Not Interested', category: EmailCategory.NOT_INTERESTED, icon: XCircle, color: 'text-red-600' },
    { name: 'Spam', category: EmailCategory.SPAM, icon: AlertCircle, color: 'text-orange-600' },
    { name: 'Out of Office', category: EmailCategory.OUT_OF_OFFICE, icon: Mail, color: 'text-purple-600' },
  ];

  const handleCategoryClick = (category?: EmailCategory) => {
    onFilterChange({ category, query: '' });
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Categories
        </h2>
        <nav className="space-y-1">
          {categories.map((item) => {
            const Icon = item.icon;
            const isActive = currentFilters.category === item.category;
            
            return (
              <button
                key={item.name}
                onClick={() => handleCategoryClick(item.category)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : item.color}`} />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Folders
          </h2>
          <nav className="space-y-1">
            <button
              onClick={() => onFilterChange({ folder: 'INBOX' })}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                currentFilters.folder === 'INBOX'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Folder className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium">Inbox</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
