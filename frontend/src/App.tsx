import React, { useState, useEffect } from 'react';
import { Email, EmailCategory } from './types';
import { emailApi } from './api';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import { Mail, Loader2 } from 'lucide-react';

function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    account?: string;
    folder?: string;
    category?: EmailCategory;
    query?: string;
  }>({});

  useEffect(() => {
    loadEmails();
  }, [filters]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const response = filters.query
        ? await emailApi.searchEmails(filters)
        : await emailApi.getAllEmails(filters);
      
      if (response.success) {
        setEmails(response.data.emails || []);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
  };

  const handleSearch = (query: string) => {
    setFilters({ ...filters, query });
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters });
    setSelectedEmail(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar onFilterChange={handleFilterChange} currentFilters={filters} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Email Onebox</h1>
            </div>
            <SearchBar onSearch={handleSearch} />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <EmailList
                emails={emails}
                selectedEmail={selectedEmail}
                onEmailSelect={handleEmailSelect}
              />
            )}
          </div>

          {/* Email Detail */}
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            {selectedEmail ? (
              <EmailDetail email={selectedEmail} onRefresh={loadEmails} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Select an email to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
