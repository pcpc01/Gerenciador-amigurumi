import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ExternalLink, Save, MessageCircle, Calendar, CheckCircle, Clock, Info, X, MapPin, User, FileText, Megaphone, Image as ImageIcon } from 'lucide-react';
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
          // Default to PDF if no text recipe exists
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
    return <div className="p-8 text-center">Carregando dados...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full transition">
          <ArrowLeft className="text-stone-600" />
        </button>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-stone-800 truncate">{order.clientName}</h1>
            {client && (
              <button
                onClick={() => setIsClientModalOpen(true)}
                className="text-stone-400 hover:text-rose-500 transition-colors"
                title="Ver dados do cliente"
              >
                <Info size={18} />
              </button>
            )}
          </div>
          <p className="text-xs text-stone-500 truncate">Produzindo: {product.name}</p>
        </div>

        <div className="relative">
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value as Order['status'])}
            className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-full text-xs font-bold border-none outline-none transition-colors ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                order.status === 'done' ? 'bg-green-100 text-green-700' :
                  order.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                    'bg-red-100 text-red-700'
              }`}
          >
            <option value="pending">Aguardando Início</option>
            <option value="in_progress">Em Produção</option>
            <option value="done">Concluído</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
          {/* Custom arrow icon for the select */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Left Panel: Context & Progress (Mobile: Top) */}
        <div className="md:w-80 lg:w-96 bg-white border-r border-stone-200 flex flex-col md:h-full shrink-0 overflow-y-auto md:overflow-hidden">

          {/* Order Info Card */}
          <div className="p-4 border-b border-stone-100 bg-rose-50/50 shrink-0">
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-stone-400 text-xs block">Data Pedido</span>
                <div className="font-medium text-stone-700">
                  {order.orderDate ? new Date(order.orderDate).toLocaleDateString('pt-BR') : '-'}
                </div>
              </div>
              <div>
                <span className="text-stone-400 text-xs block">Entrega</span>
                <div className="flex items-center gap-1 font-medium text-stone-700">
                  <Calendar size={14} />
                  {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="col-span-2 flex justify-between">
                <div>
                  <span className="text-stone-400 text-xs block">Valor</span>
                  <div className="font-medium text-stone-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.finalPrice)}
                  </div>
                </div>
                {order.orderSource && (
                  <div className="text-right">
                    <span className="text-stone-400 text-xs block flex items-center justify-end gap-1"><Megaphone size={10} /> Canal</span>
                    <div className="font-medium text-stone-700 text-sm bg-white/50 px-2 rounded">
                      {order.orderSource}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {order.whatsapp && (
              <a
                href={`https://wa.me/${order.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition"
              >
                <MessageCircle size={16} /> Contatar Cliente
              </a>
            )}
          </div>

          {/* Progress Tracking */}
          <div className="p-4 flex flex-col flex-1 border-b border-stone-100 min-h-[180px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-stone-700 flex items-center gap-2">
                <Clock size={16} className="text-rose-500" />
                Progresso Atual
              </h3>
              {isSaving && <span className="text-xs text-rose-500 animate-pulse">Salvando...</span>}
            </div>
            <textarea
              className="flex-1 w-full border border-stone-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none bg-yellow-50/30"
              placeholder="Anote aqui onde você parou (ex: Carreira 15, perna direita)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveProgress}
            />
            <p className="text-xs text-stone-400 mt-2 text-center">
              Suas anotações são salvas automaticamente.
            </p>
          </div>
        </div>

        {/* Right Panel: Recipe Workspace (Mobile: Bottom) */}
        <div className="flex-1 flex flex-col bg-stone-50 h-full overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-stone-200 bg-white">
            <button
              onClick={() => setActiveTab('text')}
              disabled={!product.recipeText}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'text'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
                } ${!product.recipeText && 'opacity-50 cursor-not-allowed'}`}
            >
              Receita em Texto
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              disabled={!product.pdfLink}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pdf'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-stone-500 hover:text-stone-700'
                } ${!product.pdfLink && 'opacity-50 cursor-not-allowed'}`}
            >
              Arquivo PDF
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 recipe-scroll relative">
            {activeTab === 'text' ? (
              product.recipeText ? (
                <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 shadow-sm rounded-xl min-h-full">
                  <div className="border-b border-stone-100 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => product.photoUrl && setIsPhotoModalOpen(true)}
                        className={`text-2xl font-bold text-stone-800 flex items-center gap-2 group transition-colors text-left ${product.photoUrl ? 'hover:text-rose-600 hover:underline cursor-pointer' : ''}`}
                        disabled={!product.photoUrl}
                        title={product.photoUrl ? "Clique para ver a foto" : ""}
                      >
                        {product.name}
                        {product.photoUrl && <ImageIcon size={24} className="text-stone-300 group-hover:text-rose-600 transition-colors" />}
                      </button>

                      {product.pdfLink && (
                        <a
                          href={product.pdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-300 hover:text-rose-600 transition-colors p-1 hover:bg-rose-50 rounded-lg"
                          title="Abrir PDF da Receita"
                        >
                          <FileText size={24} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="prose prose-stone max-w-none whitespace-pre-wrap font-mono text-base leading-relaxed text-stone-700">
                    {product.recipeText}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-stone-400">
                  <p>Nenhuma receita em texto cadastrada.</p>
                </div>
              )
            ) : (
              product.pdfLink ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                    <p className="mb-4 text-stone-600">O PDF está hospedado externamente.</p>
                    <a
                      href={product.pdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-700 transition"
                    >
                      <ExternalLink size={20} />
                      Abrir PDF da Receita
                    </a>
                    <p className="mt-4 text-xs text-stone-400 max-w-xs mx-auto">
                      Se o link não abrir diretamente, verifique se a URL cadastrada no produto está correta e é pública.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-stone-400">
                  <p>Nenhum link de PDF cadastrado.</p>
                </div>
              )
            )}
          </div>

        </div>
      </div>

      {/* Client Details Modal */}
      {isClientModalOpen && client && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                <User size={20} className="text-rose-500" />
                Dados do Cliente
              </h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Nome</label>
                <p className="text-lg font-medium text-stone-800">{client.name}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">WhatsApp</label>
                {client.whatsapp ? (
                  <a
                    href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 font-medium hover:underline flex items-center gap-2"
                  >
                    <MessageCircle size={18} />
                    {client.whatsapp}
                    <ExternalLink size={14} className="opacity-50" />
                  </a>
                ) : (
                  <p className="text-stone-700">-</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin size={12} /> Endereço
                </label>
                <p className="text-stone-600 bg-stone-50 p-3 rounded-lg text-sm border border-stone-100">
                  {client.address || 'Sem endereço cadastrado'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText size={12} /> Observações
                </label>
                <p className="text-stone-600 italic text-sm">
                  {client.notes || 'Nenhuma observação.'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-b-xl border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {isPhotoModalOpen && product.photoUrl && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsPhotoModalOpen(false)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-stone-300 transition"
            >
              <X size={32} />
            </button>
            <img
              src={product.photoUrl}
              alt={product.name}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-white"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white mt-4 font-medium">{product.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};
