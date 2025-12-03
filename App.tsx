import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Catalog } from './components/Catalog';
import { Orders } from './components/Orders';
import { PricingCalculator } from './components/PricingCalculator';
import { ProductionMode } from './components/ProductionMode';
import { Clients } from './components/Clients';
import { Login } from './components/Login';
import { Analysis } from './components/Analysis';
import { ViewState } from './types';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();
  // Default view is 'orders' as requested
  const [currentView, setCurrentView] = useState<ViewState>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-rose-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentView('production_mode');
  };

  const handleBackFromProduction = () => {
    setSelectedOrderId(null);
    setCurrentView('orders');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'catalog':
        return <Catalog />;
      case 'orders':
        return <Orders onSelectOrder={handleOrderSelect} />;
      case 'clients':
        return <Clients />;
      case 'calculator':
        return <PricingCalculator />;
      case 'analysis':
        return <Analysis />;
      case 'production_mode':
        if (selectedOrderId) {
          return <ProductionMode orderId={selectedOrderId} onBack={handleBackFromProduction} />;
        }
        return <Orders onSelectOrder={handleOrderSelect} />;
      default:
        return <Orders onSelectOrder={handleOrderSelect} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
}

export default App;