import React, { useState } from 'react';
import { Calculator, DollarSign, Info } from 'lucide-react';
import { PricingResult } from '../types';

export const PricingCalculator: React.FC = () => {
  const [netValue, setNetValue] = useState<string>('');
  const [results, setResults] = useState<PricingResult | null>(null);

  const calculate = () => {
    const val = parseFloat(netValue.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    // Formulas provided in prompt
    // Nuvemshop: (Valor Líquido + 0.35) / 0.9501
    // Shopee: (Valor Líquido + 4.00) / 0.80
    // Elo7: (Valor Líquido + 3.99) / 0.80

    const nuvemshop = (val + 0.35) / 0.9501;
    const shopee = (val + 4.00) / 0.80;
    const elo7 = (val + 3.99) / 0.80;

    setResults({ nuvemshop, shopee, elo7 });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
            <Calculator size={24} />
          </div>
          <h2 className="text-xl font-bold text-stone-800">Calculadora Reversa</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">
              Valor Líquido Desejado (Quanto quer receber?)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-stone-500">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={netValue}
                onChange={(e) => setNetValue(e.target.value)}
                className="pl-10 block w-full rounded-lg border-stone-300 border bg-stone-50 p-3 focus:ring-rose-500 focus:border-rose-500"
                placeholder="0,00"
              />
            </div>
          </div>

          <button
            onClick={calculate}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Calculator size={18} />
            Calcular Preços
          </button>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nuvemshop Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Nuvemshop</h3>
            <p className="mt-2 text-2xl font-bold text-stone-800">{formatCurrency(results.nuvemshop)}</p>
            <div className="mt-2 text-xs text-stone-400 flex items-start gap-1">
              <Info size={12} className="mt-0.5" />
              <span>Taxa 4,99% + R$ 0,35</span>
            </div>
          </div>

          {/* Shopee Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-500">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Shopee</h3>
            <p className="mt-2 text-2xl font-bold text-stone-800">{formatCurrency(results.shopee)}</p>
            <div className="mt-2 text-xs text-stone-400 flex items-start gap-1">
              <Info size={12} className="mt-0.5" />
              <span>Taxa 20% + R$ 4,00</span>
            </div>
          </div>

          {/* Elo7 Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Elo7</h3>
            <p className="mt-2 text-2xl font-bold text-stone-800">{formatCurrency(results.elo7)}</p>
            <div className="mt-2 text-xs text-stone-400 flex items-start gap-1">
              <Info size={12} className="mt-0.5" />
              <span>Taxa 20% + R$ 3,99</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
