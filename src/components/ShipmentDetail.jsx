import React, { useState, useMemo } from 'react';
import {
    X, Calendar, Building2, Save, Trash2, Camera,
    CheckCircle2, Clock, AlertCircle, Info, Plus,
    Truck, Package, ClipboardList, Settings2, Pencil,
    ChevronDown, Search, Loader2, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { uploadToCloudinary } from '../cloudinary';
import EmailPopup from './EmailPopup';

const STATUS_WORKFLOW = [
    'REPARANDO EN ELECTROMEDICINA',
    'ENVIADO A SERVICIO TECNICO',
    'PRESUPUESTO RECIBIDO',
    'PRESUPUESTO ACEPTADO',
    'RECIBIDO'
];

const ShipmentDetail = ({ shipment, services, allShipments, masterReferences, masterProviders, onSave, onDelete, onClose, onAddService }) => {
    // Initialize data with provider_contacts array (handle both old string and new array formats)
    const initialContacts = shipment.provider_contacts ||
        (shipment.provider_contact ? [shipment.provider_contact] : []);
    const [data, setData] = useState({
        ...shipment,
        status: shipment.status || STATUS_WORKFLOW[1],
        provider_contacts: initialContacts
    });
    const [isEditing, setIsEditing] = useState(false);
    const [providerSearch, setProviderSearch] = useState('');
    const [showProviders, setShowProviders] = useState(false);
    const [isAddingService, setIsAddingService] = useState(false);
    const [newServiceName, setNewServiceName] = useState('');
    const [showReferences, setShowReferences] = useState(false);
    const [refSearch, setRefSearch] = useState('');
    const [showEmailPopup, setShowEmailPopup] = useState(false);
    const [showImageLightbox, setShowImageLightbox] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [contactSearch, setContactSearch] = useState('');

    const uniqueProviders = useMemo(() => {
        // Combine providers from shipments and master data
        const providersFromShipments = (allShipments || []).map(s => s.provider);
        const providersFromMaster = (masterProviders || []).map(p => p.name);
        const allProviderNames = [...new Set([...providersFromShipments, ...providersFromMaster])]
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, 'es'));

        // If no search term, return all providers
        if (!providerSearch.trim()) {
            return allProviderNames;
        }

        return allProviderNames
            .filter(p => p.toLowerCase().includes(providerSearch.toLowerCase()));
    }, [allShipments, masterProviders, providerSearch]);

    const uniqueReferences = useMemo(() => {
        const refMap = new Map();

        // First, add references from master data (priority)
        (masterReferences || []).forEach(r => {
            if (r.ref && r.ref.trim()) {
                refMap.set(r.ref.toUpperCase(), {
                    ref: r.ref.toUpperCase(),
                    model: r.equipmentName || r.model || '',
                    service: r.service || '',
                    provider: r.provider || '',
                    provider_contact: ''
                });
            }
        });

        // Then add from shipments (won't overwrite master data)
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

        const searchTerm = (refSearch || data.ref || '').toUpperCase();
        return Array.from(refMap.values())
            .sort((a, b) => a.ref.localeCompare(b.ref, 'es'))
            .filter(r => !searchTerm || r.ref.includes(searchTerm));
    }, [allShipments, masterReferences, refSearch, data.ref]);

    // Get unique contacts from all shipments and master providers
    const [showContacts, setShowContacts] = useState(false);
    const uniqueContacts = useMemo(() => {
        const contactsSet = new Set();

        // Contacts from shipments
        (allShipments || []).forEach(s => {
            if (s.provider_contacts && Array.isArray(s.provider_contacts)) {
                s.provider_contacts.forEach(c => c && c.trim() && contactsSet.add(c.trim()));
            } else if (s.provider_contact && s.provider_contact.trim()) {
                contactsSet.add(s.provider_contact.trim());
            }
        });

        // Emails from master providers
        (masterProviders || []).forEach(p => {
            (p.emails || []).forEach(e => e && e.trim() && contactsSet.add(e.trim()));
        });

        // Get current contacts to exclude from suggestions
        const currentContacts = Array.isArray(data.provider_contacts) ? data.provider_contacts :
            (data.provider_contact ? [data.provider_contact] : []);
        return Array.from(contactsSet)
            .filter(c => !currentContacts.includes(c))
            .filter(c => c.toLowerCase().includes(contactSearch.toLowerCase()))
            .sort((a, b) => a.localeCompare(b, 'es'));
    }, [allShipments, contactSearch, data.provider_contacts, data.provider_contact]);

    // Handle reference selection
    const handleRefSelect = (refData) => {
        // Merge contacts: keep new format (array) or convert from old format (string)
        const existingContacts = Array.isArray(data.provider_contacts) ? data.provider_contacts :
            (data.provider_contact ? [data.provider_contact] : []);
        const refContacts = refData.provider_contacts || (refData.provider_contact ? [refData.provider_contact] : []);
        const mergedContacts = [...new Set([...existingContacts, ...refContacts])];

        setData(prev => ({
            ...prev,
            ref: refData.ref,
            model: refData.model,
            service: refData.service,
            provider: refData.provider,
            provider_contacts: mergedContacts,
            provider_contact: mergedContacts.join(', ') // Keep backward compatibility
        }));
        setShowReferences(false);
        setRefSearch('');
    };

    const handleStatusChange = (newStatus) => {
        const updated = { ...data, status: newStatus };
        if (newStatus === 'RECIBIDO') {
            updated.delivery_date = new Date().toISOString().split('T')[0];
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00B1A8', '#023E54', '#E03E52']
            });
        }
        setData(updated);
    };

    const handleSave = () => {
        onSave(data);
        setIsEditing(false);
    };

    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = async (e) => {
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

        setUploadingImage(true);
        try {
            console.log(`📸 Uploading image: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
            const imageUrl = await uploadToCloudinary(file);
            setData({ ...data, image: imageUrl });
            console.log('✅ Image uploaded successfully:', imageUrl);
        } catch (error) {
            console.error('❌ Upload failed:', error);
            const errorMsg = error.message || 'Error desconocido';
            alert(`Error al subir la imagen: ${errorMsg}\n\nSugerencias:\n- Verifica tu conexión a internet\n- Intenta con una imagen más pequeña\n- Asegúrate de que el formato sea JPG, PNG o WEBP`);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleQuickReceiptLocal = () => {
        const updated = {
            ...data,
            status: 'RECIBIDO',
            delivery_date: new Date().toISOString().split('T')[0]
        };
        setData(updated);
        onSave(updated);
        if (window.confetti) {
            window.confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00B1A8', '#023E54', '#E03E52']
            });
        }
    };

    return (<>
        <div className="bg-white rounded-5xl overflow-hidden shadow-2xl flex flex-col lg:flex-row h-full lg:h-auto max-h-[95vh] lg:max-h-[90vh] overflow-y-auto lg:overflow-visible">
            {/* Left side: Photo & Status Overview */}
            <div className="lg:w-1/3 bg-gray-50 p-8 border-r border-gray-100 flex flex-col">
                <div
                    className={`relative aspect-square rounded-4xl overflow-hidden bg-white shadow-inner mb-8 group ${data.image && !isEditing ? 'cursor-pointer' : ''}`}
                    onClick={() => data.image && !isEditing && setShowImageLightbox(true)}
                >
                    {data.image ? (
                        <img src={data.image} alt={data.model} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full medical-gradient opacity-10 flex items-center justify-center">
                            <Camera size={64} strokeWidth={1} className="text-quiron-secondary" />
                            <p className="mt-4 font-bold text-xs tracking-widest uppercase absolute bottom-8">Sin Evidencia</p>
                        </div>
                    )}
                    {data.image && !isEditing && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                            <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold text-quiron-secondary shadow-lg transition-opacity">
                                Click para ampliar
                            </div>
                        </div>
                    )}
                    {isEditing && (
                        <label className="absolute inset-0 bg-quiron-secondary/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity cursor-pointer">
                            <Camera className="mr-2" /> Cambiar Imagen
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    )}
                </div>

                <div className="space-y-6 mt-auto">
                    <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-white shadow-lg border border-gray-100">
                        <div className={`p-4 rounded-2xl ${data.status === 'RECIBIDO' ? 'bg-green-100 text-green-600' : 'bg-quiron-primary/10 text-quiron-primary'}`}>
                            {data.status === 'RECIBIDO' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado Actual</p>
                            {isEditing ? (
                                <select
                                    value={data.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="w-full text-xs font-black text-quiron-secondary bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
                                >
                                    {STATUS_WORKFLOW.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className={`text-xs font-black ${data.status === 'RECIBIDO' ? 'text-green-600' :
                                    data.status === 'PRESUPUESTO ACEPTADO' ? 'text-orange-500' :
                                        data.status === 'REPARANDO EN ELECTROMEDICINA' ? 'text-yellow-600' :
                                            'text-red-500'
                                    }`}>
                                    {data.status || 'ENVIADO A SERVICIO TECNICO'}
                                </p>
                            )}
                        </div>
                    </div>

                    {isEditing && data.status !== 'RECIBIDO' && (
                        <button
                            onClick={handleQuickReceiptLocal}
                            className="w-full h-16 medical-gradient text-white rounded-[2rem] font-black text-xs tracking-[0.2em] shadow-xl shadow-quiron-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/20"
                        >
                            <CheckCircle2 size={20} />
                            MARCAR RECIBIDO HOY
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-[2rem] bg-quiron-secondary/5 border border-quiron-secondary/10">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Días Fuera</p>
                            <p className="text-3xl font-black text-quiron-secondary">
                                {(() => {
                                    const start = new Date(data.shipment_date || new Date());
                                    const end = data.delivery_date ? new Date(data.delivery_date) : new Date();
                                    return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
                                })()}
                            </p>
                        </div>
                        <div className="p-5 rounded-[2rem] bg-white border border-gray-100 shadow-sm relative overflow-hidden group">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prioridad</p>
                            {isEditing ? (
                                <button
                                    onClick={() => setData({ ...data, priority: data.priority === 'ALTA' ? 'NORMAL' : 'ALTA' })}
                                    className={`text-sm font-black uppercase transition-all flex items-center gap-1 ${data.priority === 'ALTA' ? 'text-red-500' : 'text-quiron-primary'}`}
                                >
                                    {data.priority === 'ALTA' && <AlertCircle size={14} />}
                                    {data.priority || 'NORMAL'}
                                    <span className="text-[9px] text-gray-400 ml-1">(click cambiar)</span>
                                </button>
                            ) : (
                                <p className={`text-sm font-black uppercase flex items-center gap-1 ${data.priority === 'ALTA' ? 'text-red-500' : 'text-quiron-primary'}`}>
                                    {data.priority === 'ALTA' && <AlertCircle size={14} />}
                                    {data.priority || 'NORMAL'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: Details & Forms */}
            <div className="flex-1 p-10 lg:overflow-y-auto">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Servicio:</span>
                                    <select
                                        value={data.service}
                                        onChange={(e) => {
                                            if (e.target.value === '__ADD_NEW__') {
                                                setIsAddingService(true);
                                            } else {
                                                setData({ ...data, service: e.target.value });
                                            }
                                        }}
                                        className="px-3 py-1 bg-quiron-primary/10 text-quiron-primary text-[10px] font-black rounded-lg outline-none"
                                    >
                                        {services.map(s => <option key={s} value={s}>{s}</option>)}
                                        <option value="__ADD_NEW__">+ Añadir nuevo servicio...</option>
                                    </select>
                                    {isAddingService && (
                                        <div className="flex items-center gap-2 ml-2">
                                            <input
                                                type="text"
                                                placeholder="Nombre del servicio"
                                                value={newServiceName}
                                                onChange={(e) => setNewServiceName(e.target.value)}
                                                className="px-2 py-1 text-xs border border-quiron-primary/30 rounded-lg outline-none focus:border-quiron-primary"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (newServiceName.trim() && onAddService) {
                                                        onAddService(newServiceName.trim().toUpperCase());
                                                        setData({ ...data, service: newServiceName.trim().toUpperCase() });
                                                        setNewServiceName('');
                                                        setIsAddingService(false);
                                                    }
                                                }}
                                                className="px-2 py-1 bg-quiron-primary text-white text-xs font-bold rounded-lg"
                                            >
                                                Añadir
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsAddingService(false);
                                                    setNewServiceName('');
                                                }}
                                                className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-lg"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="px-3 py-1 bg-quiron-primary/10 text-quiron-primary text-[10px] font-black rounded-lg tracking-widest uppercase">
                                    {data.service}
                                </span>
                            )}
                            <span className="text-xs font-bold text-gray-400">ID: #{data.id}</span>
                        </div>
                        {isEditing ? (
                            <div className="space-y-4">
                                <textarea
                                    className="text-4xl font-black text-quiron-secondary bg-gray-50 border-b-4 border-quiron-primary outline-none py-4 w-full min-h-[120px] rounded-t-3xl px-4"
                                    value={data.model}
                                    onChange={(e) => setData({ ...data, model: e.target.value })}
                                />
                                <div className="mt-4 flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Número de Serie (SN)</label>
                                    <input
                                        className="bg-gray-50 border-2 border-transparent focus:border-quiron-primary/30 rounded-2xl py-3 px-5 outline-none font-bold text-quiron-secondary transition-all"
                                        value={data.sn || ''}
                                        placeholder="Añadir SN vital para identificación..."
                                        onChange={(e) => setData({ ...data, sn: e.target.value })}
                                    />
                                </div>
                                <div className="mt-4 flex flex-col gap-2 relative">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Referencia del Equipo</label>
                                    <input
                                        className="bg-teal-50 border-2 border-teal-200 focus:border-teal-400 rounded-2xl py-3 px-5 outline-none font-bold text-teal-700 transition-all"
                                        value={refSearch || data.ref || ''}
                                        placeholder="Buscar o crear referencia..."
                                        onFocus={() => setShowReferences(true)}
                                        onChange={(e) => {
                                            setRefSearch(e.target.value.toUpperCase());
                                            setShowReferences(true);
                                        }}
                                    />
                                    {showReferences && (refSearch || uniqueReferences.length > 0) && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
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
                                            {refSearch && !uniqueReferences.find(r => r.ref === refSearch) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setData({ ...data, ref: refSearch });
                                                        setShowReferences(false);
                                                        setRefSearch('');
                                                    }}
                                                    className="w-full text-left px-5 py-3 bg-teal-50 hover:bg-teal-100 transition-colors text-teal-700 font-bold text-sm"
                                                >
                                                    + Crear nueva referencia: <span className="font-black">{refSearch}</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-[9px] text-gray-400 mt-1 font-bold ml-1">Selecciona referencia existente o crea una nueva</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-quiron-secondary tracking-tight leading-tight">{data.model}</h2>
                                {data.sn && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Serial Number:</span>
                                        <span className="text-sm font-mono font-bold text-quiron-primary bg-quiron-primary/5 px-3 py-1 rounded-lg">
                                            {data.sn}
                                        </span>
                                    </div>
                                )}
                                {data.ref && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Referencia:</span>
                                        <span className="text-sm font-mono font-bold text-quiron-primary bg-quiron-primary/10 px-3 py-1 rounded-lg border border-quiron-primary/20">
                                            {data.ref}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setShowEmailPopup(true)}
                                    className="p-3 text-quiron-secondary hover:text-quiron-primary hover:bg-quiron-primary/5 rounded-2xl transition-all group"
                                    title="Enviar correo al proveedor"
                                >
                                    <Mail size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-3 text-quiron-secondary hover:text-quiron-primary hover:bg-quiron-primary/5 rounded-2xl transition-all group"
                                    title="Editar"
                                >
                                    <Pencil size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-3 text-quiron-secondary hover:bg-gray-100 rounded-2xl transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Logistics Section */}
                    <Section label="Logística de Envío" icon={<Truck size={18} />}>
                        <div className="relative">
                            <DetailItem label="Proveedor / SAT" value={data.provider} edit={isEditing} onChange={(v) => {
                                setData({ ...data, provider: v });
                                setProviderSearch(v);
                                setShowProviders(true);
                            }} onFocus={() => isEditing && setShowProviders(true)} />

                            {isEditing && showProviders && uniqueProviders.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    {uniqueProviders.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => {
                                                setData({ ...data, provider: p });
                                                setShowProviders(false);
                                            }}
                                            className="w-full text-left px-5 py-3 text-sm font-bold text-quiron-secondary hover:bg-quiron-primary/5 transition-colors border-b border-gray-50 last:border-0"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-quiron-bg rounded-3xl p-5 border-2 border-transparent">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Contactos Proveedor {isEditing && <span className="text-quiron-primary">(múltiples permitidos)</span>}
                            </p>
                            {isEditing ? (
                                <div className="space-y-3">
                                    {/* Current contacts as tags */}
                                    {(() => {
                                        const contacts = Array.isArray(data.provider_contacts) ? data.provider_contacts :
                                            (data.provider_contact ? [data.provider_contact] : []);
                                        return contacts.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {contacts.map((contact, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-quiron-primary/10 text-quiron-primary text-sm font-bold rounded-full">
                                                        {contact}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newContacts = contacts.filter((_, i) => i !== idx);
                                                                setData({
                                                                    ...data,
                                                                    provider_contacts: newContacts,
                                                                    provider_contact: newContacts.join(', ')
                                                                });
                                                            }}
                                                            className="ml-1 text-quiron-primary/60 hover:text-red-500 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        );
                                    })()}

                                    {/* Input for adding new contacts */}
                                    <div className="relative">
                                        <input
                                            className="w-full bg-white rounded-xl px-4 py-3 font-bold text-quiron-secondary outline-none border-2 border-gray-100 focus:border-quiron-primary transition-colors"
                                            placeholder="Buscar o escribir email..."
                                            value={contactSearch}
                                            onFocus={() => setShowContacts(true)}
                                            onChange={(e) => {
                                                setContactSearch(e.target.value);
                                                setShowContacts(true);
                                            }}
                                            onBlur={() => setTimeout(() => setShowContacts(false), 200)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && contactSearch.trim()) {
                                                    e.preventDefault();
                                                    const contacts = Array.isArray(data.provider_contacts) ? data.provider_contacts :
                                                        (data.provider_contact ? [data.provider_contact] : []);
                                                    if (!contacts.includes(contactSearch.trim())) {
                                                        const newContacts = [...contacts, contactSearch.trim()];
                                                        setData({
                                                            ...data,
                                                            provider_contacts: newContacts,
                                                            provider_contact: newContacts.join(', ')
                                                        });
                                                    }
                                                    setContactSearch('');
                                                    setShowContacts(false);
                                                }
                                            }}
                                        />
                                        <p className="text-[9px] text-gray-400 mt-1 ml-1">Pulsa Enter para añadir un nuevo contacto</p>

                                        {/* Dropdown for existing contacts */}
                                        {showContacts && (uniqueContacts.length > 0 || contactSearch.trim()) && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto">
                                                {uniqueContacts.slice(0, 8).map(contact => (
                                                    <button
                                                        key={contact}
                                                        type="button"
                                                        className="w-full text-left px-4 py-3 hover:bg-quiron-primary/5 text-sm font-medium transition-colors border-b border-gray-100 last:border-0 flex items-center gap-2"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            const contacts = Array.isArray(data.provider_contacts) ? data.provider_contacts :
                                                                (data.provider_contact ? [data.provider_contact] : []);
                                                            const newContacts = [...contacts, contact];
                                                            setData({
                                                                ...data,
                                                                provider_contacts: newContacts,
                                                                provider_contact: newContacts.join(', ')
                                                            });
                                                            setContactSearch('');
                                                            setShowContacts(false);
                                                        }}
                                                    >
                                                        <Plus size={14} className="text-quiron-primary" />
                                                        {contact}
                                                    </button>
                                                ))}
                                                {contactSearch.trim() && !uniqueContacts.find(c => c.toLowerCase() === contactSearch.toLowerCase()) && (
                                                    <button
                                                        type="button"
                                                        className="w-full text-left px-4 py-3 bg-quiron-primary/5 hover:bg-quiron-primary/10 text-sm font-bold text-quiron-primary transition-colors flex items-center gap-2"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            const contacts = Array.isArray(data.provider_contacts) ? data.provider_contacts :
                                                                (data.provider_contact ? [data.provider_contact] : []);
                                                            const newContacts = [...contacts, contactSearch.trim()];
                                                            setData({
                                                                ...data,
                                                                provider_contacts: newContacts,
                                                                provider_contact: newContacts.join(', ')
                                                            });
                                                            setContactSearch('');
                                                            setShowContacts(false);
                                                        }}
                                                    >
                                                        <Plus size={14} />
                                                        Añadir: <span className="font-black">{contactSearch}</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const contacts = Array.isArray(data.provider_contacts) ? data.provider_contacts :
                                            (data.provider_contact ? [data.provider_contact] : []);
                                        return contacts.length > 0 ? contacts.map((contact, idx) => (
                                            <span key={idx} className="inline-flex items-center px-3 py-1.5 bg-quiron-secondary/10 text-quiron-secondary text-sm font-bold rounded-full">
                                                {contact}
                                            </span>
                                        )) : (
                                            <p className="font-bold text-gray-400 italic">Sin contactos</p>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="Fecha Envío" value={data.shipment_date} type="date" edit={isEditing} onChange={(v) => setData({ ...data, shipment_date: v })} />
                            <DetailItem label="Fecha Entrega" value={data.delivery_date || "Pendiente"} type="date" edit={isEditing} onChange={(v) => setData({ ...data, delivery_date: v })} />
                        </div>
                    </Section>

                    {/* Loan Section */}
                    <Section label="Gestión de Préstamo" icon={<Package size={18} />}>
                        <div className="flex items-center justify-between p-4 bg-quiron-bg rounded-2xl border border-gray-100">
                            <span className="text-sm font-bold text-quiron-secondary/70">Equipo en préstamo</span>
                            <input
                                type="checkbox"
                                checked={data.loan}
                                disabled={!isEditing}
                                onChange={(e) => setData({ ...data, loan: e.target.checked })}
                                className="w-5 h-5 accent-quiron-primary"
                            />
                        </div>
                        {data.loan && (
                            <DetailItem label="SN Sustitución" value={data.loan_sn} edit={isEditing} onChange={(v) => setData({ ...data, loan_sn: v })} placeholder="Introduce SN/Referencia" />
                        )}
                    </Section>

                    {/* Observations */}
                    <div className="md:col-span-2">
                        <Section label="Problema Constatado/Observaciones" icon={<ClipboardList size={18} />}>
                            {isEditing ? (
                                <textarea
                                    className="w-full p-6 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-quiron-primary outline-none font-medium min-h-[150px]"
                                    value={data.observations}
                                    onChange={(e) => setData({ ...data, observations: e.target.value })}
                                    placeholder="Detalles sobre el daño, presupuesto, etc."
                                />
                            ) : (
                                <div className="p-6 bg-gray-50 rounded-3xl font-medium text-quiron-secondary/80 leading-relaxed italic">
                                    {data.observations || "Sin observaciones adicionales."}
                                </div>
                            )}
                        </Section>
                    </div>
                </div>

                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-12 flex gap-4 items-center"
                    >
                        <button onClick={handleSave} className="btn-premium-primary flex-1 justify-center">
                            <Save size={20} /> Guardar Cambios
                        </button>
                        <button onClick={() => { setIsEditing(false); setShowProviders(false); }} className="px-8 font-bold text-gray-400 hover:text-quiron-secondary transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Eliminar envío"
                        >
                            <Trash2 size={20} />
                        </button>
                    </motion.div>
                )}
            </div>
        </div>

        {/* Email Popup */}
        <AnimatePresence>
            {showEmailPopup && (
                <EmailPopup
                    shipment={data}
                    onClose={() => setShowEmailPopup(false)}
                />
            )}
        </AnimatePresence>

        {/* Image Lightbox */}
        <AnimatePresence>
            {showImageLightbox && data.image && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowImageLightbox(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative max-w-4xl max-h-[90vh] w-full"
                    >
                        <img
                            src={data.image}
                            alt={data.model}
                            className="w-full h-full object-contain rounded-3xl shadow-2xl"
                        />
                        <button
                            onClick={() => setShowImageLightbox(false)}
                            className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-bold">
                            {data.model} - {data.ref}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
            {showDeleteConfirm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
                    >
                        <div className="bg-red-500 p-6 text-white text-center">
                            <Trash2 size={48} className="mx-auto mb-3" />
                            <h2 className="text-xl font-black">¿Eliminar este envío?</h2>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-gray-600 mb-2">Estás a punto de eliminar:</p>
                            <p className="font-black text-quiron-secondary text-lg">{data.model}</p>
                            <p className="text-sm text-gray-400">{data.ref} - SN: {data.sn}</p>
                            <p className="text-xs text-red-500 mt-4 font-bold">⚠️ Esta acción no se puede deshacer</p>
                        </div>
                        <div className="p-6 bg-gray-50 flex gap-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    onDelete(data.id);
                                }}
                                className="flex-1 py-3 px-6 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                            >
                                Eliminar
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </>);
};

const Section = ({ label, icon, children }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2 text-quiron-primary mb-6">
            <div className="w-8 h-8 rounded-xl bg-quiron-primary/10 flex items-center justify-center">
                {icon}
            </div>
            <h3 className="font-black text-[10px] uppercase tracking-widest">{label}</h3>
        </div>
        <div className="space-y-4">{children}</div>
    </div>
);

const DetailItem = ({ label, value, edit, onChange, onFocus, type = "text", placeholder }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        {edit ? (
            <input
                type={type}
                onFocus={onFocus}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-quiron-primary/30 rounded-2xl py-3 px-5 outline-none font-bold text-quiron-secondary transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        ) : (
            <div className="w-full bg-white border border-gray-100 rounded-2xl py-3 px-5 font-bold text-quiron-secondary">
                {value}
            </div>
        )}
    </div>
);

export default ShipmentDetail;
