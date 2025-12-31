"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Navigation, Bell, MapPin, CheckCircle, Power, 
  User, DollarSign, History, Phone, Car, ArrowRight, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Firebase
import { db, rtdb, auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { ref, onValue, update, set } from "firebase/database";
import { doc, getDoc, collection, addDoc, setDoc } from "firebase/firestore";

// CSS for Map
import "leaflet/dist/leaflet.css";

// Dynamic Map Components
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false }) as any;
const CircleMarker = dynamic(() => import("react-leaflet").then(m => m.CircleMarker), { ssr: false }) as any;
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false }) as any;

// Helper to fly map to location
const FlyToLocation = dynamic(() => import("react-leaflet").then(mod => {
  const { useMap } = mod;
  return function Fly({ center }: { center: [number, number] }) {
    const map = useMap();
    map.flyTo(center, 15, { duration: 1.5 });
    return null;
  };
}), { ssr: false }) as any;

export default function DriverApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Driver State
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<[number, number]>([23.7461, 90.3742]); // Default Dhaka
  const [request, setRequest] = useState<any>(null);
  const [missionStage, setMissionStage] = useState<'idle' | 'ringing' | 'accepted' | 'arrived' | 'in_progress'>('idle');
  
  // Stats
  const [earnings, setEarnings] = useState(0);
  const [rideCount, setRideCount] = useState(0);

  // --- 1. AUTH & ROLE CHECK ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Verify Role is 'driver'
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        
        // Allow access if role is driver OR if it's a new account (doc might be creating)
        if (docSnap.exists() && docSnap.data().role === 'driver') {
          setUser(u);
          // Check previous online status
          const statusRef = ref(rtdb, `drivers/${u.uid}/status`);
          onValue(statusRef, (s) => setIsOnline(s.val() !== 'offline'), { onlyOnce: true });
        } else if (!docSnap.exists()) {
           // Fallback for brand new signups to prevent lockout before DB write completes
           setUser(u);
        } else {
          await signOut(auth);
          alert("Access Denied: Registered Drivers Only.");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- 2. GPS TRACKING & DOCTOR DISPATCH LISTENER ---
  useEffect(() => {
    if (!user) return;

    // A. Watch Real GPS Position
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation([latitude, longitude]);
        
        // SYNC WITH DOCTOR MAP: Update Firebase
        if (isOnline) {
          update(ref(rtdb, `drivers/${user.uid}`), {
            lat: latitude,
            lng: longitude,
            name: user.displayName || "Driver", // Ensure name shows on Doctor map
            type: "Ambulance", // Can be dynamic
            status: missionStage === 'idle' ? 'idle' : 'busy',
            last_updated: Date.now()
          });
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    // B. Listen for Assignments from Doctor
    const driverRef = ref(rtdb, `drivers/${user.uid}`);
    const unsubDriver = onValue(driverRef, (snap) => {
      const data = snap.val();
      if (data) {
        // If Doctor assigns a patient (data.assignedTo exists)
        if (data.assignedTo && missionStage === 'idle') {
           fetchPatientDetails(data.assignedTo);
        }
        // If Doctor cancels assignment
        if (!data.assignedTo && missionStage !== 'idle') {
           setMissionStage('idle');
           setRequest(null);
           alert("Mission Cancelled by Control Center");
        }
      }
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      unsubDriver();
    };
  }, [user, isOnline, missionStage]);

  // --- 3. FETCH PATIENT INFO (From SOS Alert) ---
  const fetchPatientDetails = async (patientId: string) => {
    // Read the SOS Alert created by the Patient App
    const sosRef = ref(rtdb, `sos_alerts/${patientId}`);
    
    onValue(sosRef, async (snap) => {
      const sosData = snap.val();
      if (sosData) {
        // Optional: Get more details from Firestore if needed
        const pDoc = await getDoc(doc(db, "users", patientId));
        
        setRequest({
          id: patientId,
          name: sosData.user_name || pDoc.data()?.name || "Emergency Patient",
          phone: sosData.phone || "N/A",
          lat: sosData.lat,
          lng: sosData.lng,
          distance: "2.5 km" // You can calculate real distance here
        });
        setMissionStage('ringing'); // Trigger the UI Alert
      }
    }, { onlyOnce: true });
  };

  // --- ACTIONS ---
  const toggleStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    // Update status for Doctor to see (Green/Gray marker)
    await update(ref(rtdb, `drivers/${user.uid}`), {
      status: newStatus ? 'idle' : 'offline'
    });
  };

  const handleAccept = async () => {
    setMissionStage('accepted');
    // Tell Doctor we accepted
    await update(ref(rtdb, `sos_alerts/${request.id}`), { status: 'DRIVER_ACCEPTED' });
    await update(ref(rtdb, `drivers/${user.uid}`), { status: 'busy' });
  };

  const handleArrived = async () => {
    setMissionStage('arrived');
    await update(ref(rtdb, `sos_alerts/${request.id}`), { status: 'DRIVER_ARRIVED' });
  };
  
  const handleStartTrip = () => {
    setMissionStage('in_progress');
    // Launch Google Maps Navigation
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${request.lat},${request.lng}`, '_blank');
  };

  const handleComplete = async () => {
    // Clear assignment
    await update(ref(rtdb, `drivers/${user.uid}`), { assignedTo: null, status: 'idle' });
    await update(ref(rtdb, `sos_alerts/${request.id}`), { status: 'RESOLVED' });
    
    // Log Trip for earnings
    await addDoc(collection(db, "trips"), {
      driverId: user.uid,
      patientId: request.id,
      timestamp: Date.now(),
      fare: 500
    });

    setEarnings(prev => prev + 500);
    setRideCount(prev => prev + 1);
    setMissionStage('idle');
    setRequest(null);
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-yellow-500 font-mono animate-pulse">Connecting to Fleet...</div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="absolute top-0 w-full z-20 p-4 bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
        <div className="flex justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-3">
             <div className="bg-yellow-500 p-2 rounded-full text-black shadow-lg shadow-yellow-500/20"><Car size={20}/></div>
             <div>
               <h1 className="font-bold text-lg leading-none">Matri-Fleet</h1>
               <p className="text-[10px] text-gray-300 font-mono">UNIT: {user.displayName || "Unknown"}</p>
             </div>
          </div>
          <button onClick={toggleStatus} className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${isOnline ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            <Power size={14}/> {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>
      </header>

      {/* --- MAP --- */}
      <div className="absolute inset-0 z-0">
         <MapContainer center={location} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <FlyToLocation center={location} />
            
            {/* Driver Marker */}
            <CircleMarker center={location} radius={8} pathOptions={{ color: '#eab308', fillColor: '#eab308', fillOpacity: 1 }}>
               <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></div>
            </CircleMarker>

            {/* Patient Marker (When Request Active) */}
            {request && (
              <Marker position={[request.lat, request.lng]}>
                 <Popup>Patient: {request.name}</Popup>
              </Marker>
            )}
         </MapContainer>
      </div>

      {/* --- INTERFACE LAYER --- */}
      <div className="mt-auto z-10 p-4 pb-8 w-full pointer-events-none">
        <div className="pointer-events-auto">
        <AnimatePresence mode="wait">
          
          {/* 1. IDLE STATE */}
          {missionStage === 'idle' && (
            <motion.div initial={{y: 100}} animate={{y: 0}} exit={{y: 100}} className="bg-neutral-900/90 backdrop-blur-md rounded-3xl p-6 border border-neutral-800 shadow-2xl">
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="bg-neutral-800/50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-1"><DollarSign size={14}/> EARNINGS</div>
                    <div className="text-2xl font-black text-yellow-400">৳ {earnings}</div>
                 </div>
                 <div className="bg-neutral-800/50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-1"><History size={14}/> TRIPS</div>
                    <div className="text-2xl font-black text-white">{rideCount}</div>
                 </div>
              </div>
              {!isOnline ? (
                <div className="text-center text-sm text-red-500 font-bold bg-red-900/20 py-3 rounded-xl border border-red-900/50">YOU ARE CURRENTLY OFFLINE</div>
              ) : (
                <div className="text-center text-sm text-green-500 font-bold bg-green-900/20 py-3 rounded-xl border border-green-900/50 animate-pulse flex items-center justify-center gap-2">
                  <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
                  WAITING FOR DISPATCH...
                </div>
              )}
            </motion.div>
          )}

          {/* 2. RINGING STATE (INCOMING REQUEST) */}
          {missionStage === 'ringing' && request && (
             <motion.div initial={{y: 200}} animate={{y: 0}} className="bg-neutral-900 rounded-3xl p-6 border-2 border-red-500 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-loading-bar"></div>
                <div className="flex items-center justify-between mb-4">
                   <div>
                     <h2 className="text-2xl font-black text-white">EMERGENCY</h2>
                     <p className="text-red-400 font-bold animate-pulse">Incoming Patient Request</p>
                   </div>
                   <div className="bg-red-500 text-white font-bold p-3 rounded-full animate-bounce"><Bell size={24}/></div>
                </div>
                
                <div className="space-y-3 mb-6 bg-neutral-800 p-4 rounded-xl">
                   <div className="flex items-center gap-3">
                      <MapPin className="text-yellow-500" size={20}/>
                      <span className="text-lg font-bold text-white">{request.distance} Away</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <User className="text-blue-500" size={20}/>
                      <span className="text-lg font-medium text-slate-300">{request.name}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={()=>{setRequest(null); setMissionStage('idle')}} className="py-4 bg-neutral-800 text-gray-400 rounded-xl font-bold">DECLINE</button>
                  <button onClick={handleAccept} className="py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/50">ACCEPT</button>
                </div>
             </motion.div>
          )}

          {/* 3. ACTIVE MISSION STATE */}
          {(missionStage === 'accepted' || missionStage === 'arrived' || missionStage === 'in_progress') && request && (
             <motion.div initial={{y: 200}} animate={{y: 0}} className="bg-neutral-900 rounded-3xl p-5 border border-neutral-800 shadow-2xl">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-800">
                   <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-800">{request.name[0]}</div>
                      <div>
                         <h3 className="font-bold text-lg">{request.name}</h3>
                         <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded uppercase font-bold">{missionStage.replace('_', ' ')}</span>
                      </div>
                   </div>
                   <a href={`tel:${request.phone}`} className="bg-green-600 p-3 rounded-full text-white shadow-lg hover:scale-110 transition-transform"><Phone size={20}/></a>
                </div>

                {missionStage === 'accepted' && (
                   <button onClick={handleArrived} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-500">
                      <MapPin/> I'VE ARRIVED
                   </button>
                )}

                {missionStage === 'arrived' && (
                   <button onClick={handleStartTrip} className="w-full py-4 bg-yellow-500 text-black rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-yellow-400">
                      <Navigation/> START GPS
                   </button>
                )}

                {missionStage === 'in_progress' && (
                   <button onClick={handleComplete} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-500">
                      <CheckCircle/> COMPLETE TRIP
                   </button>
                )}
             </motion.div>
          )}

        </AnimatePresence>
        </div>
      </div>

    </div>
  );
}

// --- AUTH SCREEN (UPDATED) ---
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setError("");
    try {
      if(isLogin) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        // REGISTER DRIVER & AUTOMATE DB POPULATION
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(res.user, { displayName: name });
        
        // 1. Create Firestore Profile (Secure Role)
        await setDoc(doc(db, "users", res.user.uid), {
          name, email, role: 'driver', createdAt: new Date().toISOString()
        });

        // 2. Initialize Realtime DB (Map Presence)
        await set(ref(rtdb, `drivers/${res.user.uid}`), {
          name, 
          status: 'offline', // Default offline
          type: 'Ambulance',
          lat: 23.8103, // Default Coords (Dhaka)
          lng: 90.4125
        });
      }
    } catch (e:any) { 
      setError(e.message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
       <div className="w-full max-w-sm">
         <div className="flex justify-center mb-8">
            <div className="bg-yellow-500 p-4 rounded-2xl text-black shadow-lg shadow-yellow-500/20"><Car size={48}/></div>
         </div>
         <h1 className="text-3xl font-black text-center mb-2 tracking-tighter">MATRI-FLEET</h1>
         <p className="text-gray-500 text-center mb-8 text-sm">{isLogin ? "Driver Secure Login" : "Join the Rescue Fleet"}</p>
         
         <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 flex items-center gap-3 focus-within:border-yellow-500 transition-colors">
                 <UserPlus className="text-gray-500" size={20}/>
                 <input className="bg-transparent flex-1 outline-none text-white placeholder-gray-600 text-sm" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} required/>
              </div>
            )}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 flex items-center gap-3 focus-within:border-yellow-500 transition-colors">
               <User className="text-gray-500" size={20}/>
               <input className="bg-transparent flex-1 outline-none text-white placeholder-gray-600 text-sm" placeholder="Driver Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 flex items-center gap-3 focus-within:border-yellow-500 transition-colors">
               <div className="text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
               <input className="bg-transparent flex-1 outline-none text-white placeholder-gray-600 text-sm" type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} required/>
            </div>
            
            {error && <p className="text-red-500 text-xs text-center font-bold bg-red-900/20 py-2 rounded">{error}</p>}

            <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4">
               {isLogin ? "LOGIN TO CONSOLE" : "REGISTER UNIT"} <ArrowRight size={20}/>
            </button>
         </form>

         <button onClick={()=>setIsLogin(!isLogin)} className="w-full text-center text-xs text-gray-500 mt-6 hover:text-white">
            {isLogin ? "New Driver? Apply for Access" : "Already registered? Login Here"}
         </button>
       </div>
    </div>
  );
}