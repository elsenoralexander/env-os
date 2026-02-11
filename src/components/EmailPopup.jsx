import React, { useState } from 'react';
import { X, Mail, Truck, Building2, Check, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmailPopup = ({ shipment, onClose }) => {
    const [deliveryType, setDeliveryType] = useState('pickup'); // 'pickup' or 'hospital'
    const [needsLoan, setNeedsLoan] = useState(false);

    const generateEmailBody = () => {
        const loanText = needsLoan
            ? '\n\nNos gustaría disponer de un equipo en préstamo para continuar con la actividad habitual.'
            : '';

        const actionText = deliveryType === 'pickup'
            ? 'Solicitamos recogida en la oficina de electromedicina (Almacén general).'
            : 'Procederemos al envío del equipo a vuestras instalaciones.';

        if (shipment.ref === 'INSTRUMENTAL') {
            return `Buenos días,

Tenemos el siguiente material para reparar: ${shipment.observations || '[OBSERVACIONES Y DOCUMENTACIÓN]'}.

${actionText}${loanText}

Muchas gracias`;
        }

        return `Hola,

Tenemos el equipo ${shipment.model || '[DESCRIPCIÓN DEL EQUIPO]'} referencia ${shipment.ref || '[REFERENCIA]'} con SN: ${shipment.sn || '[NUMERO DE SERIE]'} con el siguiente problema:

${shipment.observations || '[PROBLEMA CONSTATADO/OBSERVACIONES]'}

${actionText}${loanText}

Muchas gracias.`;
    };

    const handleSendEmail = () => {
        const subject = encodeURIComponent(`Solicitud servicio técnico - ${shipment.model || 'Equipo'} - Ref: ${shipment.ref || 'N/A'}`);
        const body = encodeURIComponent(generateEmailBody());
        const email = shipment.provider_contact || '';

        // Try to extract email from provider_contact if it contains one
        const emailMatch = email.match(/[\w.-]+@[\w.-]+\.\w+/);
        const toEmail = emailMatch ? emailMatch[0] : '';

        window.open(`mailto:${toEmail}?subject=${subject}&body=${body}`, '_blank');
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="medical-gradient p-6 text-white flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Enviar Correo al Proveedor</h2>
                                <p className="text-sm opacity-80">{shipment.provider}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Delivery Type Selection */}
                    <div className="space-y-3">
                        <p className="text-sm font-black text-quiron-secondary uppercase tracking-widest">¿Solicitar recogida o enviar desde centro?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setDeliveryType('pickup')}
                                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${deliveryType === 'pickup'
                                    ? 'border-quiron-primary bg-quiron-primary/5 shadow-lg'
                                    : 'border-gray-200 hover:border-quiron-primary/50'
                                    }`}
                            >
                                <div className={`p-3 rounded-xl ${deliveryType === 'pickup' ? 'bg-quiron-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <Truck size={24} />
                                </div>
                                <div className="text-center">
                                    <p className={`font-black text-sm ${deliveryType === 'pickup' ? 'text-quiron-primary' : 'text-gray-600'}`}>Solicitar Recogida</p>
                                    <p className="text-[10px] text-gray-400 mt-1">El proveedor recoge el equipo</p>
                                </div>
                                {deliveryType === 'pickup' && (
                                    <div className="absolute top-2 right-2 bg-quiron-primary text-white p-1 rounded-full">
                                        <Check size={12} />
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={() => setDeliveryType('hospital')}
                                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${deliveryType === 'hospital'
                                    ? 'border-quiron-primary bg-quiron-primary/5 shadow-lg'
                                    : 'border-gray-200 hover:border-quiron-primary/50'
                                    }`}
                            >
                                <div className={`p-3 rounded-xl ${deliveryType === 'hospital' ? 'bg-quiron-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <Building2 size={24} />
                                </div>
                                <div className="text-center">
                                    <p className={`font-black text-sm ${deliveryType === 'hospital' ? 'text-quiron-primary' : 'text-gray-600'}`}>Enviar desde Centro</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Nosotros enviamos el equipo</p>
                                </div>
                                {deliveryType === 'hospital' && (
                                    <div className="absolute top-2 right-2 bg-quiron-primary text-white p-1 rounded-full">
                                        <Check size={12} />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Loan Request */}
                    <div className="space-y-3">
                        <p className="text-sm font-black text-quiron-secondary uppercase tracking-widest">¿Se solicita préstamo?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setNeedsLoan(true)}
                                className={`p-4 rounded-2xl border-2 transition-all ${needsLoan
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-200 text-gray-500 hover:border-green-300'
                                    }`}
                            >
                                <p className="font-black text-lg">Sí</p>
                                <p className="text-[10px] opacity-70">Necesitamos préstamo</p>
                            </button>
                            <button
                                onClick={() => setNeedsLoan(false)}
                                className={`p-4 rounded-2xl border-2 transition-all ${!needsLoan
                                    ? 'border-gray-500 bg-gray-50 text-gray-700'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <p className="font-black text-lg">No</p>
                                <p className="text-[10px] opacity-70">No es necesario</p>
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 rounded-2xl p-4 max-h-48 overflow-y-auto">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vista previa del correo:</p>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                            {generateEmailBody()}
                        </pre>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-quiron-primary/5 rounded-2xl p-4 flex items-center gap-3">
                        <Mail size={18} className="text-quiron-primary" />
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Contacto proveedor:</p>
                            <p className="text-sm font-bold text-quiron-secondary">{shipment.provider_contact || 'No especificado'}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                    <button
                        onClick={handleSendEmail}
                        className="w-full h-14 medical-gradient text-white rounded-2xl font-black text-sm tracking-widest shadow-xl shadow-quiron-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Send size={18} />
                        ABRIR CLIENTE DE CORREO
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default EmailPopup;
