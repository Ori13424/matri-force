"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  AlertTriangle, Activity, Send, Navigation, XCircle, ShieldCheck, 
  Bell, Database, Truck, Siren, Trash2, CheckSquare, Stethoscope, 
  Clock, Hospital, Lock, Search, Calendar, User, Phone, FileText,
  ChevronRight, LogOut, ClipboardList, MapPin, Droplet, UserCheck, X, Zap, 
  HeartPulse, Thermometer, Pill, Mic, Paperclip, PlusCircle, Brain,
  Users
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

// Firebase
import { db, rtdb, auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { ref, onValue, update, push, remove, set } from "firebase/database";
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, onSnapshot, getDoc, setDoc, addDoc } from "firebase/firestore";

// CSS
import "leaflet/dist/leaflet.css";

// Dynamic Leaflet
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false }) as any;
const CircleMarker = dynamic(() => import("react-leaflet").then(m => m.CircleMarker), { ssr: false }) as any;
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false }) as any;
const Polyline = dynamic(() => import("react-leaflet").then(m => m.Polyline), { ssr: false }) as any;
const FlyToLocation = dynamic(() => import("react-leaflet").then(mod => {
  const { useMap } = mod;
  return function Fly({ center }: { center: [number, number] }) {
    const map = useMap();
    map.flyTo(center, 14, { duration: 1.5 });
    return null;
  };
}), { ssr: false }) as any;

// --- MOCK DATA ---
const INITIAL_HOSPITALS = [
  { id: 'h1', name: 'Dhaka Medical College', lat: 23.7250, lng: 90.3970, beds: 12, icu: 0 },
  { id: 'h2', name: 'Square Hospital', lat: 23.7530, lng: 90.3770, beds: 45, icu: 3 },
  { id: 'h3', name: 'Evercare Hospital', lat: 23.8103, lng: 90.4125, beds: 22, icu: 5 },
];

const INITIAL_DRIVERS = [
  { id: 'd1', name: 'Unit 101 (Ambulance)', lat: 23.7461, lng: 90.3742, type: 'Ambulance', status: 'idle' },
  { id: 'd2', name: 'Unit 204 (Response)', lat: 23.7600, lng: 90.3900, type: 'Responder', status: 'idle' },
];

const INITIAL_DONORS = [
  { id: 'bd1', name: 'Rahim Uddin', group: 'O+', phone: '01711...', location: 'Dhanmondi' },
  { id: 'bd2', name: 'Karim Ahmed', group: 'AB-', phone: '01822...', location: 'Mirpur' },
];

type ViewMode = 'dashboard' | 'patients' | 'appointments' | 'fleet' | 'bloodbank';

export default function DoctorConsole() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('dashboard');
  
  // Data State
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [generalAlerts, setGeneralAlerts] = useState<any[]>([]); 
  const [drivers, setDrivers] = useState<any[]>(INITIAL_DRIVERS);
  const [hospitals, setHospitals] = useState<any[]>(INITIAL_HOSPITALS);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>(INITIAL_DONORS);
  const [bloodRequests, setBloodRequests] = useState<any[]>([]);
  
  // Selection State
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]); 
  const [patientMoods, setPatientMoods] = useState<any[]>([]); // Mental Health
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.7461, 90.3742]);

  // --- AUTH & DATA LISTENER ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // 🛑 STRICT ROLE CHECK
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().role === 'doctor') {
          setUser(u);
        } else {
          await signOut(auth);
          alert("ACCESS DENIED: Medical Staff Only.");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // 1. SOS Alerts
    onValue(ref(rtdb, "sos_alerts"), (snap) => {
      const data = snap.val();
      setSosAlerts(data ? Object.entries(data).map(([k,v]:any) => ({id:k, ...v, type:'SOS'})) : []);
    });

    // 2. Doctor Alerts
    onValue(ref(rtdb, "doctor_alerts"), (snap) => {
      const data = snap.val();
      setGeneralAlerts(data ? Object.entries(data).map(([k,v]:any) => ({id:k, ...v})) : []);
    });

    // 3. Appointments
    const qAppt = query(collection(db, "appointments"), orderBy("timestamp", "desc"));
    const unsubAppt = onSnapshot(qAppt, (snap) => {
      setAppointments(snap.docs.map(d => ({id:d.id, ...d.data()})));
    });

    // 4. Blood Requests
    const qBlood = query(collection(db, "blood_requests"), orderBy("timestamp", "desc"));
    const unsubBlood = onSnapshot(qBlood, (snap) => {
      setBloodRequests(snap.docs.map(d => ({id:d.id, ...d.data()})));
    });

    // 5. Drivers
    onValue(ref(rtdb, "drivers"), (snap) => {
      if (snap.exists()) {
        setDrivers(Object.entries(snap.val()).map(([k,v]:any) => ({id:k, ...v})));
      }
    });

    return () => { unsubAuth(); unsubAppt(); unsubBlood(); };
  }, []);

  // --- FETCH SELECTED PATIENT DETAILS ---
  useEffect(() => {
    if(!selectedPatient) return;

    const uid = selectedPatient.id?.length > 20 ? selectedPatient.id : selectedPatient.patientId;
    if(!uid) return;

    // Chat
    const chatRef = ref(rtdb, `chats/${uid}`);
    onValue(chatRef, (snap) => {
      setChatMessages(snap.val() ? Object.values(snap.val()) : []);
    });

    // Vitals History
    const fetchVitals = async () => {
      const q = query(collection(db, "users", uid, "health_logs"), orderBy("timestamp", "asc"), limit(10));
      const snap = await getDocs(q);
      setPatientHistory(snap.docs.map(d => ({
        date: new Date(d.data().timestamp).toLocaleDateString(),
        bp_sys: parseInt(d.data().bp?.split('/')[0] || 120),
        bp_dia: parseInt(d.data().bp?.split('/')[1] || 80),
        weight: parseInt(d.data().weight || 0)
      })));
    };

    // Mental Health Moods
    const fetchMoods = async () => {
      const q = query(collection(db, "users", uid, "mood_logs"), orderBy("timestamp", "desc"), limit(5));
      const snap = await getDocs(q);
      setPatientMoods(snap.docs.map(d => d.data()));
    }

    fetchVitals();
    fetchMoods();
  }, [selectedPatient]);

  // --- ACTIONS ---
  const handleResolveAlert = async (alertId: string, type?: string) => {
    if(!confirm("Resolve alert?")) return;
    const path = type === 'SOS' ? `sos_alerts/${alertId}` : `doctor_alerts/${alertId}`;
    await remove(ref(rtdb, path));
    setSelectedPatient(null);
  };

  const sendMessage = async () => {
    if(!chatInput.trim() || !selectedPatient) return;
    const uid = selectedPatient.id?.length > 20 ? selectedPatient.id : selectedPatient.patientId;
    await push(ref(rtdb, `chats/${uid}`), {
      role: 'doctor', content: chatInput, timestamp: Date.now()
    });
    setChatInput("");
  };

  const dispatchDriver = async (driverId: string) => {
    if(!selectedPatient) return;
    await update(ref(rtdb, `drivers/${driverId}`), { status: 'busy', assignedTo: selectedPatient.id });
    await update(ref(rtdb, `sos_alerts/${selectedPatient.id}`), { status: 'DISPATCHED', assignedDriver: driverId });
    alert(`Unit ${driverId} dispatched.`);
  };

  const updateAppointment = async (id: string, status: string) => {
    await updateDoc(doc(db, "appointments", id), { status });
  };

  if(loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-mono animate-pulse">Initializing Matri-Ops...</div>;
  if(!user) return <LoginScreen />;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-20">
        <div>
          <div className="p-6 flex items-center gap-3 text-emerald-400 font-black text-xl tracking-tighter">
            <Activity className="text-rose-500 animate-pulse"/>
            <span className="hidden lg:block">MATRI-OPS</span>
          </div>
          <nav className="mt-6 space-y-2 px-2">
            <NavItem icon={Activity} label="Dashboard" active={view==='dashboard'} onClick={()=>setView('dashboard')} />
            <NavItem icon={Users} label="Patient DB" active={view==='patients'} onClick={()=>setView('patients')} />
            <NavItem icon={Calendar} label="Appointments" active={view==='appointments'} onClick={()=>setView('appointments')} />
            <NavItem icon={Droplet} label="Blood Bank" active={view==='bloodbank'} onClick={()=>setView('bloodbank')} />
            <NavItem icon={Truck} label="Fleet & Map" active={view==='fleet'} onClick={()=>setView('fleet')} />
          </nav>
        </div>
        <button onClick={()=>signOut(auth)} className="p-4 flex items-center gap-3 text-slate-500 hover:text-rose-500 transition-colors">
          <LogOut size={20}/> <span className="hidden lg:block font-bold">Logout</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* VIEW: DASHBOARD (Map + Alerts) */}
        {(view === 'dashboard' || view === 'fleet') && (
          <div className="flex-1 flex relative">
            {/* ALERT SIDEBAR */}
            <div className={`bg-slate-900/90 backdrop-blur border-r border-slate-800 flex flex-col z-10 absolute lg:relative h-full transition-all ${view==='fleet'?'w-0 overflow-hidden':'w-80'}`}>
              <div className="p-4 border-b border-slate-800 bg-slate-950">
                <h2 className="font-bold text-slate-100 flex items-center gap-2"><Bell className="text-rose-500"/> Live Ops</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {[...sosAlerts, ...generalAlerts].length === 0 && <p className="text-center text-slate-600 mt-10 text-xs">No Active Alerts</p>}
                
                {/* SOS Alerts */}
{sosAlerts.map(alert => (
  <div key={alert.id} onClick={() => {
  // Use 0,0 if location is missing so the map doesn't crash
  const safeLat = alert.lat || 0;
  const safeLng = alert.lng || 0;
  
  setSelectedPatient({...alert, type: 'SOS'}); 
  setMapCenter([safeLat, safeLng]);
}}
    className={`p-3 rounded-xl border cursor-pointer ${selectedPatient?.id===alert.id ? 'bg-rose-950/40 border-rose-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
    
    <div className="flex justify-between mb-1">
      <span className="bg-rose-600 text-white text-[10px] px-2 rounded animate-pulse">SOS</span>
      <span className="text-[10px] text-slate-400">Now</span>
    </div>
    
    <h3 className="font-bold text-white text-sm">{alert.user_name || "Unknown User"}</h3>
    
    {/* FIXED LINE BELOW: Added fallback (alert.lat || 0) */}
    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
      <MapPin size={10}/> 
      Loc: {(alert.lat || 0).toFixed(4)}, {(alert.lng || 0).toFixed(4)}
    </p>
  </div>
))}

                {/* General Alerts (AI + Blood) */}
                {generalAlerts.map(alert => (
                  <div key={alert.id} onClick={()=>{setSelectedPatient(alert);}} 
                    className={`p-3 rounded-xl border cursor-pointer ${selectedPatient?.id===alert.id ? 'bg-orange-950/40 border-orange-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                    <div className="flex justify-between mb-1">
                      {alert.type === 'BLOOD_REQ' ? (
                        <span className="bg-rose-500 text-white text-[10px] px-2 rounded flex items-center gap-1"><Droplet size={10}/> BLOOD REQ</span>
                      ) : (
                        <span className="bg-orange-600 text-white text-[10px] px-2 rounded flex items-center gap-1"><Zap size={10}/> AI FLAG</span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-sm">{alert.patientName}</h3>
                    <p className="text-xs text-orange-200 mt-1 italic">"{alert.message}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* MAP */}
            <div className="flex-1 relative bg-slate-950">
              <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
                <FlyToLocation center={mapCenter} />
                <TileLayer attribution='&copy; CartoDB' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {hospitals.map(h => (
                  <CircleMarker key={h.id} center={[h.lat, h.lng]} pathOptions={{ color: '#8b5cf6' }} radius={8}>
                    <Popup><b className="text-slate-900">{h.name}</b><br/><span className="text-slate-700">ICU: {h.icu}</span></Popup>
                  </CircleMarker>
                ))}
                {drivers.map(d => (
                  <CircleMarker key={d.id} center={[d.lat, d.lng]} pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.8 }} radius={6}>
                    <Popup><b className="text-slate-900">{d.name}</b><br/><span className="text-slate-700">{d.status}</span></Popup>
                  </CircleMarker>
                ))}
                {sosAlerts
                .filter(p => p.lat && p.lng)
                .map(p => (
                  <CircleMarker key={p.id} center={[p.lat, p.lng]} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }} radius={10}>
                    <Popup><b className="text-red-600">SOS ACTIVE</b><br/>{p.user_name}</Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
              
              <div className="absolute top-4 right-4 bg-slate-900/90 p-3 rounded border border-slate-700 z-[1000] w-60 backdrop-blur">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Nearby Units</h3>
                 {drivers.map(d => (
                   <div key={d.id} className="flex justify-between items-center text-[10px] mb-1">
                     <span className={d.status==='busy'?'text-red-400':'text-emerald-400'}>{d.name}</span>
                     <span className="text-slate-500">{d.status}</span>
                   </div>
                 ))}
              </div>
            </div>

            {/* PATIENT DETAIL PANEL (SUPERCHARGED) */}
            {selectedPatient && (
              <PatientDetailPanel 
                patient={selectedPatient} 
                history={patientHistory} 
                moods={patientMoods}
                chat={chatMessages} 
                onClose={()=>setSelectedPatient(null)} 
                onResolve={handleResolveAlert}
                onDispatch={dispatchDriver}
                drivers={drivers}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendMessage={sendMessage}
              />
            )}
          </div>
        )}

        {/* VIEW: APPOINTMENTS */}
        {view === 'appointments' && (
          <div className="flex-1 overflow-y-auto p-8 bg-slate-950">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Calendar className="text-purple-500"/> Appointment Requests</h2>
            <div className="grid gap-4">
              {appointments.length === 0 && <p className="text-slate-500">No pending appointments.</p>}
              {appointments.map(appt => (
                <div key={appt.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-lg">{appt.patientName}</h3>
                      <span className={`text-[10px] px-2 py-1 rounded ${appt.status==='confirmed'?'bg-emerald-900 text-emerald-400':'bg-yellow-900 text-yellow-400'}`}>{appt.status || 'Pending'}</span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{appt.reason || "General Checkup"} • {new Date(appt.date || Date.now()).toLocaleDateString()}</p>
                  </div>
                  {(!appt.status || appt.status === 'pending') && (
                    <div className="flex gap-2">
                      <button onClick={()=>updateAppointment(appt.id, 'confirmed')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Accept</button>
                      <button onClick={()=>updateAppointment(appt.id, 'rejected')} className="bg-slate-800 hover:bg-red-900/50 text-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-700">Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: PATIENTS LIST (FILTERABLE) */}
        {view === 'patients' && <PatientsDatabase setSelectedPatient={setSelectedPatient} />}

        {/* VIEW: BLOOD BANK */}
        {view === 'bloodbank' && (
          <div className="flex-1 overflow-y-auto p-8 bg-slate-950">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Droplet className="text-rose-500"/> Blood Bank & Donors</h2>
               <button className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+ Add Donor</button>
            </div>
            
            {/* Active Requests Section */}
            {bloodRequests.length > 0 && (
              <div className="mb-8">
                <h3 className="text-slate-400 text-sm font-bold mb-3 uppercase tracking-wider">Active Requests</h3>
                <div className="grid gap-3">
                  {bloodRequests.map(req => (
                    <div key={req.id} className="bg-rose-900/20 border border-rose-500/50 p-4 rounded-xl flex justify-between items-center">
                       <div>
                         <div className="flex items-center gap-2">
                           <span className="text-rose-500 font-black text-xl">{req.bloodGroup}</span>
                           <span className="text-white font-bold">Needed Urgently</span>
                         </div>
                         <p className="text-xs text-slate-400">{new Date(req.timestamp).toLocaleString()}</p>
                       </div>
                       <button className="bg-rose-600 text-white px-4 py-2 rounded font-bold text-xs">DISPATCH DONOR</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-slate-400 text-sm font-bold mb-3 uppercase tracking-wider">Available Donors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {donors.map(d => (
                 <div key={d.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex justify-between items-center">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-black text-rose-500">{d.group}</span>
                          <span className="text-white font-bold">{d.name}</span>
                       </div>
                       <p className="text-xs text-slate-500">{d.location}</p>
                    </div>
                    <button className="bg-slate-800 p-2 rounded-lg text-emerald-400 hover:bg-emerald-900/20"><Phone size={18}/></button>
                 </div>
               ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function NavItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
      <Icon size={18} strokeWidth={active?2.5:2} />
      <span className={`text-sm font-medium hidden lg:block ${active?'font-bold':''}`}>{label}</span>
    </button>
  );
}

// --- LOGIN & SIGNUP SCREEN ---
function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async (e:any) => {
    e.preventDefault();
    setError("");
    try {
      if(isLogin) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        // REGISTER DOCTOR
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(res.user, { displayName: name });
        // FORCE ROLE: DOCTOR
        await setDoc(doc(db, "users", res.user.uid), {
          name, email, role: 'doctor', createdAt: new Date().toISOString()
        });
      }
    } catch (e:any) { 
      setError(e.message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex justify-center mb-6"><Activity size={48} className="text-emerald-500"/></div>
        <h1 className="text-2xl font-black text-white text-center mb-2">MATRI-OPS</h1>
        <p className="text-slate-500 text-center text-sm mb-8">{isLogin ? "Medical Personnel Access Only" : "Apply for Medical Staff Access"}</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white focus:border-emerald-500 transition-colors" placeholder="Full Name & Title" value={name} onChange={e=>setName(e.target.value)} required />
          )}
          <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white focus:border-emerald-500 transition-colors" placeholder="Medical Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white focus:border-emerald-500 transition-colors" type="password" placeholder="Passcode" value={pass} onChange={e=>setPass(e.target.value)} required />
          
          {error && <p className="text-rose-500 text-xs text-center">{error}</p>}
          
          <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20">
            {isLogin ? "AUTHENTICATE" : "REGISTER ACCESS"}
          </button>
        </form>

        <button onClick={()=>setIsLogin(!isLogin)} className="w-full text-center text-xs text-slate-500 mt-6 hover:text-white">
          {isLogin ? "New Staff? Apply for Access" : "Have Access? Login Here"}
        </button>
      </div>
    </div>
  );
}

// --- PATIENTS DB (UPGRADED WITH FILTER) ---
function PatientsDatabase({ setSelectedPatient }: any) {
  const [patients, setPatients] = useState<any[]>([]);
  const [term, setTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterStage, setFilterStage] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "patient"), limit(50));
    getDocs(q).then(snap => setPatients(snap.docs.map(d=>({id: d.id, ...d.data()}))));
  }, []);

  const filtered = patients.filter(p => {
    const matchTerm = p.name?.toLowerCase().includes(term.toLowerCase()) || p.email?.includes(term);
    const matchStage = filterStage === 'all' || p.stage === filterStage;
    // Simple mock risk logic: if gestation > 36 weeks = High Risk
    const isHighRisk = (p.gestationWeek > 36); 
    const matchRisk = filterRisk === 'all' || (filterRisk === 'high' && isHighRisk) || (filterRisk === 'low' && !isHighRisk);
    return matchTerm && matchStage && matchRisk;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="text-blue-500"/> Patient Database</h2>
        <div className="flex flex-wrap gap-2">
          <select className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 outline-none" value={filterStage} onChange={e=>setFilterStage(e.target.value)}>
             <option value="all">All Stages</option>
             <option value="pregnancy">Pregnancy</option>
             <option value="postpartum">Postpartum</option>
          </select>
          <select className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 outline-none" value={filterRisk} onChange={e=>setFilterRisk(e.target.value)}>
             <option value="all">All Risks</option>
             <option value="high">High Risk</option>
             <option value="low">Low Risk</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14}/>
            <input className="bg-slate-900 border border-slate-800 rounded-full pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 w-48" placeholder="Search..." value={term} onChange={e=>setTerm(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p, i) => (
          <div key={i} onClick={()=>setSelectedPatient(p)} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-600 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-400 group-hover:text-white group-hover:bg-blue-600 transition-all">{p.name?.[0]}</div>
              <div><h3 className="font-bold text-white">{p.name}</h3><p className="text-xs text-slate-500">Week {p.gestationWeek || '?'}</p></div>
            </div>
            <div className="flex gap-2 mb-2 flex-wrap">
               {p.gestationWeek > 36 && <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900">High BP</span>}
               <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded">{p.stage || 'Pregnancy'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- PATIENT PANEL (WITH PRESCRIPTIONS & TABS) ---
function PatientDetailPanel({ patient, history, moods, chat, onClose, onResolve, onDispatch, drivers, chatInput, setChatInput, sendMessage }: any) {
  const [tab, setTab] = useState<'overview'|'vitals'|'chat'|'rx'>('overview');
  
  // Calculate Risk
  const lastBP = history[history.length-1]?.bp_sys || 120;
  const riskLevel = lastBP > 140 ? 'HIGH RISK' : 'STABLE';

  return (
    <div className="w-[450px] bg-slate-900 border-l border-slate-800 shadow-2xl z-[1000] flex flex-col h-full absolute right-0 top-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg text-white">{patient.user_name || patient.patientName || patient.name}</h2>
          <div className="flex items-center gap-2 mt-1">
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${riskLevel==='HIGH RISK'?'bg-red-600 text-white':'bg-emerald-600 text-white'}`}>{riskLevel}</span>
             <span className="text-xs text-slate-400">ID: {patient.id?.substring(0,6)}</span>
          </div>
        </div>
        <button onClick={onClose}><XCircle className="text-slate-500 hover:text-white"/></button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900">
         {['overview','vitals','chat','rx'].map(t => (
           <button key={t} onClick={()=>setTab(t as any)} className={`flex-1 py-3 text-xs font-bold uppercase ${tab===t ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>{t}</button>
         ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* TAB: OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-2">
                {patient.type && <button onClick={() => onResolve(patient.id, patient.type)} className="bg-emerald-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"><CheckSquare size={14}/> Resolve Alert</button>}
                <a href={`tel:${patient.phone}`} className="bg-slate-800 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"><Phone size={14}/> Call</a>
             </div>
             
             <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Patient Details</h3>
                <div className="space-y-2 text-sm text-slate-300">
                   <div className="flex justify-between"><span>Stage</span><span className="text-white">{patient.stage || 'Pregnancy'}</span></div>
                   <div className="flex justify-between"><span>Weeks</span><span className="text-white">{patient.gestationWeek || 12}</span></div>
                   <div className="flex justify-between"><span>Blood Group</span><span className="text-rose-400 font-bold">O+</span></div>
                </div>
             </div>

             <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Mental Health (Moods)</h3>
                <div className="flex gap-2">
                   {moods?.map((m:any, i:number) => (
                      <div key={i} className="text-2xl p-2 bg-slate-900 rounded-lg border border-slate-800" title={new Date(m.timestamp).toLocaleDateString()}>
                         {m.mood === 'happy' ? '😊' : m.mood === 'sad' ? '😔' : '😐'}
                      </div>
                   ))}
                   {(!moods || moods.length === 0) && <p className="text-xs text-slate-600">No mood logs yet.</p>}
                </div>
             </div>
          </div>
        )}

        {/* TAB: VITALS */}
        {tab === 'vitals' && (
           <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-64">
              <h3 className="text-xs font-bold text-slate-400 mb-2">BP & Weight Trend</h3>
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={history}>
                   <XAxis dataKey="date" hide />
                   <YAxis hide domain={['auto', 'auto']} />
                   <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: 'none'}} />
                   <Line type="monotone" dataKey="bp_sys" stroke="#f43f5e" strokeWidth={2} dot={false} />
                   <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={false} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        )}

        {/* TAB: CHAT */}
        {tab === 'chat' && (
           <div className="flex-1 flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden h-[400px]">
             <div className="flex-1 overflow-y-auto p-3 space-y-2">
               {chat.length===0 && <p className="text-center text-[10px] text-slate-600 mt-10">Start conversation...</p>}
               {chat.map((m:any,i:number) => (
                 <div key={i} className={`p-2 rounded text-xs max-w-[85%] ${m.role==='doctor'?'ml-auto bg-emerald-900/50 text-emerald-100':'bg-slate-800 text-slate-300'}`}>{m.content}</div>
               ))}
             </div>
             <div className="p-2 bg-slate-900 flex gap-2 items-center">
               <button className="text-slate-500 hover:text-white"><Paperclip size={16}/></button>
               <input className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:border-emerald-500 outline-none" 
                 placeholder="Type message..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} />
               <button onClick={sendMessage} className="p-2 bg-emerald-600 rounded text-white"><Send size={12}/></button>
             </div>
           </div>
        )}

        {/* TAB: RX (PRESCRIPTION) */}
        {tab === 'rx' && <PrescriptionWriter patientId={patient.id || patient.patientId} />}

        {/* Dispatcher (Only if SOS) */}
        {patient.type === 'SOS' && (
          <div className="mt-4">
            <h3 className="text-xs font-bold text-slate-400 mb-2">NEARBY UNITS</h3>
            <div className="space-y-2">
              {drivers.map((d:any) => (
                <div key={d.id} className="flex justify-between items-center p-2 bg-slate-950 border border-slate-800 rounded hover:border-emerald-500 cursor-pointer" onClick={() => onDispatch(d.id)}>
                   <span className="text-sm font-bold text-white">{d.name}</span>
                   <span className="text-[10px] text-emerald-500 bg-emerald-900/20 px-2 rounded">DISPATCH</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- PRESCRIPTION WRITER COMPONENT ---
function PrescriptionWriter({ patientId }: { patientId: string }) {
  const [med, setMed] = useState("");
  const [dosage, setDosage] = useState("");
  
  const handlePrescribe = async () => {
    if(!med || !dosage) return;
    await addDoc(collection(db, "users", patientId, "prescriptions"), {
      medicine: med, dosage, doctor: "Dr. On Call", timestamp: Date.now()
    });
    setMed(""); setDosage("");
    alert("Prescription Sent!");
  };

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
       <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2"><Pill size={14}/> Digital Prescription</h3>
       <input className="w-full bg-slate-900 border border-slate-800 p-2 rounded mb-2 text-xs text-white" placeholder="Medicine Name" value={med} onChange={e=>setMed(e.target.value)} />
       <input className="w-full bg-slate-900 border border-slate-800 p-2 rounded mb-3 text-xs text-white" placeholder="Dosage (e.g., 1-0-1 after food)" value={dosage} onChange={e=>setDosage(e.target.value)} />
       <button onClick={handlePrescribe} className="w-full bg-blue-600 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2"><Send size={12}/> Send to Patient</button>
    </div>
  );
}