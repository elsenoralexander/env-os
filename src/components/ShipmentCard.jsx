import React from 'react';
import { Calendar, Building2, Info, ChevronRight, MapPin, Package, Clock, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ShipmentCard = ({ shipment, onClick, onQuickReceipt }) => {
    const isEnRoute = !shipment.delivery_date;

    return (
        <motion.div
            layout
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="premium-card group relative overflow-hidden"
        >
            {/* Visual Header */}
            <div className="h-44 bg-gray-100 relative overflow-hidden cursor-pointer" onClick={onClick}>
                {shipment.image ? (
                    <img src={shipment.image} alt={shipment.model} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full medical-gradient opacity-10 flex items-center justify-center">
                        <Package size={64} className="text-quiron-secondary" />
                    </div>
                )}

                {/* Glow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Floating Tags */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {shipment.loan && (
                        <div className="bg-quiron-primary text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-xl tracking-tighter uppercase whitespace-nowrap">
                            EQUIPO EN PRÉSTAMO
                        </div>
                    )}
                    <div className={`text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-xl tracking-tighter uppercase whitespace-nowrap ${shipment.status === 'RECIBIDO' ? 'bg-green-500' :
                            shipment.status === 'PRESUPUESTO ACEPTADO' ? 'bg-orange-500' :
                                shipment.status === 'REPARANDO EN ELECTROMEDICINA' ? 'bg-yellow-500' :
                                    'bg-red-500'
                        }`}>
                        {shipment.status || 'ENVIADO A SERVICIO TECNICO'}
                    </div>
                    {shipment.priority === 'ALTA' && (
                        <div className="bg-red-500 text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-xl tracking-tighter uppercase whitespace-nowrap flex items-center gap-1">
                            <AlertCircle size={10} />
                            PRIORIDAD ALTA
                        </div>
                    )}
                </div>

            </div>


            {/* Content */}
            <div className="p-6 cursor-pointer" onClick={onClick}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-quiron-primary" />
                        <span className="text-[10px] font-black text-quiron-secondary/40 tracking-[0.2em] uppercase">
                            {shipment.service}
                        </span>
                    </div>
                </div>

                <h3 className="text-xl font-extrabold text-quiron-secondary leading-tight mb-2 line-clamp-2 min-h-[3rem] group-hover:text-quiron-primary transition-colors">
                    {shipment.model}
                </h3>

                {shipment.sn && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 flex flex-col gap-1">
                        <span className="text-[9px] font-black text-quiron-secondary/30 uppercase tracking-[0.2em]">Número de Serie</span>
                        <span className="text-sm font-mono font-black text-quiron-primary truncate">
                            {shipment.sn}
                        </span>
                    </div>
                )}

                {shipment.ref && (
                    <div className="bg-quiron-primary/5 p-4 rounded-2xl border border-quiron-primary/20 mb-6 flex flex-col gap-1">
                        <span className="text-[9px] font-black text-quiron-primary/40 uppercase tracking-[0.2em]">Referencia</span>
                        <span className="text-sm font-mono font-black text-quiron-primary truncate">
                            {shipment.ref}
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 mt-auto">
                    {/* Días Fuera */}
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Días Fuera</p>
                        <div className="flex items-center gap-2 text-xl font-black text-quiron-secondary">
                            <Clock size={18} className="text-quiron-accent" />
                            {(() => {
                                if (!shipment.shipment_date) return '0';
                                const start = new Date(shipment.shipment_date);
                                const end = shipment.delivery_date ? new Date(shipment.delivery_date) : new Date();
                                return Math.floor((end - start) / (1000 * 60 * 60 * 24));
                            })()}
                        </div>
                    </div>

                    {/* Fecha Envío */}
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Fecha Envío</p>
                        <p className="text-sm font-bold text-quiron-secondary">
                            {shipment.shipment_date ? new Date(shipment.shipment_date).toLocaleDateString('es-ES') : 'Sin fecha'}
                        </p>
                    </div>

                    {/* Servicio */}
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Servicio</p>
                        <p className="text-xs font-black text-quiron-primary bg-quiron-primary/5 px-3 py-1 rounded-full inline-block truncate max-w-full">
                            {shipment.service || 'TODO'}
                        </p>
                    </div>

                    {/* Proveedor */}
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Proveedor</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-quiron-secondary truncate">
                            <Building2 size={14} className="text-quiron-primary flex-shrink-0" />
                            <span className="truncate">{shipment.provider}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ShipmentCard;
