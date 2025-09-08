"use client";

import { useState, useEffect } from 'react';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { CareRecordForm } from './CareRecordForm';
import { CareRecordsList } from './CareRecordsList';
import { ReportView } from './ReportView';
import { PhotoGallery } from './PhotoGallery';
import { ChatWindow } from './ChatWindow';
import { ResidentManagement } from './ResidentManagement';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'residents':
        return <ResidentManagement />;
      case 'care-record':
        return <CareRecordForm />;
      case 'care-records-list':
        return <CareRecordsList />;
      case 'reports':
        return <ReportView />;
      case 'photos':
        return <PhotoGallery />;
      case 'chat':
        return <ChatWindow />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
