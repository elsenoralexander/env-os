import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Building2, FileText, Plus, Trash2, Edit2, Save, X,
    Search, Mail, ChevronDown, ChevronUp, Package
} from 'lucide-react';

const MasterDataManager = ({
    services,
    masterReferences,
    masterProviders,
    onAddReference,
    onEditReference,
    onDeleteReference,
    onAddProvider,
    onEditProvider,
    onDeleteProvider
}) => {
    const [activeTab, setActiveTab] = useState('references'); // 'references' | 'providers'
    const [searchTerm, setSearchTerm] = useState('');

    // Reference form state
    const [editingRef, setEditingRef] = useState(null);
    const [newRef, setNewRef] = useState({ ref: '', model: '', service: '', provider: '' });
    const [showNewRefForm, setShowNewRefForm] = useState(false);

    // Provider form state
    const [editingProvider, setEditingProvider] = useState(null);
    const [newProvider, setNewProvider] = useState({ name: '', emails: [] });
    const [showNewProviderForm, setShowNewProviderForm] = useState(false);
    const [newEmail, setNewEmail] = useState('');

    // Filter references by search
    const filteredReferences = useMemo(() => {
        return (masterReferences || []).filter(r =>
            r.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.provider?.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => (a.ref || '').localeCompare(b.ref || '', 'es'));
    }, [masterReferences, searchTerm]);

    // Filter providers by search
    const filteredProviders = useMemo(() => {
        return (masterProviders || []).filter(p =>
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.emails?.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()))
        ).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
    }, [masterProviders, searchTerm]);

    // Get unique providers from references or providers list
    const uniqueProviders = useMemo(() => {
        const fromRefs = (masterReferences || []).map(r => r.provider).filter(Boolean);
        const fromProvs = (masterProviders || []).map(p => p.name).filter(Boolean);
        return [...new Set([...fromRefs, ...fromProvs])].sort((a, b) => a.localeCompare(b, 'es'));
    }, [masterReferences, masterProviders]);

    // ==================== REFERENCE HANDLERS ====================
    const handleSaveReference = async (refData, isNew = false) => {
        try {
            if (isNew) {
                await onAddReference(refData);
                setNewRef({ ref: '', model: '', service: '', provider: '' });
                setShowNewRefForm(false);
            } else {
                await onEditReference(refData);
                setEditingRef(null);
            }
        } catch (error) {
            console.error('Error saving reference:', error);
        }
    };

    const handleDeleteReference = async (id) => {
        if (confirm('¿Eliminar esta referencia?')) {
            try {
                await onDeleteReference(id);
            } catch (error) {
                console.error('Error deleting reference:', error);
            }
        }
    };

    // ==================== PROVIDER HANDLERS ====================
    const handleSaveProvider = async (provData, isNew = false) => {
        try {
            if (isNew) {
                await onAddProvider(provData);
                setNewProvider({ name: '', emails: [] });
                setShowNewProviderForm(false);
            } else {
                await onEditProvider(provData);
                setEditingProvider(null);
            }
        } catch (error) {
            console.error('Error saving provider:', error);
        }
    };

    const handleDeleteProvider = async (id) => {
        if (confirm('¿Eliminar este proveedor?')) {
            try {
                await onDeleteProvider(id);
            } catch (error) {
                console.error('Error deleting provider:', error);
            }
        }
    };

    const addEmailToProvider = (providerData, setProviderData) => {
        if (newEmail.trim() && !providerData.emails.includes(newEmail.trim())) {
            setProviderData({ ...providerData, emails: [...providerData.emails, newEmail.trim()] });
            setNewEmail('');
        }
    };

    const removeEmailFromProvider = (email, providerData, setProviderData) => {
        setProviderData({ ...providerData, emails: providerData.emails.filter(e => e !== email) });
    };

    return (
        <div className="lg:col-span-2 premium-card p-8 bg-white/60 backdrop-blur-xl border border-white relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-quiron-primary to-quiron-accent flex items-center justify-center text-white shadow-lg">
                        <Database size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-quiron-secondary">Datos Maestros</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Referencias y Proveedores</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100/80 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('references')}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${activeTab === 'references'
                                ? 'bg-white text-quiron-primary shadow-sm'
                                : 'text-gray-400 hover:text-quiron-secondary'
                            }`}
                    >
                        <FileText size={14} />
                        REFERENCIAS ({masterReferences?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('providers')}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${activeTab === 'providers'
                                ? 'bg-white text-quiron-primary shadow-sm'
                                : 'text-gray-400 hover:text-quiron-secondary'
                            }`}
                    >
                        <Building2 size={14} />
                        PROVEEDORES ({masterProviders?.length || 0})
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                    type="text"
                    placeholder={activeTab === 'references' ? "Buscar referencia, modelo, proveedor..." : "Buscar proveedor o email..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-quiron-primary/30 outline-none font-medium text-sm"
                />
            </div>

            <AnimatePresence mode="wait">
                {/* ==================== REFERENCES TAB ==================== */}
                {activeTab === 'references' && (
                    <motion.div
                        key="references"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Add New Button */}
                        <button
                            onClick={() => setShowNewRefForm(!showNewRefForm)}
                            className="w-full py-3 border-2 border-dashed border-quiron-primary/30 rounded-2xl text-quiron-primary font-bold text-sm hover:bg-quiron-primary/5 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            Añadir Nueva Referencia
                        </button>

                        {/* New Reference Form */}
                        <AnimatePresence>
                            {showNewRefForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-quiron-primary/5 rounded-2xl p-4 border border-quiron-primary/20"
                                >
                                    <ReferenceForm
                                        data={newRef}
                                        setData={setNewRef}
                                        services={services}
                                        providers={uniqueProviders}
                                        onSave={() => handleSaveReference(newRef, true)}
                                        onCancel={() => setShowNewRefForm(false)}
                                        isNew
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* References List */}
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {filteredReferences.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 italic">
                                    {searchTerm ? 'No se encontraron referencias' : 'No hay referencias guardadas'}
                                </div>
                            ) : (
                                filteredReferences.map(ref => (
                                    <ReferenceItem
                                        key={ref.id}
                                        reference={ref}
                                        isEditing={editingRef?.id === ref.id}
                                        editingData={editingRef}
                                        setEditingData={setEditingRef}
                                        services={services}
                                        providers={uniqueProviders}
                                        onEdit={() => setEditingRef({ ...ref })}
                                        onSave={() => handleSaveReference(editingRef)}
                                        onCancel={() => setEditingRef(null)}
                                        onDelete={() => handleDeleteReference(ref.id)}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ==================== PROVIDERS TAB ==================== */}
                {activeTab === 'providers' && (
                    <motion.div
                        key="providers"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Add New Button */}
                        <button
                            onClick={() => setShowNewProviderForm(!showNewProviderForm)}
                            className="w-full py-3 border-2 border-dashed border-quiron-primary/30 rounded-2xl text-quiron-primary font-bold text-sm hover:bg-quiron-primary/5 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            Añadir Nuevo Proveedor
                        </button>

                        {/* New Provider Form */}
                        <AnimatePresence>
                            {showNewProviderForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-quiron-primary/5 rounded-2xl p-4 border border-quiron-primary/20"
                                >
                                    <ProviderForm
                                        data={newProvider}
                                        setData={setNewProvider}
                                        newEmail={newEmail}
                                        setNewEmail={setNewEmail}
                                        onAddEmail={() => addEmailToProvider(newProvider, setNewProvider)}
                                        onRemoveEmail={(email) => removeEmailFromProvider(email, newProvider, setNewProvider)}
                                        onSave={() => handleSaveProvider(newProvider, true)}
                                        onCancel={() => setShowNewProviderForm(false)}
                                        isNew
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Providers List */}
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {filteredProviders.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 italic">
                                    {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores guardados'}
                                </div>
                            ) : (
                                filteredProviders.map(prov => (
                                    <ProviderItem
                                        key={prov.id}
                                        provider={prov}
                                        isEditing={editingProvider?.id === prov.id}
                                        editingData={editingProvider}
                                        setEditingData={setEditingProvider}
                                        newEmail={newEmail}
                                        setNewEmail={setNewEmail}
                                        onAddEmail={() => addEmailToProvider(editingProvider, setEditingProvider)}
                                        onRemoveEmail={(email) => removeEmailFromProvider(email, editingProvider, setEditingProvider)}
                                        onEdit={() => setEditingProvider({ ...prov, emails: prov.emails || [] })}
                                        onSave={() => handleSaveProvider(editingProvider)}
                                        onCancel={() => setEditingProvider(null)}
                                        onDelete={() => handleDeleteProvider(prov.id)}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ==================== REFERENCE COMPONENTS ====================
const ReferenceForm = ({ data, setData, services, providers, onSave, onCancel, isNew }) => (
    <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
            <input
                type="text"
                placeholder="Referencia *"
                value={data.ref || ''}
                onChange={(e) => setData({ ...data, ref: e.target.value })}
                className="px-4 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-sm outline-none focus:border-quiron-primary"
            />
            <input
                type="text"
                placeholder="Modelo"
                value={data.model || ''}
                onChange={(e) => setData({ ...data, model: e.target.value })}
                className="px-4 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-sm outline-none focus:border-quiron-primary"
            />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <select
                value={data.service || ''}
                onChange={(e) => setData({ ...data, service: e.target.value })}
                className="px-4 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-sm outline-none focus:border-quiron-primary"
            >
                <option value="">Servicio</option>
                {services?.filter(s => s !== 'TODO').map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Proveedor"
                    value={data.provider || ''}
                    onChange={(e) => setData({ ...data, provider: e.target.value })}
                    list="providers-list"
                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-sm outline-none focus:border-quiron-primary"
                />
                <datalist id="providers-list">
                    {providers.map(p => <option key={p} value={p} />)}
                </datalist>
            </div>
        </div>
        <div className="flex gap-2 pt-2">
            <button
                onClick={onSave}
                disabled={!data.ref?.trim()}
                className="flex-1 py-2.5 bg-quiron-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <Save size={16} />
                {isNew ? 'Añadir' : 'Guardar'}
            </button>
            <button
                onClick={onCancel}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200"
            >
                <X size={16} />
            </button>
        </div>
    </div>
);

const ReferenceItem = ({ reference, isEditing, editingData, setEditingData, services, providers, onEdit, onSave, onCancel, onDelete }) => (
    <div className={`p-4 rounded-2xl border transition-all ${isEditing ? 'bg-quiron-primary/5 border-quiron-primary/20' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
        {isEditing ? (
            <ReferenceForm
                data={editingData}
                setData={setEditingData}
                services={services}
                providers={providers}
                onSave={onSave}
                onCancel={onCancel}
            />
        ) : (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-quiron-secondary/10 flex items-center justify-center">
                        <Package size={18} className="text-quiron-secondary" />
                    </div>
                    <div>
                        <p className="font-black text-quiron-secondary">{reference.ref}</p>
                        <p className="text-xs text-gray-400">
                            {[reference.model, reference.service, reference.provider].filter(Boolean).join(' • ')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={onEdit}
                        className="p-2 text-gray-400 hover:text-quiron-primary hover:bg-quiron-primary/10 rounded-lg transition-all"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        )}
    </div>
);

// ==================== PROVIDER COMPONENTS ====================
const ProviderForm = ({ data, setData, newEmail, setNewEmail, onAddEmail, onRemoveEmail, onSave, onCancel, isNew }) => (
    <div className="space-y-3">
        <input
            type="text"
            placeholder="Nombre del proveedor *"
            value={data.name || ''}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 font-medium text-sm outline-none focus:border-quiron-primary"
        />

        {/* Emails List */}
        <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Correos electrónicos</p>
            {(data.emails || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {data.emails.map((email, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-quiron-primary/10 text-quiron-primary text-xs font-bold rounded-full">
                            <Mail size={12} />
                            {email}
                            <button
                                type="button"
                                onClick={() => onRemoveEmail(email)}
                                className="ml-1 text-quiron-primary/60 hover:text-red-500"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <div className="flex gap-2">
                <input
                    type="email"
                    placeholder="nuevo@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddEmail())}
                    className="flex-1 px-4 py-2 bg-white rounded-xl border border-gray-200 font-medium text-sm outline-none focus:border-quiron-primary"
                />
                <button
                    type="button"
                    onClick={onAddEmail}
                    className="px-4 py-2 bg-quiron-secondary/10 text-quiron-secondary rounded-xl font-bold text-sm hover:bg-quiron-secondary/20"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>

        <div className="flex gap-2 pt-2">
            <button
                onClick={onSave}
                disabled={!data.name?.trim()}
                className="flex-1 py-2.5 bg-quiron-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <Save size={16} />
                {isNew ? 'Añadir' : 'Guardar'}
            </button>
            <button
                onClick={onCancel}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200"
            >
                <X size={16} />
            </button>
        </div>
    </div>
);

const ProviderItem = ({ provider, isEditing, editingData, setEditingData, newEmail, setNewEmail, onAddEmail, onRemoveEmail, onEdit, onSave, onCancel, onDelete }) => (
    <div className={`p-4 rounded-2xl border transition-all ${isEditing ? 'bg-quiron-primary/5 border-quiron-primary/20' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
        {isEditing ? (
            <ProviderForm
                data={editingData}
                setData={setEditingData}
                newEmail={newEmail}
                setNewEmail={setNewEmail}
                onAddEmail={onAddEmail}
                onRemoveEmail={onRemoveEmail}
                onSave={onSave}
                onCancel={onCancel}
            />
        ) : (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-quiron-accent/10 flex items-center justify-center">
                            <Building2 size={18} className="text-quiron-accent" />
                        </div>
                        <p className="font-black text-quiron-secondary">{provider.name}</p>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={onEdit}
                            className="p-2 text-gray-400 hover:text-quiron-primary hover:bg-quiron-primary/10 rounded-lg transition-all"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                {(provider.emails || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-13">
                        {provider.emails.map((email, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg">
                                <Mail size={10} />
                                {email}
                            </span>
                        ))}
                    </div>
                )}
                {(!provider.emails || provider.emails.length === 0) && (
                    <p className="text-xs text-gray-400 italic pl-13">Sin emails asociados</p>
                )}
            </div>
        )}
    </div>
);

export default MasterDataManager;
