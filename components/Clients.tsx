import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, MessageSquare, Phone, User } from 'lucide-react';
import { Client } from '../types';
import * as storage from '../services/storage_supabase';

export const Clients: React.FC = () => {
  // Helper para gerar UUID compatível com todos os navegadores
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    whatsapp: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setClients(await storage.getClients());
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        whatsapp: '',
        address: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await storage.deleteClient(id);
      loadClients();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientToSave: Client = {
      id: editingClient ? editingClient.id : generateUUID(),
      name: formData.name || 'Sem nome',
      whatsapp: formData.whatsapp || '',
      address: formData.address || '',
      notes: formData.notes || ''
    };

    await storage.saveClient(clientToSave);
    setIsModalOpen(false);
    loadClients();
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Meus Clientes</h2>
          <p className="text-stone-500 text-sm">Gerencie sua base de contatos</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700 transition shadow-sm"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
        />
        <Search className="absolute left-3 top-2.5 text-stone-400" size={18} />
      </div>

      <div className="space-y-3">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex items-center gap-4 hover:border-rose-300 hover:shadow-md transition group">

            {/* Avatar */}
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
              <User size={24} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-stone-800 leading-tight truncate">{client.name}</h3>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {client.whatsapp && (
                  <a
                    href={`https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-stone-600 hover:text-green-600 hover:underline transition"
                  >
                    <Phone size={12} className="text-green-500" />
                    <span>{client.whatsapp}</span>
                  </a>
                )}
                {client.address && (
                  <div className="flex items-center gap-1 text-sm text-stone-600">
                    <MapPin size={12} className="text-stone-400" />
                    <span className="truncate max-w-[200px] md:max-w-md">{client.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-100 ml-2">
              <button
                onClick={() => handleOpenModal(client)}
                className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDelete(client.id)}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-300">
            <p>Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nome Completo</label>
                  <input required className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">WhatsApp</label>
                  <input
                    placeholder="(00) 00000-0000"
                    className="w-full border rounded-lg p-2"
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-1">
                    <MapPin size={14} /> Endereço
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border rounded-lg p-2"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-1">
                    <MessageSquare size={14} /> Observação
                  </label>
                  <textarea
                    rows={2}
                    className="w-full border rounded-lg p-2"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
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