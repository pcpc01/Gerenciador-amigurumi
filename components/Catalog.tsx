import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, Image as ImageIcon, Package, ArrowUpDown } from 'lucide-react';
import { Product } from '../types';
import * as storage from '../services/storage_supabase';

export const Catalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    basePrice: 0,
    photoUrl: '',
    description: '',
    recipeText: '',
    pdfLink: '',
    weight: '',
    height: '',
    width: '',
    length: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setProducts(await storage.getProducts());
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        basePrice: 0,
        photoUrl: '',
        description: '',
        recipeText: '',
        pdfLink: '',
        weight: '',
        height: '',
        width: '',
        length: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      await storage.deleteProduct(id);
      loadProducts();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : crypto.randomUUID(),
      name: formData.name || 'Sem nome',
      basePrice: Number(formData.basePrice) || 0,
      photoUrl: formData.photoUrl || 'https://picsum.photos/200',
      description: formData.description || '',
      recipeText: formData.recipeText || '',
      pdfLink: formData.pdfLink || '',
      weight: formData.weight || '',
      height: formData.height || '',
      width: formData.width || '',
      length: formData.length || '',
      createdAt: editingProduct?.createdAt || Date.now()
    };

    await storage.saveProduct(productToSave);
    setIsModalOpen(false);
    loadProducts();
  };

  const filteredAndSortedProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortOption) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'date_new':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'date_old':
          return (a.createdAt || 0) - (b.createdAt || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Catálogo de Peças</h2>
          <p className="text-stone-500 text-sm">Gerencie suas receitas e produtos base</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700 transition shadow-sm"
        >
          <Plus size={18} />
          Novo Produto
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-stone-400" size={18} />
        </div>

        <div className="relative min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
            <ArrowUpDown size={16} />
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="appearance-none w-full bg-white border border-stone-300 text-stone-700 py-2 pl-9 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm cursor-pointer"
          >
            <option value="name_asc">Nome (A-Z)</option>
            <option value="name_desc">Nome (Z-A)</option>
            <option value="date_new">Mais Recentes</option>
            <option value="date_old">Mais Antigos</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedProducts.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
            <div className="h-48 overflow-hidden bg-stone-100 relative group">
              <img
                src={product.photoUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/200';
                }}
              />
              <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.basePrice)}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-stone-800 mb-1">{product.name}</h3>
              <p className="text-sm text-stone-500 line-clamp-2 mb-4 flex-1">{product.description}</p>

              <div className="flex items-center gap-2 pt-4 border-t border-stone-100 mt-auto">
                <button
                  onClick={() => handleOpenModal(product)}
                  className="flex-1 py-2 text-sm text-stone-600 bg-stone-50 hover:bg-stone-100 rounded flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredAndSortedProducts.length === 0 && (
          <div className="col-span-full text-center py-12 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-300">
            <p>Nenhum produto encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                    <input required className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Preço Base (R$)</label>
                    <input type="number" step="0.01" className="w-full border rounded-lg p-2" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })} />
                  </div>
                </div>

                {/* Dimensions Section */}
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <h4 className="text-xs font-semibold text-stone-500 uppercase mb-2 flex items-center gap-1">
                    <Package size={14} /> Dimensões & Peso
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Peso (g)</label>
                      <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 150g" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Altura</label>
                      <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 20cm" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Largura</label>
                      <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 10cm" value={formData.width} onChange={e => setFormData({ ...formData, width: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">Comp.</label>
                      <input className="w-full border rounded-lg p-2 text-sm" placeholder="ex: 10cm" value={formData.length} onChange={e => setFormData({ ...formData, length: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">URL da Foto</label>
                  <div className="flex gap-2">
                    <input className="w-full border rounded-lg p-2 flex-1" value={formData.photoUrl} onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} placeholder="https://..." />
                    <div className="w-10 h-10 bg-stone-100 rounded border flex items-center justify-center overflow-hidden shrink-0">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="text-stone-400" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Descrição Curta</label>
                  <textarea rows={2} className="w-full border rounded-lg p-2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-rose-500" />
                    Dados da Receita
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Link PDF (Drive/Dropbox)</label>
                      <input className="w-full border rounded-lg p-2" value={formData.pdfLink} onChange={e => setFormData({ ...formData, pdfLink: e.target.value })} placeholder="https://" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Receita em Texto (Copie e Cole)</label>
                      <textarea
                        rows={8}
                        className="w-full border rounded-lg p-2 font-mono text-sm"
                        value={formData.recipeText}
                        onChange={e => setFormData({ ...formData, recipeText: e.target.value })}
                        placeholder="R1: 6pb no AM (6)..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 mt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-stone-50">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};