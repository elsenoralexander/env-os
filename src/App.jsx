import React, { useState, useEffect } from 'react';
import initialData from './data/initial_data.json';
import Dashboard from './components/Dashboard';
import { AnimatePresence } from 'framer-motion';

const DEFAULT_SERVICES = [
    'TODO', 'QUIROFANO', 'UCI', 'URGENCIAS', 'HOSPITALIZACIÓN',
    'RESONANCIA/TAC', 'LABORATORIO', 'CONSULTAS S1', 'CONSULTAS 3P',
    'NIDO', 'HOSPITAL DE DÍA'
];

function App() {
    const [shipments, setShipments] = useState([]);
    const [services, setServices] = useState(DEFAULT_SERVICES);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('main'); // 'main', 'history', 'analytics'

    useEffect(() => {
        const savedShipments = localStorage.getItem('hospital_shipments');
        const savedServices = localStorage.getItem('hospital_services');

        if (savedShipments) {
            setShipments(JSON.parse(savedShipments));
        } else {
            // Transform initial data to extract SN if possible and add priority
            const transformedData = initialData.map(item => {
                let sn = item.sn || '';
                let model = item.model;

                // Try to extract SN from model string if not present
                if (!sn) {
                    const snMatch = model.match(/(?:sn|SN|S\/N|S\.N\.|SN:)\s*([A-Z0-9]+)/i);
                    if (snMatch) {
                        sn = snMatch[1];
                        // Optionally strip SN from model for cleaner display, but user might prefer it as is
                    }
                }

                return {
                    ...item,
                    sn: sn,
                    ref: item.ref || '', // Equipment reference
                    provider_contact: item.provider_contact || '', // Provider contact
                    priority: item.priority || 'NORMAL', // DEFAULT_PRIORITY
                    status: item.delivery_date ? 'RECIBIDO' : (item.status || 'ENVIADO A SERVICIO TECNICO')
                };
            });
            setShipments(transformedData);
            localStorage.setItem('hospital_shipments', JSON.stringify(transformedData));
        }

        if (savedServices) {
            setServices(JSON.parse(savedServices));
        } else {
            setServices(DEFAULT_SERVICES);
            localStorage.setItem('hospital_services', JSON.stringify(DEFAULT_SERVICES));
        }

        setLoading(false);
    }, []);

    const updateShipments = (updated) => {
        setShipments(updated);
        localStorage.setItem('hospital_shipments', JSON.stringify(updated));
    };

    const addShipment = (newShipment) => {
        updateShipments([newShipment, ...shipments]);
    };

    const editShipment = (updatedShipment) => {
        const updated = shipments.map(s => s.id === updatedShipment.id ? updatedShipment : s);
        updateShipments(updated);
    };

    const addService = (newService) => {
        const updated = [...services, newService.toUpperCase()];
        setServices(updated);
        localStorage.setItem('hospital_services', JSON.stringify(updated));
    };

    // Helper to calculate days out for sorting
    const getDaysOut = (s) => {
        if (!s.shipment_date) return 0;
        const start = new Date(s.shipment_date);
        const end = s.delivery_date ? new Date(s.delivery_date) : new Date();
        return Math.floor((end - start) / (1000 * 60 * 60 * 24));
    };

    const activeShipments = shipments
        .filter(s => !s.delivery_date)
        .sort((a, b) => getDaysOut(b) - getDaysOut(a)); // Default sort: Días Fuera desc

    const receivedShipments = shipments
        .filter(s => s.delivery_date)
        .sort((a, b) => new Date(b.delivery_date) - new Date(a.delivery_date));

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-quiron-bg">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-quiron-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-quiron-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-quiron-bg selection:bg-quiron-primary/20">
            <Dashboard
                shipments={currentView === 'history' ? receivedShipments : activeShipments}
                allShipments={shipments}
                services={services}
                currentView={currentView}
                onViewChange={setCurrentView}
                onAddShipment={addShipment}
                onEditShipment={editShipment}
                onAddService={addService}
            />
        </div>
    );
}

export default App;
