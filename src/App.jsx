import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
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
    const [currentView, setCurrentView] = useState('main');

    // Initialize Firestore with data if empty
    const initializeFirestore = async () => {
        const shipmentsRef = collection(db, 'shipments');
        const snapshot = await getDocs(shipmentsRef);

        if (snapshot.empty) {
            console.log('📦 Initializing Firestore with initial data...');
            const batch = writeBatch(db);

            const transformedData = initialData.map(item => {
                let sn = item.sn || '';
                if (!sn) {
                    const snMatch = item.model.match(/(?:sn|SN|S\/N|S\.N\.|SN:)\s*([A-Z0-9]+)/i);
                    if (snMatch) sn = snMatch[1];
                }

                return {
                    ...item,
                    sn: sn,
                    ref: item.ref || '',
                    provider_contact: item.provider_contact || '',
                    priority: item.priority || 'NORMAL',
                    status: item.delivery_date ? 'RECIBIDO' : (item.status || 'ENVIADO A SERVICIO TECNICO')
                };
            });

            transformedData.forEach(shipment => {
                const docRef = doc(shipmentsRef, shipment.id);
                batch.set(docRef, shipment);
            });

            await batch.commit();
            console.log('✅ Firestore initialized with', transformedData.length, 'shipments');
        }

        // Initialize services
        const servicesDoc = doc(db, 'config', 'services');
        const servicesSnap = await getDocs(collection(db, 'config'));
        if (servicesSnap.empty) {
            await setDoc(servicesDoc, { list: DEFAULT_SERVICES });
        }
    };

    useEffect(() => {
        // Subscribe to real-time updates
        const unsubscribeShipments = onSnapshot(
            collection(db, 'shipments'),
            (snapshot) => {
                const shipmentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setShipments(shipmentsData);
                setLoading(false);
                console.log('🔄 Shipments updated:', shipmentsData.length);
            },
            (error) => {
                console.error('❌ Error fetching shipments:', error);
                setLoading(false);
            }
        );

        const unsubscribeServices = onSnapshot(
            doc(db, 'config', 'services'),
            (docSnap) => {
                if (docSnap.exists()) {
                    setServices(docSnap.data().list || DEFAULT_SERVICES);
                }
            }
        );

        // Initialize data if needed
        initializeFirestore();

        return () => {
            unsubscribeShipments();
            unsubscribeServices();
        };
    }, []);

    const addShipment = async (newShipment) => {
        try {
            const docRef = doc(db, 'shipments', newShipment.id);
            await setDoc(docRef, newShipment);
            console.log('✅ Shipment added:', newShipment.id);
        } catch (error) {
            console.error('❌ Error adding shipment:', error);
        }
    };

    const editShipment = async (updatedShipment) => {
        try {
            const docRef = doc(db, 'shipments', updatedShipment.id);
            await updateDoc(docRef, updatedShipment);
            console.log('✅ Shipment updated:', updatedShipment.id);
        } catch (error) {
            console.error('❌ Error updating shipment:', error);
        }
    };

    const deleteShipment = async (shipmentId) => {
        try {
            const docRef = doc(db, 'shipments', shipmentId);
            await deleteDoc(docRef);
            console.log('✅ Shipment deleted:', shipmentId);
        } catch (error) {
            console.error('❌ Error deleting shipment:', error);
        }
    };

    const addService = async (newService) => {
        try {
            const updated = [...services, newService.toUpperCase()];
            setServices(updated);
            await setDoc(doc(db, 'config', 'services'), { list: updated });
            console.log('✅ Service added:', newService);
        } catch (error) {
            console.error('❌ Error adding service:', error);
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
