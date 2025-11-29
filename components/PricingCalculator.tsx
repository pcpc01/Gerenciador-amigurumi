import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Info, Package } from 'lucide-react';
import { PricingResult, Product } from '../types';
import * as storage from '../services/storage_supabase';

export const PricingCalculator: React.FC = () => {
  const [mode, setMode] = useState<'reverse' | 'forward'>('reverse'); // reverse = quero ganhar X, forward = vou vender por Y
  const [inputValue, setInputValue] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Default Fees Configuration
  const [fees, setFees] = useState({
    nuvemshop: { percent: 4.99, fixed: 0.35 },
    shopee: { percent: 20, fixed: 4.00 },
    elo7: { percent: 20, fixed: 6.00 }, // 20% + 6.00 subsidy
  });

  const [results, setResults] = useState<{
    nuvemshop: number;
    shopee: number;
    elo7: number;
  } | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const loadedProducts = await storage.getProducts();
    setProducts(loadedProducts.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const getElo7ServiceFee = (grossPrice: number) => {
    if (grossPrice <= 29.89) return 1.99;
    if (grossPrice <= 79.89) return 2.49;
    if (grossPrice <= 149.89) return 2.99;
    if (grossPrice <= 299.89) return 4.99;
    return 5.99;
  };

  const performCalculation = (val: number) => {
    if (isNaN(val) || val <= 0) return;

    let res = { nuvemshop: 0, shopee: 0, elo7: 0 };

    if (mode === 'reverse') {
      // Quero receber 'val' (Líquido) -> Qual deve ser o preço de venda (Bruto)?
      res.nuvemshop = (val + fees.nuvemshop.fixed) / (1 - fees.nuvemshop.percent / 100);

      // Shopee (Reverse) with Cap of R$ 105.00 on commission
      const shopeeGrossNoCap = (val + fees.shopee.fixed) / (1 - fees.shopee.percent / 100);
      const shopeeCommission = shopeeGrossNoCap * (fees.shopee.percent / 100);
      if (shopeeCommission > 105) {
        res.shopee = val + 105 + fees.shopee.fixed;
      } else {
        res.shopee = shopeeGrossNoCap;
      }

      // Elo7 Dynamic Calculation (Reverse)
      // Gross = (Net + FixedSubsidy + ServiceFee) / (1 - Percent)
      // We iterate to find the consistent bracket
      const brackets = [1.99, 2.49, 2.99, 4.99, 5.99];
      let foundElo7 = 0;

      for (const fee of brackets) {
        const candidateGross = (val + fees.elo7.fixed + fee) / (1 - fees.elo7.percent / 100);
        if (getElo7ServiceFee(candidateGross) === fee) {
          foundElo7 = candidateGross;
          break;
        }
      }
      // Fallback if boundary issues (rare), use the calculated one from the last attempt or a safe estimate
      if (foundElo7 === 0) {
        // Recalculate using the fee for the raw estimate
        const rawEstimate = (val + fees.elo7.fixed) / (1 - fees.elo7.percent / 100);
        const estimatedFee = getElo7ServiceFee(rawEstimate);
        foundElo7 = (val + fees.elo7.fixed + estimatedFee) / (1 - fees.elo7.percent / 100);
      }
      res.elo7 = foundElo7;

    } else {
      // Vou vender por 'val' (Bruto) -> Quanto vou receber (Líquido)?
      res.nuvemshop = val * (1 - fees.nuvemshop.percent / 100) - fees.nuvemshop.fixed;

      // Shopee (Forward) with Cap of R$ 105.00 on commission
      const shopeeCommission = val * (fees.shopee.percent / 100);
      const shopeeFinalCommission = Math.min(shopeeCommission, 105);
      res.shopee = val - shopeeFinalCommission - fees.shopee.fixed;

      // Elo7 Dynamic Calculation (Forward)
      const serviceFee = getElo7ServiceFee(val);
      res.elo7 = val * (1 - fees.elo7.percent / 100) - fees.elo7.fixed - serviceFee;
    }

    setResults(res);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setInputValue(product.basePrice.toFixed(2).replace('.', ','));
      performCalculation(product.basePrice);
    } else {
      setInputValue('');
      setResults(null);
    }
  };

  const calculate = () => {
    const val = parseFloat(inputValue.replace(',', '.'));
    performCalculation(val);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Calculadora de Preços</h2>
          <p className="text-stone-500 text-sm">Simule seus ganhos em diferentes plataformas</p>
        </div>


      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">

            {/* Product Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                <Package size={16} className="text-rose-500" />
                Selecionar Produto (Opcional)
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-stone-50"
              >
                <option value="">-- Digitar valor manualmente --</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="block text-sm font-medium text-stone-700 mb-2">
              {mode === 'reverse'
                ? 'Quanto você quer receber (Líquido)?'
                : 'Por quanto você vai vender (Bruto)?'}
            </label>
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-stone-500 font-bold">R$</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={(e) => {
                  // Allow only numbers and comma/dot
                  const val = e.target.value.replace(/[^0-9,.]/g, '');
                  setInputValue(val);
                  if (selectedProductId) setSelectedProductId(''); // Clear selection if user types manually
                }}
                className="pl-10 block w-full rounded-xl border-stone-300 border-2 bg-stone-50 p-3 text-lg font-bold text-stone-800 focus:ring-rose-500 focus:border-rose-500 outline-none"
                placeholder="0,00"
              />
            </div>

            <button
              onClick={calculate}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
            >
              <Calculator size={20} />
              Calcular
            </button>
          </div>

          {/* Fees Configuration (Collapsible or always visible) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Info size={14} /> Configurar Taxas
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-blue-600">Nuvemshop</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={fees.nuvemshop.percent}
                      onChange={e => setFees({ ...fees, nuvemshop: { ...fees.nuvemshop, percent: parseFloat(e.target.value) } })}
                      className="w-full border rounded p-1 pl-1 pr-6 text-right"
                    />
                    <span className="absolute right-2 top-1 text-stone-400">%</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1 text-stone-400">R$</span>
                    <input
                      type="number"
                      value={fees.nuvemshop.fixed}
                      onChange={e => setFees({ ...fees, nuvemshop: { ...fees.nuvemshop, fixed: parseFloat(e.target.value) } })}
                      className="w-full border rounded p-1 pl-6 text-right"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-orange-600">Shopee</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={fees.shopee.percent}
                      onChange={e => setFees({ ...fees, shopee: { ...fees.shopee, percent: parseFloat(e.target.value) } })}
                      className="w-full border rounded p-1 pl-1 pr-6 text-right"
                    />
                    <span className="absolute right-2 top-1 text-stone-400">%</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1 text-stone-400">R$</span>
                    <input
                      type="number"
                      value={fees.shopee.fixed}
                      onChange={e => setFees({ ...fees, shopee: { ...fees.shopee, fixed: parseFloat(e.target.value) } })}
                      className="w-full border rounded p-1 pl-6 text-right"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-yellow-600">Elo7</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={fees.elo7.percent}
                      onChange={e => setFees({ ...fees, elo7: { ...fees.elo7, percent: parseFloat(e.target.value) } })}
                      className="w-full border rounded p-1 pl-1 pr-6 text-right"
                    />
                    <span className="absolute right-2 top-1 text-stone-400">%</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1 text-stone-400">R$</span>
                    <input
                      type="number"
                      value={fees.elo7.fixed}
                      onChange={e => setFees({ ...fees, elo7: { ...fees.elo7, fixed: parseFloat(e.target.value) } })}
                      className="w-full border rounded p-1 pl-6 text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-4">
          {!results ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200 min-h-[300px]">
              <Calculator size={48} className="mb-4 opacity-20" />
              <p>Preencha o valor e clique em calcular</p>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">Nuvemshop</h3>
                    <p className="text-sm text-blue-600 opacity-80">Melhor opção para site próprio</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-500 uppercase font-bold mb-1">
                      {mode === 'reverse' ? 'Vender por' : 'Você recebe'}
                    </p>
                    <p className="text-3xl font-bold text-stone-800">{formatCurrency(results.nuvemshop)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-stone-100 flex gap-4 text-xs text-stone-500">
                  <span>Taxa: {fees.nuvemshop.percent}%</span>
                  <span>Fixo: R$ {fees.nuvemshop.fixed.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-orange-900">Shopee</h3>
                    <p className="text-sm text-orange-600 opacity-80">Alta visibilidade, taxas maiores</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-500 uppercase font-bold mb-1">
                      {mode === 'reverse' ? 'Vender por' : 'Você recebe'}
                    </p>
                    <p className="text-3xl font-bold text-stone-800">{formatCurrency(results.shopee)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-stone-100 flex gap-4 text-xs text-stone-500">
                  <span>Taxa: {fees.shopee.percent}%</span>
                  <span>Fixo: R$ {fees.shopee.fixed.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-yellow-900">Elo7</h3>
                    <p className="text-sm text-yellow-600 opacity-80">Focado em artesanato</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-500 uppercase font-bold mb-1">
                      {mode === 'reverse' ? 'Vender por' : 'Você recebe'}
                    </p>
                    <p className="text-3xl font-bold text-stone-800">{formatCurrency(results.elo7)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-4 text-xs text-stone-500">
                  <span>Taxa: {fees.elo7.percent}%</span>
                  <span>Fixo (Frete): R$ {fees.elo7.fixed.toFixed(2)}</span>
                  <span className="text-yellow-700 font-medium">
                    Serviço: {formatCurrency(getElo7ServiceFee(mode === 'reverse' ? results.elo7 : parseFloat(inputValue.replace(',', '.') || '0')))}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
