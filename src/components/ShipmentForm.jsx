import React, { useState, useMemo } from 'react';
import { X, Camera, Save, ClipboardList, Info, Plus, ChevronDown, Building2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary } from '../cloudinary';

const ShipmentForm = ({ onSave, onCancel, services, onAddService, allShipments }) => {
    const [formData, setFormData] = useState({
        provider: '',
        provider_contact: '',
        model: '',
        sn: '',
        ref: '',
        priority: 'NORMAL',
        shipment_date: new Date().toISOString().split('T')[0],
        service: 'TODO',
        loan: false,
        loan_sn: '',
        observations: '',
        comments: '',
        image: null
    });

    const [preview, setPreview] = useState(null);
    const [isAddingService, setIsAddingService] = useState(false);
    const [newServiceName, setNewServiceName] = useState('');
    const [showProviders, setShowProviders] = useState(false);
    const [showReferences, setShowReferences] = useState(false);
    const [refAutoFilled, setRefAutoFilled] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const uniqueProviders = useMemo(() => {
        const providers = (allShipments || []).map(s => s.provider);
        return [...new Set(providers)]
            .filter(p => p && p.toLowerCase().includes(formData.provider.toLowerCase()))
            .sort((a, b) => a.localeCompare(b, 'es'));
    }, [allShipments, formData.provider]);

    const uniqueReferences = useMemo(() => {
        const refMap = new Map();
        (allShipments || [])
            .filter(s => s.ref && s.ref.trim())
            .sort((a, b) => new Date(b.shipment_date) - new Date(a.shipment_date))
            .forEach(s => {
                if (!refMap.has(s.ref.toUpperCase())) {
                    refMap.set(s.ref.toUpperCase(), {
                        ref: s.ref.toUpperCase(),
                        model: s.model,
                        service: s.service,
                        provider: s.provider,
                        provider_contact: s.provider_contact || ''
                    });
                }
            });
        return Array.from(refMap.values())
            .filter(r => r.ref.includes(formData.ref.toUpperCase()))
            .sort((a, b) => a.ref.localeCompare(b.ref, 'es'));
    }, [allShipments, formData.ref]);

    // Get unique contacts
    const [showContacts, setShowContacts] = useState(false);
    const uniqueContacts = useMemo(() => {
        const contacts = (allShipments || [])
            .filter(s => s.provider_contact && s.provider_contact.trim())
            .map(s => s.provider_contact);
        return [...new Set(contacts)]
            .filter(c => c.toLowerCase().includes(formData.provider_contact.toLowerCase()))
            .sort((a, b) => a.localeCompare(b, 'es'));
    }, [allShipments, formData.provider_contact]);

    // Handle reference selection from dropdown
    const handleRefSelect = (refData) => {
        setFormData(prev => ({
            ...prev,
            ref: refData.ref,
            model: refData.model,
            service: refData.service,
            provider: refData.provider,
            provider_contact: refData.provider_contact
        }));
        setRefAutoFilled(true);
        setShowReferences(false);
        setTimeout(() => setRefAutoFilled(false), 2000);
    };

    // Handle typing in reference field
    const handleRefChange = (e) => {
        const newRef = e.target.value.toUpperCase();
        setFormData({ ...formData, ref: newRef });
        setRefAutoFilled(false);
        setShowReferences(true);
    };

    // Handle image upload to Cloudinary
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen válido.');
            return;
        }

        // Validate file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen es demasiado grande (máx 10MB). Por favor, selecciona una imagen más pequeña.');
            return;
        }

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (event) => setPreview(event.target.result);
        reader.readAsDataURL(file);

        // Upload to Cloudinary with compression
        setUploadingImage(true);
        try {
            console.log(`📸 Uploading image: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
            const imageUrl = await uploadToCloudinary(file);
            setFormData({ ...formData, image: imageUrl });
            console.log('✅ Image uploaded successfully:', imageUrl);
        } catch (error) {
            console.error('❌ Upload failed:', error);
            const errorMsg = error.message || 'Error desconocido';
            alert(`Error al subir la imagen: ${errorMsg}\n\nSugerencias:\n- Verifica tu conexión a internet\n- Intenta con una imagen más pequeña`);
            setPreview(null);
        } finally {
            setUploadingImage(false);
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: Math.random().toString(36).substr(2, 6).toUpperCase(),
        });
    };

    return (
        <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="medical-gradient p-8 text-white flex justify-between items-center relative overflow-hidden">
                <Building2 size={120} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Nuevo Registro</h2>
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-[0.2em]">Alta de equipo en sistema</p>
                    </div>
                </div>
                <button onClick={onCancel} className="hover:bg-white/20 p-3 rounded-2xl transition-all relative z-10">
                    <X size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto">
                <div className="grid grid-cols-1 gap-8">
                    <InputWrapper label="Nombre / Modelo del Aparato (Visible en listado)">
                        <input
                            required
                            className="input-premium h-20 text-xl font-bold"
                            placeholder="Ej: Siemens Somatom Go"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        />
                    </InputWrapper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputWrapper label="Número de Serie (S/N)">
                        <input
                            className="input-premium bg-gray-50 border-gray-100"
                            placeholder="Añadir SN vital para identificación..."
                            value={formData.sn}
                            onChange={(e) => setFormData({ ...formData, sn: e.target.value })}
                        />
                    </InputWrapper>

                    <InputWrapper label="Contacto Proveedor">
                        <div className="relative">
                            <input
                                className="input-premium bg-blue-50 border-blue-100"
                                placeholder="Buscar o añadir contacto..."
                                value={formData.provider_contact}
                                onFocus={() => setShowContacts(true)}
                                onChange={(e) => {
                                    setFormData({ ...formData, provider_contact: e.target.value });
                                    setShowContacts(true);
                                }}
                                onBlur={() => setTimeout(() => setShowContacts(false), 150)}
                            />
                            {showContacts && uniqueContacts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-10 max-h-40 overflow-y-auto">
                                    {uniqueContacts.slice(0, 6).map(contact => (
                                        <button
                                            key={contact}
                                            type="button"
                                            className="w-full text-left px-4 py-3 hover:bg-quiron-primary/5 text-sm font-medium transition-colors border-b border-gray-100 last:border-0"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setFormData({ ...formData, provider_contact: contact });
                                                setShowContacts(false);
                                            }}
                                        >
                                            {contact}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2 font-bold">Se guardará automáticamente para este proveedor</p>
                    </InputWrapper>

                    <InputWrapper label="Referencia del Equipo">
                        <div className="relative">
                            <input
                                className="input-premium bg-teal-50 border-teal-100"
                                placeholder="Buscar o crear referencia..."
                                value={formData.ref}
                                onChange={handleRefChange}
                                onFocus={() => setShowReferences(true)}
                            />
                            {refAutoFilled && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
                                >
                                    ✓ Auto-completado
                                </motion.div>
                            )}
                            <AnimatePresence>
                                {showReferences && (formData.ref.length > 0 || uniqueReferences.length > 0) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto"
                                    >
                                        {uniqueReferences.slice(0, 8).map(refData => (
                                            <button
                                                key={refData.ref}
                                                type="button"
                                                onClick={() => handleRefSelect(refData)}
                                                className="w-full text-left px-5 py-3 hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="font-black text-quiron-secondary text-sm">{refData.ref}</span>
                                                    <span className="text-[9px] bg-quiron-primary/10 text-quiron-primary px-2 py-0.5 rounded-full font-bold">{refData.service}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mt-1">{refData.model}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">Proveedor: {refData.provider}</p>
                                            </button>
                                        ))}
                                        {formData.ref && !uniqueReferences.find(r => r.ref === formData.ref.toUpperCase()) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowReferences(false);
                                                }}
                                                className="w-full text-left px-5 py-3 bg-teal-50 hover:bg-teal-100 transition-colors text-teal-700 font-bold text-sm"
                                            >
                                                + Crear nueva referencia: <span className="font-black">{formData.ref.toUpperCase()}</span>
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2 font-bold">Selecciona una referencia existente o crea una nueva. Auto-completa modelo, servicio y proveedor.</p>
                    </InputWrapper>

                    <InputWrapper label="Prioridad de Reparación">
                        <div className="flex gap-4">
                            {['NORMAL', 'ALTA'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all border-2 ${formData.priority === p ? (p === 'ALTA' ? 'bg-red-500 border-red-500 text-white' : 'bg-quiron-primary border-quiron-primary text-white') : 'bg-white border-gray-100 text-gray-400'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </InputWrapper>

                    <div className="relative">
                        <InputWrapper label="Proveedor / SAT">
                            <input
                                required
                                className="input-premium"
                                placeholder="Escribe para buscar..."
                                value={formData.provider}
                                onFocus={() => setShowProviders(true)}
                                onChange={(e) => {
                                    setFormData({ ...formData, provider: e.target.value });
                                    setShowProviders(true);
                                }}
                            />
                        </InputWrapper>
                        <AnimatePresence>
                            {showProviders && uniqueProviders.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                                >
                                    {uniqueProviders.slice(0, 5).map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => {
                                                // Find most recent shipment with this provider to get contact
                                                const matchingShipment = [...allShipments]
                                                    .filter(s => s.provider === p && s.provider_contact)
                                                    .sort((a, b) => new Date(b.shipment_date) - new Date(a.shipment_date))[0];

                                                setFormData({
                                                    ...formData,
                                                    provider: p,
                                                    provider_contact: matchingShipment?.provider_contact || ''
                                                });
                                                setShowProviders(false);
                                            }}
                                            className="w-full text-left px-5 py-3 text-sm font-bold text-quiron-secondary hover:bg-quiron-primary/5 transition-colors border-b border-gray-50 last:border-0"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-quiron-secondary/40 uppercase tracking-widest ml-4">Servicio Hospitalario</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select
                                    className="input-premium appearance-none pr-10"
                                    value={formData.service}
                                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                                >
                                    {services.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-quiron-secondary/40 pointer-events-none" size={18} />
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddingService(true)}
                                className="w-14 h-14 bg-quiron-primary/10 text-quiron-primary rounded-2xl flex items-center justify-center hover:bg-quiron-primary hover:text-white transition-all shadow-sm"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                    </div>

                    <InputWrapper label="Fecha de Envío">
                        <input
                            type="date"
                            required
                            className="input-premium"
                            value={formData.shipment_date}
                            onChange={(e) => setFormData({ ...formData, shipment_date: e.target.value })}
                        />
                    </InputWrapper>
                </div>

                <AnimatePresence>
                    {isAddingService && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-quiron-bg/50 p-6 rounded-3xl border-2 border-dashed border-quiron-primary/30 flex gap-4">
                                <input
                                    autoFocus
                                    className="input-premium bg-white"
                                    placeholder="NOMBRE DEL NUEVO SERVICIO"
                                    value={newServiceName}
                                    onChange={(e) => setNewServiceName(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddService}
                                    className="btn-premium-primary whitespace-nowrap"
                                >
                                    Confirmar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingService(false)}
                                    className="px-4 font-bold text-gray-400 hover:text-quiron-secondary transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="p-8 rounded-[2.5rem] bg-quiron-bg border border-gray-100 flex flex-col md:flex-row gap-8 items-center justify-between shadow-inner">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${formData.loan ? 'bg-quiron-primary text-white scale-110' : 'bg-white text-gray-300'}`}>
                            <Info size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-quiron-secondary">Gestión de Préstamo</p>
                            <p className="text-gray-400 text-xs font-medium">¿Requiere equipo de sustitución?</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-125 mr-4">
                        <input
                            type="checkbox" className="sr-only peer"
                            checked={formData.loan}
                            onChange={(e) => setFormData({ ...formData, loan: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-quiron-primary shadow-inner"></div>
                    </label>
                </div>

                {formData.loan && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <InputWrapper label="SN / Referencia del equipo en préstamo">
                            <input
                                className="input-premium border-quiron-primary/20 bg-quiron-primary/5 focus:bg-white transition-all"
                                placeholder="Introduzca el SN del equipo cedido"
                                value={formData.loan_sn}
                                onChange={(e) => setFormData({ ...formData, loan_sn: e.target.value })}
                            />
                        </InputWrapper>
                    </motion.div>
                )}

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-quiron-secondary/40 uppercase tracking-widest ml-4 block">Observaciones y Documentación</label>
                    <textarea
                        className="w-full p-6 bg-quiron-bg rounded-3xl border-2 border-transparent focus:border-quiron-primary outline-none font-medium min-h-[120px] transition-all"
                        placeholder="Indique detalles relevantes sobre la solicitud..."
                        value={formData.observations}
                        onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-quiron-secondary/40 uppercase tracking-widest ml-4 block">Evidencia Fotográfica</label>
                    <div className="flex flex-wrap gap-6">
                        <label className="cursor-pointer flex flex-col items-center justify-center w-40 h-40 rounded-[2rem] border-2 border-dashed border-quiron-primary/20 hover:bg-quiron-primary/5 hover:border-quiron-primary hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Camera size={24} className="text-quiron-primary" />
                            </div>
                            <span className="text-[10px] font-black text-quiron-secondary/60 text-center tracking-widest uppercase">Capturar /<br />Subir</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>

                        {preview && (
                            <div className="relative w-40 h-40 rounded-[2rem] overflow-hidden shadow-2xl animate-float group">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button" onClick={() => { setPreview(null); setFormData({ ...formData, image: null }) }}
                                    className="absolute top-2 right-2 bg-quiron-accent text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-10 flex gap-4 border-t border-gray-100">
                    <button type="submit" className="btn-premium-primary flex-1 h-16 justify-center text-lg shadow-xl shadow-quiron-primary/20">
                        <Save size={24} />
                        Finalizar y Guardar
                    </button>
                    <button
                        type="button" onClick={onCancel}
                        className="px-10 font-bold text-gray-400 hover:text-quiron-secondary transition-colors"
                    >
                        Descartar
                    </button>
                </div>
            </form>
        </div>
    );
};

const InputWrapper = ({ label, children }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-quiron-secondary/40 uppercase tracking-widest ml-4">{label}</label>
        {children}
    </div>
);

export default ShipmentForm;
