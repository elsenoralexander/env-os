import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Clock, Zap, ArrowLeft, BarChart3,
    Users, ClipboardCheck, Filter, Calendar,
    ArrowRight, ChevronDown, Package, Activity
} from 'lucide-react';

const AnalyticsDashboard = ({ shipments, onClose }) => {
    const [timeRange, setTimeRange] = useState('ALL'); // '30D', '6M', 'ALL'
    const [selectedProvider, setSelectedProvider] = useState('TODO');

    const providers = useMemo(() => {
        const p = shipments.map(s => s.provider);
        return ['TODO', ...new Set(p)].filter(Boolean);
    }, [shipments]);

    const stats = useMemo(() => {
        const getDays = (start, end) => {
            if (!start || !end) return 0;
            return Math.max(0, Math.floor((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
        };

        const now = new Date();
        const filtered = shipments.filter(s => {
            const matchesProvider = selectedProvider === 'TODO' || s.provider === selectedProvider;

            if (timeRange === '30D') {
                const date = new Date(s.shipment_date);
                const diff = (now - date) / (1000 * 60 * 60 * 24);
                return diff <= 30 && matchesProvider;
            }
            if (timeRange === '6M') {
                const date = new Date(s.shipment_date);
                const diff = (now - date) / (1000 * 60 * 60 * 24 * 30);
                return diff <= 6 && matchesProvider;
            }
            return matchesProvider;
        });

        const received = filtered.filter(s => s.delivery_date);

        // 1. Avg Management Time (Real)
        const avgManagement = received.length ?
            received.reduce((acc, s) => acc + getDays(s.shipment_date, s.delivery_date), 0) / received.length : 0;

        // 2. Provider response time (Hypothetical logic: 80% of total time is provider)
        const avgSatResponse = received.length ?
            received.reduce((acc, s) => acc + (getDays(s.shipment_date, s.delivery_date) * 0.8), 0) / received.length : 0;

        // 3. Provider Ranking (Slowest)
        const providerData = filtered.reduce((acc, s) => {
            if (!acc[s.provider]) acc[s.provider] = { count: 0, totalDays: 0, activeCount: 0 };
            const days = s.delivery_date ? getDays(s.shipment_date, s.delivery_date) : getDays(s.shipment_date, now);
            acc[s.provider].count++;
            acc[s.provider].totalDays += days;
            if (!s.delivery_date) acc[s.provider].activeCount++;
            return acc;
        }, {});

        const topProviders = Object.entries(providerData)
            .map(([name, data]) => ({
                name,
                avg: (data.totalDays / data.count).toFixed(1),
                total: data.count,
                active: data.activeCount
            }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5);

        // 4. Monthly Flow (Last 6 Months) - Continuous trend
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const flow = Array(6).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(1); // Avoid month overflow
            d.setMonth(d.getMonth() - (5 - i));
            const targetMonth = d.getMonth();
            const targetYear = d.getFullYear();

            // Use all shipments to show trend, filtered only by provider
            const count = shipments.filter(s => {
                const matchesProvider = selectedProvider === 'TODO' || s.provider === selectedProvider;
                if (!matchesProvider || !s.shipment_date) return false;
                const sDate = new Date(s.shipment_date);
                return sDate.getMonth() === targetMonth && sDate.getFullYear() === targetYear;
            }).length;

            console.log(`📊 Flow Chart - ${months[targetMonth]} ${targetYear}: ${count} envíos`);
            return { name: months[targetMonth], count };
        });

        console.log('📊 Flow data complete:', flow);

        return {
            avgManagement: avgManagement.toFixed(1),
            avgSatResponse: avgSatResponse.toFixed(1),
            totalProcessed: received.length,
            efficiency: (received.length / (filtered.length || 1) * 100).toFixed(1),
            topProviders,
            flow,
            totalActive: filtered.filter(s => !s.delivery_date).length
        };
    }, [shipments, timeRange, selectedProvider]);

    return (
        <div className="p-8 lg:p-12 animate-slide-in relative">
            {/* Header / Filter Bar */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 mb-16">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onClose}
                        className="w-14 h-14 rounded-2xl bg-white shadow-soft flex items-center justify-center text-quiron-secondary hover:text-quiron-primary transition-all active:scale-95 border border-gray-100"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-4xl font-black text-quiron-secondary uppercase tracking-tighter">Insights & Analytics</h2>
                        <div className="flex items-center gap-2 text-quiron-primary font-bold tracking-[0.2em] text-[10px] uppercase">
                            <Activity size={12} />
                            Hospital Command Center v2.1
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white/40 backdrop-blur-md p-2 rounded-3xl border border-white/60 shadow-xl">
                    <div className="flex gap-1 p-1 bg-gray-100/50 rounded-2xl">
                        {['30D', '6M', 'ALL'].map(r => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${timeRange === r ? 'bg-white text-quiron-primary shadow-sm' : 'text-gray-400 hover:text-quiron-secondary'}`}
                            >
                                {r === '30D' ? '30 DÍAS' : r === '6M' ? '6 MESES' : 'TOTAL'}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-quiron-secondary/40" size={16} />
                        <select
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value)}
                            className="bg-white/50 pl-11 pr-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-quiron-primary/30 cursor-pointer appearance-none min-w-[180px]"
                        >
                            {providers.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-quiron-secondary/40" />
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                <KPICard
                    icon={<Clock size={28} />}
                    label="Media Gestión Interna"
                    value={`${stats.avgManagement}d`}
                    sub={`${stats.totalProcessed} completados`}
                    color="text-quiron-secondary"
                    bgColor="bg-quiron-secondary"
                />
                <KPICard
                    icon={<Zap size={28} />}
                    label="Media Respuesta SAT"
                    value={`${stats.avgSatResponse}d`}
                    sub="Tiempo hasta recepción"
                    color="text-quiron-accent"
                    bgColor="bg-quiron-accent"
                />
                <KPICard
                    icon={<Package size={28} />}
                    label="Equipos en proceso"
                    value={stats.totalActive}
                    sub="Fuera del hospital"
                    color="text-blue-500"
                    bgColor="bg-blue-500"
                />
                <KPICard
                    icon={<TrendingUp size={28} />}
                    label="Tasa Resolución"
                    value={`${stats.efficiency}%`}
                    sub="Ratio éxito mensual"
                    color="text-green-500"
                    bgColor="bg-green-500"
                />
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Monthly Flow Bar Chart */}
                <div className="lg:col-span-2 premium-card p-10 bg-white/60 backdrop-blur-xl border border-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BarChart3 size={120} />
                    </div>
                    <div className="flex justify-between items-center mb-12 relative z-10">
                        <h3 className="text-xl font-black text-quiron-secondary flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-quiron-primary/10 flex items-center justify-center text-quiron-primary">
                                <BarChart3 size={20} />
                            </div>
                            Flujo de Envíos (Mensual)
                        </h3>
                        <span className="text-[10px] font-black text-quiron-primary bg-quiron-primary/5 px-4 py-1 rounded-full uppercase tracking-tighter">
                            Envíos Totales
                        </span>
                    </div>

                    <div className="h-72 flex items-end justify-between gap-6 px-4">
                        {stats.flow.map((d, i) => {
                            const maxCount = Math.max(...stats.flow.map(f => f.count), 1);
                            const heightPercent = d.count > 0 ? Math.max(5, (d.count / maxCount) * 100) : 0;

                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group/bar">
                                    <div className="w-full relative flex flex-col items-center justify-end h-full">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${heightPercent}%` }}
                                            transition={{ delay: i * 0.1, duration: 1, ease: "circOut" }}
                                            className="w-full max-w-[40px] medical-gradient rounded-xl relative group-hover/bar:brightness-125 transition-all shadow-xl"
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-quiron-secondary text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap">
                                                {d.count} Env.
                                            </div>
                                        </motion.div>
                                    </div>
                                    <p className="text-[10px] font-black text-quiron-secondary/40 uppercase tracking-widest mt-6 group-hover/bar:text-quiron-primary transition-colors">{d.name}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Slowest Providers Ranking */}
                <div className="premium-card p-10 medical-gradient text-white border-transparent shadow-2xl relative overflow-hidden group">
                    <div className="absolute -bottom-10 -right-10 text-white/5 group-hover:scale-110 transition-transform duration-1000">
                        <Users size={240} />
                    </div>

                    <h3 className="text-xl font-black mb-10 flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                            <TrendingUp size={20} />
                        </div>
                        Demora por Proveedor
                    </h3>

                    <div className="space-y-8 relative z-10">
                        {stats.topProviders.map((p, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                key={i}
                                className="group/item"
                            >
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex-1 mr-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover/item:text-white transition-colors truncate">{p.name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-black">{p.avg} días</p>
                                            <span className="text-[10px] text-white/30 font-bold">({p.total} envíos)</span>
                                        </div>
                                    </div>
                                    {p.active > 0 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white rounded-lg border border-white/20 text-[9px] font-black">
                                            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                            {p.active} PEND.
                                        </div>
                                    )}
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(p.avg / (stats.topProviders[0].avg || 1)) * 100}%` }}
                                        className="h-full bg-white/30"
                                    />
                                </div>
                            </motion.div>
                        ))}

                        {stats.topProviders.length === 0 && (
                            <div className="py-12 text-center opacity-30 italic font-bold">
                                No hay datos suficientes para generar el ranking
                            </div>
                        )}
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/10 relative z-10">
                        <div className="flex items-center justify-between text-[10px] font-black tracking-widest opacity-40 uppercase">
                            <span>SLA Objetivo: 5.0d</span>
                            <span>Métrica Crítica</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ icon, label, value, sub, color, bgColor }) => (
    <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        className="premium-card p-8 bg-white/50 backdrop-blur-xl border border-white hover:border-quiron-primary/30 transition-all group"
    >
        <div className={`w-16 h-16 rounded-[1.5rem] ${bgColor} shadow-lg flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-quiron-secondary transition-colors">{label}</p>
            <div className="flex items-baseline gap-2">
                <p className={`text-4xl font-black tracking-tighter ${color}`}>{value}</p>
            </div>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-2">{sub}</p>
        </div>
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={20} className="text-quiron-primary/20" />
        </div>
    </motion.div>
);

export default AnalyticsDashboard;
