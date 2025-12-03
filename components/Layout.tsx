import React from 'react';
import { Home, List, Calculator, Users, LogOut, BarChart2 } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ currentView, onChangeView, children }) => {
  const { signOut } = useAuth();
  // If in production mode, we might hide the nav or render a different shell.
  // For now, if view is 'production_mode', the Layout children will handle the full screen, 
  // so we conditionally render the bottom nav.

  const showNav = currentView !== 'production_mode';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {showNav && (
        <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 py-3 flex justify-between items-center shadow-sm">
          <div className="w-8" /> {/* Spacer to center logo */}
          <img
            src="https://i.ibb.co/ZRBCN1DR/image.png"
            alt="Patty Crochê Logo"
            className="h-16 object-contain"
          />
          <button
            onClick={signOut}
            className="text-stone-400 hover:text-rose-600 transition p-2"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </header>
      )}

      <main className={`${showNav ? 'pb-20' : ''}`}>
        {children}
      </main>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg z-40 pb-safe">
          <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
            <button
              onClick={() => onChangeView('orders')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'orders' ? 'text-rose-600' : 'text-stone-400 hover:text-stone-600'
                }`}
            >
              <Home size={24} />
              <span className="text-[10px] font-medium">Pedidos</span>
            </button>

            <button
              onClick={() => onChangeView('catalog')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'catalog' ? 'text-rose-600' : 'text-stone-400 hover:text-stone-600'
                }`}
            >
              <List size={24} />
              <span className="text-[10px] font-medium">Catálogo</span>
            </button>

            <button
              onClick={() => onChangeView('clients')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'clients' ? 'text-rose-600' : 'text-stone-400 hover:text-stone-600'
                }`}
            >
              <Users size={24} />
              <span className="text-[10px] font-medium">Clientes</span>
            </button>

            <button
              onClick={() => onChangeView('calculator')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'calculator' ? 'text-rose-600' : 'text-stone-400 hover:text-stone-600'
                }`}
            >
              <Calculator size={24} />
              <span className="text-[10px] font-medium">Preços</span>
            </button>

            <button
              onClick={() => onChangeView('analysis')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'analysis' ? 'text-rose-600' : 'text-stone-400 hover:text-stone-600'
                }`}
            >
              <BarChart2 size={24} />
              <span className="text-[10px] font-medium">Análise</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};