import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
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
    const [currentView, setCurrentView] = useState('main');
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'
    const [notification, setNotification] = useState(null); // { message, type: 'success' | 'error' }

    // Helper to show notifications
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    // Initialize services config only (NO shipment auto-initialization to prevent data loss)
    const initializeServicesConfig = async () => {
        try {
            const servicesDoc = doc(db, 'config', 'services');
            const servicesSnap = await getDocs(collection(db, 'config'));
            if (servicesSnap.empty) {
                await setDoc(servicesDoc, { list: DEFAULT_SERVICES });
                console.log('✅ Services config initialized');
            }
        } catch (error) {
            console.error('❌ Error initializing services config:', error);
        }
    };

    useEffect(() => {
        console.log('🔌 Connecting to Firebase...');

        // Subscribe to real-time updates
        const unsubscribeShipments = onSnapshot(
            collection(db, 'shipments'),
            (snapshot) => {
                const shipmentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setShipments(shipmentsData);
                setLoading(false);
                setConnectionStatus('connected');
                console.log('🔄 Shipments synced:', shipmentsData.length, 'documents');
            },
            (error) => {
                console.error('❌ Firebase connection error:', error);
                setConnectionStatus('error');
                setLoading(false);
                showNotification('Error de conexión con Firebase: ' + error.message, 'error');
            }
        );

        const unsubscribeServices = onSnapshot(
            doc(db, 'config', 'services'),
            (docSnap) => {
                if (docSnap.exists()) {
                    setServices(docSnap.data().list || DEFAULT_SERVICES);
                }
            },
            (error) => {
                console.error('❌ Error fetching services:', error);
            }
        );

        // Initialize services config only
        initializeServicesConfig();

        return () => {
            unsubscribeShipments();
            unsubscribeServices();
        };
    }, []);

    const addShipment = async (newShipment) => {
        console.log('📤 Adding shipment to Firebase:', JSON.stringify(newShipment, null, 2));
        try {
            const docRef = doc(db, 'shipments', newShipment.id);
            await setDoc(docRef, newShipment);
            console.log('✅ Shipment added successfully:', newShipment.id);
            showNotification('Envío creado correctamente');
        } catch (error) {
            console.error('❌ Error adding shipment:', error);
            showNotification('Error al crear envío: ' + error.message, 'error');
            throw error;
        }
    };

    const editShipment = async (updatedShipment) => {
        console.log('📤 Saving shipment to Firebase:', JSON.stringify(updatedShipment, null, 2));
        try {
            const docRef = doc(db, 'shipments', updatedShipment.id);
            await updateDoc(docRef, updatedShipment);
            console.log('✅ Shipment updated successfully:', updatedShipment.id);
            showNotification('Cambios guardados correctamente');
        } catch (error) {
            console.error('❌ Error updating shipment:', error);
            showNotification('Error al guardar: ' + error.message, 'error');
            throw error;
        }
    };

    const deleteShipment = async (shipmentId) => {
        console.log('🗑️ Deleting shipment from Firebase:', shipmentId);
        try {
            const docRef = doc(db, 'shipments', shipmentId);
            await deleteDoc(docRef);
            console.log('✅ Shipment deleted successfully:', shipmentId);
            showNotification('Envío eliminado');
        } catch (error) {
            console.error('❌ Error deleting shipment:', error);
            showNotification('Error al eliminar: ' + error.message, 'error');
            throw error;
        }
    };

    const addService = async (newService) => {
        console.log('📤 Adding service to Firebase:', newService);
        try {
            const updated = [...services, newService.toUpperCase()];
            setServices(updated);
            await setDoc(doc(db, 'config', 'services'), { list: updated });
            console.log('✅ Service added successfully:', newService);
            showNotification('Servicio añadido: ' + newService.toUpperCase());
        } catch (error) {
            console.error('❌ Error adding service:', error);
            showNotification('Error al añadir servicio: ' + error.message, 'error');
            throw error;
        }
    };

    const getDaysOut = (s) => {
        if (!s.shipment_date) return 0;
        const start = new Date(s.shipment_date);
        const end = s.delivery_date ? new Date(s.delivery_date) : new Date();
        return Math.floor((end - start) / (1000 * 60 * 60 * 24));
    };

    const activeShipments = shipments
        .filter(s => !s.delivery_date)
        .sort((a, b) => getDaysOut(b) - getDaysOut(a));

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
            {/* Connection Status Indicator */}
            <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${connectionStatus === 'connected' ? 'bg-green-500 text-white' :
                    connectionStatus === 'error' ? 'bg-red-500 text-white' :
                        'bg-yellow-500 text-white'
                }`}>
                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-white' :
                        connectionStatus === 'error' ? 'bg-white animate-pulse' :
                            'bg-white animate-pulse'
                    }`}></span>
                {connectionStatus === 'connected' ? '🟢 Firebase Conectado' :
                    connectionStatus === 'error' ? '🔴 Sin Conexión' :
                        '🟡 Conectando...'}
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 transition-all ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                        }`}>
                        {notification.type === 'error' ? '❌' : '✅'} {notification.message}
                    </div>
                )}
            </AnimatePresence>

            <Dashboard
                shipments={currentView === 'history' ? receivedShipments : activeShipments}
                allShipments={shipments}
                services={services}
                currentView={currentView}
                onViewChange={setCurrentView}
                onAddShipment={addShipment}
                onEditShipment={editShipment}
                onDeleteShipment={deleteShipment}
                onAddService={addService}
            />
        </div>
    );
}

export default App;
