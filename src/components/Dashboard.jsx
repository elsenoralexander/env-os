import React, { useState, useMemo } from 'react';
import {
    Search, Filter, Plus, Package, Truck, Clock,
    AlertTriangle, Settings2, BarChart3, ChevronDown,
    CheckCircle2, ArrowRight, X, Pencil, Camera, ClipboardList, Info, ArrowUpDown
} from 'lucide-react';
import ShipmentCard from './ShipmentCard';
import ShipmentForm from './ShipmentForm';
import ShipmentDetail from './ShipmentDetail';
import AnalyticsDashboard from './AnalyticsDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '/Logo.png';

const Dashboard = ({
    shipments,
    allShipments,
    services,
    currentView,
    onViewChange,
    onAddShipment,
    onEditShipment,
    onDeleteShipment,
    onAddService,
    // Master data props
    masterReferences,
    masterProviders,
    onAddReference,
    onEditReference,
    onDeleteReference,
    onAddProvider,
    onEditProvider,
    onDeleteProvider
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedService, setSelectedService] = useState('TODO');
    const [showForm, setShowForm] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [filterLoan, setFilterLoan] = useState(false);
    const [sortDescending, setSortDescending] = useState(true); // Newest first by default

    const filteredShipments = useMemo(() => {
        const filtered = shipments.filter(s => {
            const matchesSearch = !searchTerm ||
                s.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.sn && s.sn.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (s.ref && s.ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
                s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.service && s.service.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesService = selectedService === 'TODO' || s.service === selectedService;
            const matchesLoan = !filterLoan || s.loan === true;

            return matchesSearch && matchesService && matchesLoan;
        });

        // Sort by date
        return filtered.sort((a, b) => {
            const dateA = new Date(a.shipment_date || a.createdAt || 0);
            const dateB = new Date(b.shipment_date || b.createdAt || 0);
            return sortDescending ? dateB - dateA : dateA - dateB;
        });
    }, [shipments, searchTerm, selectedService, filterLoan, sortDescending]);

    const handleQuickReceipt = (shipment) => {
        const updated = {
            ...shipment,
            status: 'RECIBIDO',
            delivery_date: new Date().toISOString().split('T')[0]
        };
        onEditShipment(updated);

        if (window.confetti) {
            window.confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00B4D8', '#0077B6', '#90E0EF']
            });
        }
    };

    return (
        <div className="max-w-[1700px] mx-auto px-6 py-10">
            {/* Premium Navigation / Header */}
            <nav className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-16 animate-slide-in">
                <div className="flex items-center gap-6">
                    <div
                        className="w-16 h-16 rounded-2xl bg-quiron-primary shadow-premium flex items-center justify-center overflow-hidden border-2 border-quiron-primary cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => {
                            onViewChange('main');
                            setFilterLoan(false);
                        }}
                    >
                        <img src={Logo} alt="Hospital Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-quiron-secondary leading-none mb-2">Policlinica Gipuzkoa</h1>
                        <div className="flex items-center gap-2 text-quiron-primary font-bold tracking-widest text-[10px] uppercase">
                            <span className="w-2 h-2 bg-quiron-primary rounded-full animate-pulse"></span>
                            Electromedicina Suite v2.1
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/50 p-2 rounded-3xl border border-white/50 shadow-sm">
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-premium-primary"
                    >
                        <Plus size={20} />
                        Registrar Nuevo Envío
                    </button>
                </div>
            </nav>

            <AnimatePresence mode="wait">
                {currentView === 'analytics' ? (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <AnalyticsDashboard
                            shipments={allShipments}
                            onClose={() => onViewChange('main')}
                            services={services}
                            masterReferences={masterReferences}
                            masterProviders={masterProviders}
                            onAddReference={onAddReference}
                            onEditReference={onEditReference}
                            onDeleteReference={onDeleteReference}
                            onAddProvider={onAddProvider}
                            onEditProvider={onEditProvider}
                            onDeleteProvider={onDeleteProvider}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Hero Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                            <StatCard
                                icon={<Truck size={32} />}
                                label="Envíos Activos"
                                value={allShipments.filter(s => !s.delivery_date).length}
                                color="bg-quiron-secondary"
                                delay={0}
                                active={currentView === 'main' && !filterLoan}
                                onClick={() => {
                                    onViewChange('main');
                                    setFilterLoan(false);
                                }}
                            />
                            <StatCard
                                icon={<CheckCircle2 size={32} />}
                                label="Recibidos"
                                value={allShipments.filter(s => s.delivery_date).length}
                                color="bg-quiron-accent"
                                delay={0.1}
                                active={currentView === 'history'}
                                onClick={() => onViewChange('history')}
                            />
                            <StatCard
                                icon={<Package size={32} />}
                                label="Equipos Préstamo"
                                value={allShipments.filter(s => s.loan && !s.delivery_date).length}
                                color="bg-blue-600"
                                delay={0.2}
                                active={currentView === 'main' && filterLoan}
                                onClick={() => {
                                    onViewChange('main');
                                    setFilterLoan(true);
                                }}
                            />
                            <StatCard
                                icon={<BarChart3 size={32} />}
                                label="Análisis de Datos"
                                value="Insights"
                                color="bg-quiron-primary"
                                delay={0.3}
                                active={currentView === 'analytics'}
                                onClick={() => onViewChange('analytics')}
                            />
                        </div>

                        {/* Control Panel */}
                        <div className="flex flex-col lg:flex-row gap-6 mb-12 items-end">
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-[10px] font-bold text-quiron-secondary/60 uppercase ml-4 tracking-widest">
                                    {currentView === 'history' ? 'Buscador Historial' : 'Buscador Inteligente'}
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-quiron-secondary/40 group-focus-within:text-quiron-primary transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por modelo, marca, SN..."
                                        className="input-premium pl-14 h-16 text-lg placeholder:text-gray-300"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="w-full lg:w-72 space-y-2">
                                <label className="text-[10px] font-bold text-quiron-secondary/60 uppercase ml-4 tracking-widest">Servicio</label>
                                <div className="relative">
                                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-quiron-secondary/40" size={20} />
                                    <select
                                        className="input-premium pl-14 h-16 appearance-none cursor-pointer"
                                        value={selectedService}
                                        onChange={(e) => setSelectedService(e.target.value)}
                                    >
                                        {services.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-quiron-secondary/40 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {/* Sort Order Toggle */}
                            <button
                                onClick={() => setSortDescending(!sortDescending)}
                                className="flex items-center gap-2 px-5 h-16 bg-white rounded-2xl border-2 border-gray-100 hover:border-quiron-primary/30 transition-all group"
                                title={sortDescending ? 'Mostrando más recientes primero' : 'Mostrando más antiguos primero'}
                            >
                                <ArrowUpDown size={20} className="text-quiron-secondary/60 group-hover:text-quiron-primary transition-colors" />
                                <span className="text-sm font-bold text-quiron-secondary/60 group-hover:text-quiron-primary transition-colors hidden sm:inline">
                                    {sortDescending ? 'Recientes ↓' : 'Antiguos ↑'}
                                </span>
                            </button>
                        </div>

                        {/* Results Grid */}
                        <div className="min-h-[500px]">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {filteredShipments.length > 0 ? (
                                    <motion.div
                                        layout
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                                    >
                                        {filteredShipments.map((shipment) => (
                                            <ShipmentCard
                                                key={shipment.id}
                                                shipment={shipment}
                                                onClick={() => setSelectedShipment(shipment)}
                                                onQuickReceipt={handleQuickReceipt}
                                            />
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-32 text-center"
                                    >
                                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-premium mb-6 border border-gray-100">
                                            <AlertTriangle size={48} className="text-quiron-primary/20" />
                                        </div>
                                        <h2 className="text-2xl font-black text-quiron-secondary uppercase">Sin registros</h2>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 px-10">No se han encontrado equipos en esta sección.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {showForm && (
                    <Modal onClose={() => setShowForm(false)}>
                        <ShipmentForm
                            services={services}
                            allShipments={allShipments}
                            masterReferences={masterReferences}
                            masterProviders={masterProviders}
                            onSave={(data, shouldClose = true) => {
                                onAddShipment(data);
                                if (shouldClose) setShowForm(false);
                            }}
                            onAddService={onAddService}
                            onCancel={() => setShowForm(false)}
                        />
                    </Modal>
                )}

                {selectedShipment && (
                    <Modal onClose={() => setSelectedShipment(null)}>
                        <ShipmentDetail
                            shipment={selectedShipment}
                            allShipments={allShipments}
                            services={services}
                            masterReferences={masterReferences}
                            masterProviders={masterProviders}
                            onSave={(data) => {
                                onEditShipment(data);
                                setSelectedShipment(null);
                            }}
                            onDelete={(id) => {
                                onDeleteShipment(id);
                                setSelectedShipment(null);
                            }}
                            onQuickReceipt={handleQuickReceipt}
                            onClose={() => setSelectedShipment(null)}
                            onAddService={onAddService}
                        />
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ icon, label, value, color, delay, active, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        onClick={onClick}
        className={`premium-card p-6 flex items-center gap-6 cursor-pointer border-2 transition-all hover:scale-[1.05] relative overflow-hidden ${active ? 'border-quiron-primary bg-white shadow-xl translate-y-[-5px]' : 'border-transparent medical-gradient text-white shadow-lg'
            }`}
    >
        {active && <div className="absolute top-0 left-0 w-full h-1 bg-quiron-primary" />}
        <div className={`p-4 rounded-[1.5rem] ${active ? color + ' text-white' : 'bg-white/10 text-white'} shadow-lg flex items-center justify-center`}>
            {icon}
        </div>
        <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-quiron-secondary/40' : 'text-white/60'}`}>{label}</p>
            <p className={`text-4xl font-black tracking-tight ${active ? 'text-quiron-secondary' : 'text-white'}`}>{value}</p>
        </div>
    </motion.div>
);

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-quiron-secondary/60 backdrop-blur-xl"
        />
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            className="relative w-full max-w-6xl max-h-full overflow-auto"
        >
            {children}
        </motion.div>
    </div>
);

export default Dashboard;
