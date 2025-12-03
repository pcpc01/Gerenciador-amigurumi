import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, MessageCircle, Calendar, Clock, Info, X, MapPin, User, FileText, Megaphone, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Order, Product, Client } from '../types';
import * as storage from '../services/storage_supabase';

interface Props {
  orderId: string;
  onBack: () => void;
}

export const ProductionMode: React.FC<Props> = ({ orderId, onBack }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const loadedOrder = await storage.getOrderById(orderId);
      if (loadedOrder) {
        setOrder(loadedOrder);
        setNotes(loadedOrder.progressNotes || '');

        const loadedProduct = await storage.getProductById(loadedOrder.productId);
        if (loadedProduct) {
          setProduct(loadedProduct);
          if (!loadedProduct.recipeText && loadedProduct.pdfLink) {
            setActiveTab('pdf');
          }
        }

        if (loadedOrder.clientId) {
          const loadedClient = await storage.getClientById(loadedOrder.clientId);
          if (loadedClient) {
            setClient(loadedClient);
          }
        }
      }
    };
    loadData();
  }, [orderId]);

  const handleSaveProgress = async () => {
    if (!order) return;
    setIsSaving(true);
    const updatedOrder = { ...order, progressNotes: notes };
    await storage.saveOrder(updatedOrder);
    setOrder(updatedOrder);
    setTimeout(() => setIsSaving(false), 800);
  };

  const updateStatus = async (newStatus: Order['status']) => {
    if (!order) return;
    const updated = { ...order, status: newStatus };
    await storage.saveOrder(updated);
    setOrder(updated);
  };

  if (!order || !product) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 shadow-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-stone-100 rounded-full transition text-stone-500 hover:text-stone-800"
              title="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-stone-800">{order.clientName}</h1>
                {client && (
                  <button
                    onClick={() => setIsClientModalOpen(true)}
                    className="text-stone-400 hover:text-rose-500 transition-colors"
                  >
                    <Info size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-1">
                Produzindo: <span className="font-medium text-rose-600">{product.name}</span>
                {product.category && <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">{product.category}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={order.status}
                onChange={(e) => updateStatus(e.target.value as Order['status'])}
                className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-full text-xs font-bold border outline-none transition-all hover:opacity-90 ${getStatusColor(order.status)}`}
              >
                <option value="pending">Aguardando Início</option>
                <option value="in_progress">Em Produção</option>
                <option value="done">Concluído</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 opacity-50">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-6">

          {/* Left Sidebar - Info & Progress */}
          <div className="md:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto md:overflow-visible pb-20 md:pb-0">

            {/* Order Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 flex justify-between items-center">
                <h3 className="font-semibold text-stone-700 text-sm">Detalhes do Pedido</h3>
                {order.orderSource && (
                  <span className="text-[10px] uppercase font-bold bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-500">
                    {order.orderSource}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-stone-400 uppercase font-bold block mb-1">Entrega</span>
                    <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                      <Calendar size={14} className="text-rose-500" />
                      {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-stone-400 uppercase font-bold block mb-1">Valor</span>
                    <div className="text-stone-700 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.finalPrice)}
                    </div>
                  </div>
                </div>

                {order.whatsapp && (
                  <a
                    href={`https://wa.me/55${order.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Progress Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 flex flex-col flex-1 min-h-[200px]">
              <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 flex justify-between items-center">
                <h3 className="font-semibold text-stone-700 text-sm flex items-center gap-2">
                  <Clock size={14} className="text-rose-500" />
                  Diário de Bordo
                </h3>
                {isSaving && <span className="text-[10px] text-rose-500 font-medium animate-pulse">Salvando...</span>}
              </div>
              <div className="flex-1 p-3">
                <textarea
                  className="w-full h-full resize-none outline-none text-sm text-stone-600 leading-relaxed placeholder:text-stone-300 bg-transparent"
                  placeholder="Anote aqui onde você parou...&#10;Ex: Carreira 15, braço esquerdo finalizado."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleSaveProgress}
                />
              </div>
              <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 text-[10px] text-stone-400 text-center">
                Salvo automaticamente ao sair do campo
              </div>
            </div>
          </div>

          {/* Right Area - Recipe */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-stone-200 flex flex-col overflow-hidden h-[600px] md:h-auto">
            {/* Tabs */}
            <div className="flex border-b border-stone-100">
              <button
                onClick={() => setActiveTab('text')}
                disabled={!product.recipeText}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'text'
                  ? 'border-rose-500 text-rose-600 bg-rose-50/30'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                  } ${!product.recipeText && 'opacity-50 cursor-not-allowed'}`}
              >
                <FileText size={16} />
                Receita Escrita
              </button>
              <button
                onClick={() => setActiveTab('pdf')}
                disabled={!product.pdfLink}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pdf'
                  ? 'border-rose-500 text-rose-600 bg-rose-50/30'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                  } ${!product.pdfLink && 'opacity-50 cursor-not-allowed'}`}
              >
                <ExternalLink size={16} />
                PDF / Drive
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white relative">
              {activeTab === 'text' ? (
                product.recipeText ? (
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-start justify-between mb-8 pb-6 border-b border-stone-100">
                      <div>
                        <h2 className="text-2xl font-bold text-stone-800 mb-2 flex items-center gap-2">
                          {product.name}
                          {product.category && <span className="text-sm font-normal bg-stone-100 text-stone-500 px-2 py-1 rounded border border-stone-200">{product.category}</span>}
                        </h2>
                        <div className="flex gap-2">
                          {product.weight && <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded">Peso: {product.weight}</span>}
                          {product.height && <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded">Alt: {product.height}</span>}
                        </div>
                      </div>
                      {product.photoUrl && (
                        <button
                          onClick={() => setIsPhotoModalOpen(true)}
                          className="w-20 h-20 rounded-lg overflow-hidden border border-stone-200 hover:border-rose-300 transition shadow-sm group relative"
                        >
                          <img src={product.photoUrl} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                            <ImageIcon size={20} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                          </div>
                        </button>
                      )}
                    </div>

                    <div className="prose prose-stone prose-sm md:prose-base max-w-none font-mono whitespace-pre-wrap text-stone-700 leading-loose">
                      {product.recipeText}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p>Nenhuma receita escrita disponível.</p>
                  </div>
                )
              ) : (
                // PDF View
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-stone-50 p-8 rounded-2xl border border-stone-100 max-w-md w-full">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ExternalLink size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-stone-800 mb-2">Arquivo Externo</h3>
                    <p className="text-stone-500 mb-6 text-sm">
                      A receita está salva em um arquivo PDF ou link externo (Google Drive, Dropbox, etc).
                    </p>
                    <a
                      href={product.pdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-rose-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-rose-700 transition shadow-lg shadow-rose-200"
                    >
                      Abrir Arquivo
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isClientModalOpen && client && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-bold text-stone-700">Dados do Cliente</h3>
              <button onClick={() => setIsClientModalOpen(false)}><X size={20} className="text-stone-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Nome</label>
                <p className="font-medium text-stone-800">{client.name}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">WhatsApp</label>
                <p className="font-medium text-stone-800">{client.whatsapp || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Endereço</label>
                <p className="text-sm text-stone-600 bg-stone-50 p-2 rounded border border-stone-100 mt-1">
                  {client.address || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Notas</label>
                <p className="text-sm text-stone-600 italic">
                  {client.notes || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPhotoModalOpen && product.photoUrl && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setIsPhotoModalOpen(false)}>
          <img
            src={product.photoUrl}
            alt={product.name}
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
