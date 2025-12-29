"use client";



import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  AlertTriangle, Activity, Send, Navigation, XCircle, ShieldCheck, 
  Bell, Database, Truck, Siren, Trash2, CheckSquare, Stethoscope, 
  Clock, Hospital, CloudRain, Lock, Maximize, Printer, Zap, Building2
} from "lucide-react";
import { db, rtdb } from "@/lib/firebase";
import { ref, onValue, update, push, remove } from "firebase/database";
import { collection, query, where, getDocs } from "firebase/firestore";

// --- CSS & Leaflet Setup ---
import "leaflet/dist/leaflet.css";

// Dynamic Imports (Map Components)
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false }) as any;
const CircleMarker = dynamic(() => import("react-leaflet").then(m => m.CircleMarker), { ssr: false }) as any;
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false }) as any;
const Polyline = dynamic(() => import("react-leaflet").then(m => m.Polyline), { ssr: false }) as any;

const FlyToLocation = dynamic(() => import("react-leaflet").then(mod => {
  const { useMap } = mod;
  return function Fly({ center }: { center: [number, number] }) {
    const map = useMap();
    map.flyTo(center, 15, { duration: 1.5 });
    return null;
  };
}), { ssr: false }) as any;

// --- MOCK HOSPITAL DATA ---
const INITIAL_HOSPITALS = [
  { id: 'h1', name: 'Dhaka Medical College', lat: 23.7250, lng: 90.3970, beds: 12, icu: 0 },
  { id: 'h2', name: 'Square Hospital', lat: 23.7530, lng: 90.3770, beds: 45, icu: 3 },
  { id: 'h3', name: 'Evercare Hospital', lat: 23.8103, lng: 90.4125, beds: 22, icu: 5 },
];

export default function DoctorConsole() {
  // --- STATE ---
  const [patients, setPatients] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'triage' | 'missions' | 'drivers' | 'admin'>('triage');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  
  // Tools & Settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.7461, 90.3742]);
  
  // --- FIX: Initialize time as null to prevent Hydration Mismatch ---
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  const [privacyMode, setPrivacyMode] = useState(false);
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite'>('dark');

  // --- LISTENERS ---
  useEffect(() => {
    // Set time only on client side
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // 1. Patients Listener
    const sosRef = ref(rtdb, "sos_alerts");
    const unsubSOS = onValue(sosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]: any) => ({ id: key, ...val }));
        if(list.length > patients.length && patients.length > 0) addToast("New SOS", "Critical signal received!", "alert");
        setPatients(list);
      } else setPatients([]);
    });

    // 2. Drivers Listener
    const driversRef = ref(rtdb, "drivers");
    const unsubDrivers = onValue(driversRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]: any) => ({ 
          id: key, ...val, 
          fuel: Math.floor(Math.random() * 40) + 60, 
          eta: Math.floor(Math.random() * 15) + 5 
        }));
        setDrivers(list);
      } else setDrivers([]);
    });

    // 3. Hospital Simulation
    const hospitalInterval = setInterval(() => {
      setHospitals(prev => prev.map(h => ({
        ...h,
        beds: Math.max(0, h.beds + (Math.random() > 0.5 ? 1 : -1)),
        icu: Math.max(0, h.icu + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))
      })));
    }, 5000);

    return () => { clearInterval(timer); clearInterval(hospitalInterval); unsubSOS(); unsubDrivers(); };
  }, []);

  // Chat Listener
  useEffect(() => {
    if (!selectedPatient) return;
    const chatRef = ref(rtdb, `chats/${selectedPatient.id}`);
    const unsubChat = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setChatMessages(Object.values(data));
      else setChatMessages([]);
    });
    return () => unsubChat();
  }, [selectedPatient]);

  // --- ACTIONS ---
  const addToast = (title: string, msg: string, type: 'info' | 'alert' | 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const handleManualClear = async (patientId: string) => {
    if(confirm("Clear this alert manually?")) {
      await remove(ref(rtdb, `sos_alerts/${patientId}`));
      addToast("System", "Alert cleared from board.", "info");
      setSelectedPatient(null);
    }
  };

  const handleDispatch = async (driverId: string) => {
    if (!selectedPatient) return;
    try {
      await update(ref(rtdb, `drivers/${driverId}`), { status: "busy", assignedTo: selectedPatient.id });
      await update(ref(rtdb, `sos_alerts/${selectedPatient.id}`), { status: "DISPATCHED", assignedDriver: driverId });
      addToast("Dispatch", `Unit ${driverId} assigned.`, "success");
      setShowDispatchModal(false);
      setSelectedPatient(null);
      setActiveTab("missions");
    } catch (e) { addToast("Error", "Dispatch failed.", "alert"); }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedPatient) return;
    await push(ref(rtdb, `chats/${selectedPatient.id}`), {
      role: "doctor",
      content: chatInput,
      timestamp: Date.now()
    });
    setChatInput("");
  };

  // --- RENDER ---
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* --- POP-UP NOTIFICATIONS --- */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none flex flex-col items-end">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto w-80 p-4 rounded-lg shadow-2xl border-l-4 backdrop-blur-xl animate-in slide-in-from-right-10 flex gap-3 ${
            n.type === 'alert' ? 'bg-rose-950/90 border-rose-500 shadow-rose-900/20' : 
            n.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 shadow-emerald-900/20' : 
            'bg-slate-800/90 border-blue-500 shadow-blue-900/20'
          }`}>
            <div className={`mt-1 ${n.type === 'alert' ? 'text-rose-400' : n.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}`}>
              {n.type === 'alert' ? <AlertTriangle size={18} /> : n.type === 'success' ? <CheckSquare size={18} /> : <Bell size={18} />}
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wide text-white">{n.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5">{n.msg}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- SIDEBAR --- */}
      <aside className="w-[420px] bg-slate-900 border-r border-slate-800 flex flex-col z-20 relative shadow-2xl">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-lg">
             <Activity className="animate-pulse text-rose-500" /> MATRI-OPS
          </div>
          {/* --- FIX: Safe Clock Rendering --- */}
          <div className="text-[10px] text-slate-500 font-mono">
             {currentTime ? currentTime.toLocaleTimeString() : "Syncing..."}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-px bg-slate-800 border-b border-slate-800">
          {[
            { label: 'SOS', val: patients.length, color: 'text-rose-400' },
            { label: 'Units', val: drivers.length, color: 'text-blue-400' },
            { label: 'Hospitals', val: hospitals.length, color: 'text-purple-400' },
            { label: 'System', val: 'OK', color: 'text-emerald-400' }
          ].map((m, i) => (
             <div key={i} className="bg-slate-900 p-2 text-center">
                <div className={`text-sm font-bold ${m.color}`}>{m.val}</div>
                <div className="text-[8px] text-slate-500 uppercase">{m.label}</div>
             </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-900 gap-1 border-b border-slate-800">
          {[
            { id: 'triage', label: 'Triage', icon: AlertTriangle },
            { id: 'missions', label: 'Missions', icon: ShieldCheck },
            { id: 'drivers', label: 'Fleet', icon: Navigation },
            { id: 'admin', label: 'Tools', icon: Database }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded flex flex-col items-center gap-1 ${activeTab === t.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <t.icon size={14} className={activeTab === t.id ? 'text-emerald-400' : ''}/> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-950/50">
          
          {/* TRIAGE */}
          {activeTab === 'triage' && patients.filter(p => !p.status || p.status === 'RED').map(p => (
            <div key={p.id} onClick={() => { setSelectedPatient(p); setMapCenter([p.lat, p.lng]); }} className={`p-3 rounded border cursor-pointer relative overflow-hidden ${selectedPatient?.id === p.id ? 'bg-rose-950/30 border-rose-500' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                   <span className="font-bold text-rose-400 text-xs">SOS ALERT</span>
                </div>
                <span className="text-[10px] text-slate-500">{new Date(p.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm font-mono text-slate-300 mb-2">{privacyMode ? '******' : p.id}</p>
              <div className="flex gap-1">
                 <button onClick={(e) => { e.stopPropagation(); setShowDispatchModal(true); setSelectedPatient(p); }} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] py-1.5 rounded font-bold">DISPATCH</button>
                 <button onClick={(e) => { e.stopPropagation(); setChatOpen(true); setSelectedPatient(p); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] py-1.5 rounded border border-slate-700">CHAT</button>
                 <button onClick={(e) => { e.stopPropagation(); handleManualClear(p.id); }} className="px-3 bg-slate-800 hover:bg-rose-900/50 text-rose-400 border border-slate-700 rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}

          {/* MISSIONS */}
          {activeTab === 'missions' && patients.filter(p => p.status === 'DISPATCHED').map(p => (
            <div key={p.id} className="p-3 bg-slate-900 border border-emerald-900 rounded opacity-80">
              <span className="text-xs font-bold text-emerald-500 block">MISSION ACTIVE</span>
              <span className="text-[10px] text-slate-500 block">Unit: {p.assignedDriver}</span>
              <button onClick={() => handleManualClear(p.id)} className="w-full mt-2 py-1 bg-emerald-900/20 text-emerald-500 text-[10px] rounded">COMPLETE</button>
            </div>
          ))}

          {/* DRIVERS */}
          {activeTab === 'drivers' && drivers.map(d => (
            <div key={d.id} className="p-3 bg-slate-900 rounded border border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <Truck size={14} className={d.type === 'Ambulance' ? 'text-rose-500' : 'text-yellow-500'} />
                <span className="text-white font-bold">{d.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded ${d.status==='busy'?'bg-red-900 text-red-400':'bg-emerald-900 text-emerald-400'}`}>{d.status}</span>
            </div>
          ))}

          {/* ADMIN */}
          {activeTab === 'admin' && (
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setPrivacyMode(!privacyMode)} className="p-3 bg-slate-900 border border-slate-800 rounded text-xs text-left">{privacyMode ? 'Show Names' : 'Hide Names'}</button>
                <button onClick={() => window.print()} className="p-3 bg-slate-900 border border-slate-800 rounded text-xs text-left">Print Report</button>
             </div>
          )}
        </div>
      </aside>

      {/* --- MAP --- */}
      <main className="flex-1 relative z-10 bg-slate-950">
        <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
           <FlyToLocation center={mapCenter} />
           <TileLayer attribution='&copy; CartoDB' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
           
           {/* 1. Hospitals (Blue/Purple) */}
           {hospitals.map(h => (
             <CircleMarker key={h.id} center={[h.lat, h.lng]} pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.6 }} radius={12}>
               <Popup>
                 <div className="p-1 min-w-[150px]">
                   <h3 className="font-bold text-purple-700 flex items-center gap-2"><Building2 size={14}/> {h.name}</h3>
                   <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-slate-100 p-1 rounded text-center">
                        <div className="text-lg font-bold text-slate-800">{h.beds}</div>
                        <div className="text-[10px] text-slate-500">Gen Beds</div>
                      </div>
                      <div className="bg-rose-50 p-1 rounded text-center border border-rose-100">
                        <div className="text-lg font-bold text-rose-600">{h.icu}</div>
                        <div className="text-[10px] text-rose-500">ICU</div>
                      </div>
                   </div>
                 </div>
               </Popup>
             </CircleMarker>
           ))}

           {/* 2. Patients (Red/Green) */}
           {patients.map(p => (
             <CircleMarker key={p.id} center={[p.lat, p.lng]} pathOptions={{ color: p.status==='DISPATCHED'?'#10b981':'#ef4444', fillColor: p.status==='DISPATCHED'?'#10b981':'#ef4444', fillOpacity: 0.8 }} radius={8}>
               <Popup><div className="text-black p-1"><strong>{p.id}</strong><button onClick={()=>{setSelectedPatient(p);setChatOpen(true)}} className="mt-1 w-full bg-slate-800 text-white text-xs px-2 py-1 rounded">Chat</button></div></Popup>
             </CircleMarker>
           ))}

           {/* 3. Drivers (Yellow) */}
           {drivers.map(d => (
             <CircleMarker key={d.id} center={[d.lat, d.lng]} pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24' }} radius={6}>
                <Popup><div className="text-black text-xs"><strong>{d.name}</strong><br/>{d.type}</div></Popup>
             </CircleMarker>
           ))}

           {/* Lines */}
           {selectedPatient && !selectedPatient.assignedDriver && drivers.slice(0,3).map(d => (
              <Polyline key={`line-${d.id}`} positions={[[selectedPatient.lat, selectedPatient.lng], [d.lat, d.lng]]} pathOptions={{ color: '#94a3b8', dashArray: '5, 10', weight: 1 }} />
           ))}
        </MapContainer>
        
        {/* Hospital Widget */}
        <div className="absolute top-4 right-4 bg-slate-900/90 p-3 rounded border border-slate-700 z-[1000] w-60 backdrop-blur">
           <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Hospital size={14}/> Network Status (Live)</h3>
           {hospitals.map(h => (
             <div key={h.id} className="flex justify-between items-center text-[10px] mb-1">
                <span className="text-slate-300 truncate w-32">{h.name}</span>
                <span className={`font-mono font-bold ${h.icu < 2 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>ICU: {h.icu}</span>
             </div>
           ))}
        </div>
      </main>

      {/* --- DISPATCH MODAL --- */}
      {showDispatchModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/80 z-[3000] flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-white flex items-center gap-2"><Navigation className="text-emerald-500"/> Dispatch Command</h2>
                 <button onClick={() => setShowDispatchModal(false)}><XCircle className="text-slate-500 hover:text-white"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                 <div className="mb-4 p-3 bg-rose-950/30 border border-rose-900/50 rounded flex justify-between items-center">
                    <div>
                       <p className="text-xs text-rose-400 font-bold uppercase">Target</p>
                       <p className="text-sm font-mono text-white">{selectedPatient.id}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-slate-400">Loc</p>
                       <p className="text-sm font-mono text-white">{selectedPatient.lat.toFixed(4)}, {selectedPatient.lng.toFixed(4)}</p>
                    </div>
                 </div>
                 <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Available Assets</h3>
                 <div className="space-y-2">
                    {drivers.filter(d => d.status !== 'busy').map(d => (
                       <div key={d.id} className="p-3 bg-slate-800 rounded border border-slate-700 flex justify-between items-center hover:border-emerald-500 transition cursor-pointer" onClick={() => handleDispatch(d.id)}>
                          <div className="flex items-center gap-3">
                             <div className={`p-3 rounded-full ${d.type === 'Ambulance' ? 'bg-rose-500 text-white' : 'bg-yellow-500 text-black'}`}>
                                {d.type === 'Ambulance' ? <Siren size={20}/> : <Truck size={20}/>}
                             </div>
                             <div>
                                <p className="font-bold text-sm text-white">{d.name}</p>
                                <p className="text-xs text-slate-400">{d.type} • Fuel {d.fuel}%</p>
                             </div>
                          </div>
                          <button className="text-[10px] bg-emerald-600 px-3 py-1.5 rounded text-white font-bold">DEPLOY</button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- CHAT WINDOW --- */}
      {chatOpen && selectedPatient && (
        <div className="fixed bottom-0 right-20 w-80 h-[450px] bg-slate-900 border border-slate-700 rounded-t-xl z-[2000] shadow-2xl flex flex-col">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center rounded-t-xl">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                <span className="font-bold text-sm text-white">{selectedPatient.id}</span>
             </div>
             <button onClick={() => setChatOpen(false)}><XCircle size={16} className="text-slate-500 hover:text-white"/></button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto bg-slate-900/50">
             {chatMessages.length === 0 && <p className="text-center text-slate-600 mt-10 text-xs">Start messaging...</p>}
             {chatMessages.map((m, i) => (
               <div key={i} className={`mb-2 p-2 rounded text-xs max-w-[80%] ${m.role==='doctor' ? 'ml-auto bg-emerald-900/50 text-emerald-100 border border-emerald-800' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                 {m.content}
               </div>
             ))}
          </div>
          <div className="p-2 border-t border-slate-800 flex gap-2 bg-slate-950">
             <input className="flex-1 bg-slate-800 border-none rounded px-2 text-xs text-white" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendMessage()} placeholder="Type advice..." />
             <button onClick={handleSendMessage} className="p-2 bg-emerald-600 rounded text-white hover:bg-emerald-500"><Send size={14}/></button>
          </div>
        </div>
      )}

    </div>
  );
}