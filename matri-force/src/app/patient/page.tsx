"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, MessageCircle, Users, User, Send, Camera, 
  AlertOctagon, ShoppingBag, Stethoscope, 
  ChevronRight, LogOut, Heart, Smartphone,
  Shield, FileText, Phone, UploadCloud, ArrowLeft,
  Wallet, Droplet, Footprints, Timer, Pill, Trash2,
  CheckCircle, Plus, Globe, Bell, Map, Calendar,
  FilePlus, Clipboard, Moon, Sun, Paperclip, Mic,
  History, X, RefreshCw, Zap, Smile, Frown, Meh,
  Baby, Activity, BookOpen, PlayCircle, Video, Music, Edit,
  AlertTriangle, PhoneCall, UserPlus, FileCheck // Added UserPlus and FileCheck
} from "lucide-react";
import Link from "next/link"; 

// Firebase Imports
import { db, rtdb, auth } from "@/lib/firebase"; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged, 
  signOut,
  updateProfile 
} from "firebase/auth";
import { 
  collection, doc, setDoc, getDoc, 
  addDoc, query, orderBy, getDocs, deleteDoc, where, onSnapshot, updateDoc 
} from "firebase/firestore";
import { ref, set, push, onValue, update, remove, increment } from "firebase/database";

// --- Types ---
type Tab = "home" | "care" | "wellness" | "community" | "profile";
type UserMode = "mother" | "guardian";
type AppStage = "pregnancy" | "postpartum";
type ChatMode = "ai" | "doctor";
type Lang = "en" | "bn";

// --- 🌐 TRANSLATIONS ---
const t = {
  en: {
    welcome_back: "Welcome Back",
    join_matri: "Join Matri-Bandhob",
    sign_in: "Sign In",
    create_acc: "Create Account",
    full_name: "Full Name",
    email: "Email Address",
    pass: "Password",
    no_acc: "Don't have an account? Sign Up",
    have_acc: "Already have an account? Sign In",
    weeks: "Weeks Pregnant",
    baby_age: "Baby Age",
    guardian_active: "Guardian Mode • Active",
    hi: "Hi",
    ma: "Ma",
    family_support: "Family Support",
    guardian_btn: "Guardian",
    exit_btn: "Exit",
    home: "Home",
    care: "Care",
    wellness: "Wellness",
    forum: "Forum",
    profile: "Profile",
    mango: "Mango",
    baby_size: "Baby is the size of a",
    length: "Length",
    weight: "Weight",
    normal: "Normal",
    alert: "Alert",
    normal_symptoms: "Back pain, frequent urination.",
    alert_symptoms: "Severe headache, bleeding.",
    baby_growth: "Baby Growth",
    feed: "Feed",
    diaper: "Diaper",
    bank: "Mayer Bank",
    goal: "Goal",
    saved: "Saved for delivery",
    deposit: "+ Deposit ৳50",
    sos: "SOS",
    sending_help: "SENDING HELP...",
    hold_help: "HOLD FOR HELP",
    hydration: "Hydration Log",
    glass: "+ 1 Glass",
    kick: "Kick Counter",
    kick_btn: "+ 1 Kick",
    guardian_duties: "Guardian Duties",
    emergency_override: "Emergency Override",
    trigger_sos: "TRIGGER SOS",
    ask_ai: "Ask AI",
    live_doc: "Live Doctor",
    start_chat_ai: "Start messaging AI Assistant",
    start_chat_doc: "Start messaging Dr. Ayesha",
    type_msg: "Type a message...",
    find_doc: "Find a Doctor",
    book: "Book",
    request_appt: "Requesting appointment with",
    appt_btn: "📅 Appointment",
    video_btn: "🎥 Video Call",
    critical_alert: "CRITICAL ALERT SENT TO DOCTOR",
    alert_sent: "Doctor notified of emergency.",
    how_feeling: "How are you feeling today?",
    relax: "2-Minute Relaxation",
    start_audio: "Start Audio",
    breathe: "Breathe",
    learn_hub: "📚 Learning Hub",
    diet_plan: "Diet Plan",
    exercises: "Exercises",
    danger_signs: "Danger Signs",
    newborn_care: "Newborn Care",
    what_eat: "What to eat & avoid",
    safe_yoga: "Safe yoga & moves",
    call_doc: "When to call doctor",
    bath_feed: "Bathing & Feeding",
    ai_diet_title: "AI Market Diet Plan",
    scan_market: "Scan Market Prices",
    est_price: "Est. Price",
    exercise_title: "Safe Exercises",
    danger_title: "Immediate Danger Signs",
    newborn_title: "Newborn Essentials",
    call_ambulance: "Call Ambulance",
    back: "Back",
    loading: "Loading...",
    forum_title: "Maa-to-Maa Forum",
    new_post: "+ New Post",
    cancel: "Cancel",
    post_now: "Post Now",
    share_exp: "Share your experience...",
    delete_confirm: "Delete post?",
    dark_mode: "Dark Mode",
    preg_details: "Pregnancy Details",
    reminders: "Reminders",
    log_vitals: "Log Health Vitals",
    chat_history: "Chat History",
    sign_out: "Sign Out",
    edit_profile: "My Pregnancy Profile",
    current_stage: "Current Stage",
    pregnancy: "Pregnancy",
    postpartum: "Postpartum",
    lmp: "Last Period Date (LMP)",
    save_changes: "Save Changes",
    set_reminders: "Set Reminders",
    add_reminder: "Add Reminder",
    add_new: "Add New",
    title_ex: "Title (e.g. Iron Pill)",
    medicine: "Medicine",
    water: "Water",
    doctor: "Doctor",
    food: "Food",
    log_vitals_title: "Log Vitals",
    bp: "Blood Pressure (e.g. 120/80)",
    sugar: "Blood Sugar (mmol/L)",
    save_log: "Save Log",
    chat_archive: "Chat Archive",
    back_settings: "Back to Settings",
    contacts: "Emergency Contacts",
    add_contact: "Add Contact",
    name: "Name",
    phone: "Phone Number",
    relation: "Relation (e.g. Husband)",
    safety_net: "Safety Network",
    req_blood: "Request Blood",
    blood_needed: "Blood Needed",
    select_group: "Select Group",
    send_req: "Send Request",
    req_sent: "Blood Request Sent!",
    // --- NEW CARE TAB TRANSLATIONS ---
    select_doc: "Select Doctor",
    available_docs: "Available Doctors",
    my_appt: "My Appointments",
    prescriptions: "Prescriptions",
    view_rx: "View Prescriptions",
    no_docs: "No doctors available",
    doc_speciality: "Speciality",
    book_new: "Book New",
    dosage: "Dosage",
    doctor_note: "Doctor Note"
  },
  bn: {
    welcome_back: "স্বাগতম",
    join_matri: "মাতৃ-ফোর্সে যোগ দিন",
    sign_in: "লগ ইন",
    create_acc: "অ্যাকাউন্ট খুলুন",
    full_name: "পুরো নাম",
    email: "ইমেইল",
    pass: "পাসওয়ার্ড",
    no_acc: "অ্যাকাউন্ট নেই? সাইন আপ করুন",
    have_acc: "অ্যাকাউন্ট আছে? লগ ইন করুন",
    weeks: "সপ্তাহের গর্ভাবস্থা",
    baby_age: "শিশুর বয়স",
    guardian_active: "অভিভাবক মোড • চালু",
    hi: "স্বাগতম",
    ma: "মা",
    family_support: "পারিবারিক সহায়তা",
    guardian_btn: "অভিভাবক",
    exit_btn: "বন্ধ",
    home: "নীড়",
    care: "সেবা",
    wellness: "সুস্থতা",
    forum: "ফোরাম",
    profile: "প্রোফাইল",
    mango: "আম",
    baby_size: "বাচ্চা এখন একটি",
    length: "দৈর্ঘ্য",
    weight: "ওজন",
    normal: "স্বাভাবিক",
    alert: "সতর্কতা",
    normal_symptoms: "কোমর ব্যথা, ঘন ঘন প্রস্রাব।",
    alert_symptoms: "তীব্র মাথাব্যথা, রক্তপাত।",
    baby_growth: "শিশুর বৃদ্ধি",
    feed: "খাওয়ানো",
    diaper: "ডায়াপার",
    bank: "মায়ের ব্যাংক",
    goal: "লক্ষ্য",
    saved: "ডেলিভারির জন্য জমা",
    deposit: "+ জমা দিন ৫০৳",
    sos: "জরুরী সেবা",
    sending_help: "সাহায্য পাঠানো হচ্ছে...",
    hold_help: "সাহায্যের জন্য ধরুন",
    hydration: "পানি পান",
    glass: "+ ১ গ্লাস",
    kick: "কিক কাউন্টার",
    kick_btn: "+ ১ কিক",
    guardian_duties: "অভিভাবকের দায়িত্ব",
    emergency_override: "জরুরী ওভাররাইড",
    trigger_sos: "SOS চালু করুন",
    ask_ai: "এআই চ্যাট",
    live_doc: "ডাক্তার",
    start_chat_ai: "এআই সহকারীর সাথে কথা বলুন",
    start_chat_doc: "ডাঃ আয়েশার সাথে কথা বলুন",
    type_msg: "মেসেজ লিখুন...",
    find_doc: "ডাক্তার খুঁজুন",
    book: "বুক করুন",
    request_appt: "অ্যাপয়েন্টমেন্ট অনুরোধ:",
    appt_btn: "📅 অ্যাপয়েন্টমেন্ট",
    video_btn: "🎥 ভিডিও কল",
    critical_alert: "জরুরী অবস্থা সনাক্ত হয়েছে",
    alert_sent: "ডাক্তারকে জানানো হয়েছে",
    how_feeling: "আজ কেমন লাগছে?",
    relax: "২-মিনিট বিশ্রাম",
    start_audio: "অডিও চালু",
    breathe: "শ্বাস নিন",
    learn_hub: "📚 শিক্ষণ কেন্দ্র",
    diet_plan: "খাদ্য তালিকা",
    exercises: "ব্যায়াম",
    danger_signs: "বিপদ চিহ্ন",
    newborn_care: "নবজাতকের যত্ন",
    what_eat: "কি খাবেন ও বর্জন করবেন",
    safe_yoga: "নিরাপদ যোগব্যায়াম",
    call_doc: "কখন ডাক্তার ডাকবেন",
    bath_feed: "গোসল ও খাওয়ানো",
    ai_diet_title: "এআই ডায়েট চার্ট",
    scan_market: "বাজার দর দেখুন",
    est_price: "আনুমানিক দাম",
    exercise_title: "নিরাপদ ব্যায়াম",
    danger_title: "বিপদ চিহ্ন",
    newborn_title: "নবজাতকের যত্ন",
    call_ambulance: "অ্যাম্বুলেন্স ডাকুন",
    back: "ফিরে যান",
    loading: "লোড হচ্ছে...",
    forum_title: "মা-তো-মা ফোরাম",
    new_post: "+ নতুন পোস্ট",
    cancel: "বাতিল",
    post_now: "পোস্ট করুন",
    share_exp: "আপনার অভিজ্ঞতা শেয়ার করুন...",
    delete_confirm: "পোস্ট মুছবেন?",
    dark_mode: "ডার্ক মোড",
    preg_details: "গর্ভাবস্থায় তথ্য",
    reminders: "রিমাইন্ডার",
    log_vitals: "স্বাস্থ্য তথ্য যোগ করুন",
    chat_history: "চ্যাট ইতিহাস",
    sign_out: "লগ আউট",
    edit_profile: "আমার প্রোফাইল",
    current_stage: "বর্তমান অবস্থা",
    pregnancy: "গর্ভাবস্থা",
    postpartum: "প্রসব পরবর্তী",
    lmp: "শেষ পিরিয়ডের তারিখ (LMP)",
    save_changes: "সংরক্ষণ করুন",
    set_reminders: "রিমাইন্ডার সেট করুন",
    add_reminder: "যোগ করুন",
    add_new: "নতুন যোগ",
    title_ex: "নাম (যেমন: আয়রন বড়ি)",
    medicine: "ঔষধ",
    water: "পানি",
    doctor: "ডাক্তার",
    food: "খাবার",
    log_vitals_title: "তথ্য দিন",
    bp: "রক্তচাপ (যেমন 120/80)",
    sugar: "রক্তের চিনি (mmol/L)",
    save_log: "সেভ করুন",
    chat_archive: "চ্যাট আর্কাইভ",
    back_settings: "সেটিংস-এ ফিরে যান",
    contacts: "জরুরী যোগাযোগ",
    add_contact: "যোগ করুন",
    name: "নাম",
    phone: "ফোন নম্বর",
    relation: "সম্পর্ক (যেমন: স্বামী)",
    safety_net: "নিরাপত্তা নেটওয়ার্ক",
    req_blood: "রক্ত প্রয়োজন",
    blood_needed: "রক্তের গ্রুপ প্রয়োজন",
    select_group: "গ্রুপ নির্বাচন করুন",
    send_req: "অনুরোধ পাঠান",
    req_sent: "রক্তের অনুরোধ পাঠানো হয়েছে!",
    // --- NEW CARE TAB TRANSLATIONS ---
    select_doc: "ডাক্তার নির্বাচন",
    available_docs: "উপলব্ধ ডাক্তার",
    my_appt: "আমার অ্যাপয়েন্টমেন্ট",
    prescriptions: "প্রেসক্রিপশন",
    view_rx: "প্রেসক্রিপশন দেখুন",
    no_docs: "কোন ডাক্তার নেই",
    doc_speciality: "বিশেষজ্ঞ",
    book_new: "নতুন বুকিং",
    dosage: "মাত্রা",
    doctor_note: "ডাক্তারের পরামর্শ"
  }
};

export default function PatientApp() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [userMode, setUserMode] = useState<UserMode>("mother");
  const [appStage, setAppStage] = useState<AppStage>("pregnancy");
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<Lang>("en");

  // --- Fixed Auth Listener ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("matri_theme");
    if (savedTheme === "dark") setDarkMode(true);

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // 🔥 Realtime Listener for Role Verification
        const unsubDoc = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.role === 'patient') {
              setUser(currentUser);
              setUserData(data);
              if(data.stage) setAppStage(data.stage);
              
              // Load Savings
              const savingsRef = ref(rtdb, `users/${currentUser.uid}/savings`);
              onValue(savingsRef, (snap) => {
                 const savings = snap.val();
                 setUserData((prev: any) => ({ ...prev, savings: savings || { current: 0, goal: 5000 } }));
              });
            } else {
              // Wrong Role
              signOut(auth);
              alert("Access Denied: Please use the Doctor App.");
              setUser(null);
            }
          }
          // If doc doesn't exist yet (during signup), we wait.
          setLoading(false);
        });
        return () => unsubDoc();
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem("matri_theme", newTheme ? "dark" : "light");
  };

  const toggleLang = () => setLang(lang === "en" ? "bn" : "en");

  if (loading) return <div className="h-screen flex items-center justify-center bg-white text-rose-500 font-bold animate-pulse">Loading Matri-Bandhob OS...</div>;

  if (!user) return <AuthScreen darkMode={darkMode} lang={lang} toggleLang={toggleLang} />;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col fixed inset-0`}>
      
      {/* HEADER */}
      <header className={`px-5 pt-10 pb-4 shadow-sm flex justify-between items-center z-40 shrink-0 ${darkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-white'}`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-rose-400' : 'text-slate-500'}`}>
            {userMode === 'mother' 
              ? (appStage === 'pregnancy' ? `${t[lang].weeks} ${userData?.gestationWeek || 1}` : `${t[lang].baby_age}: 2M`) 
              : t[lang].guardian_active}
          </p>
          <h1 className="text-xl font-black">
            {userMode === 'mother' ? `${t[lang].hi}, ${user.displayName?.split(' ')[0] || t[lang].ma}` : t[lang].family_support}
          </h1>
        </div>
        <div className="flex gap-2">
           <button onClick={toggleLang} className={`h-8 w-8 rounded-full border flex items-center justify-center text-xs font-bold ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}>
             {lang === "en" ? "BN" : "EN"}
           </button>
           <button 
             onClick={() => setUserMode((prev) => prev === 'mother' ? 'guardian' : 'mother')}
             className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${userMode === 'guardian' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-transparent border-slate-300 dark:border-slate-600'}`}
           >
             {userMode === 'mother' ? t[lang].guardian_btn : t[lang].exit_btn}
           </button>
           <button onClick={() => setActiveTab("profile")} className="h-10 w-10 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white dark:ring-slate-800">
             {user.displayName?.[0] || "U"}
           </button>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === "home" && <HomeTab key="home" user={user} userData={userData} mode={userMode} stage={appStage} darkMode={darkMode} lang={lang} />}
          {activeTab === "care" && <CareTab key="care" user={user} darkMode={darkMode} lang={lang} userData={userData} />}
          {activeTab === "wellness" && <WellnessTab key="wellness" user={user} darkMode={darkMode} stage={appStage} lang={lang} />}
          {activeTab === "community" && <CommunityTab key="community" user={user} darkMode={darkMode} lang={lang} />}
          {activeTab === "profile" && <ProfileTab key="profile" user={user} userData={userData} logout={() => signOut(auth)} darkMode={darkMode} toggleTheme={toggleTheme} appStage={appStage} setAppStage={setAppStage} lang={lang} setDarkMode={undefined} />}
        </AnimatePresence>
      </main>

      {/* BOTTOM NAV */}
      <nav className={`fixed bottom-0 w-full border-t px-2 py-3 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-50 rounded-t-2xl pb-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <NavIcon icon={Home} label={t[lang].home} active={activeTab === "home"} onClick={() => setActiveTab("home")} darkMode={darkMode} />
        <NavIcon icon={Stethoscope} label={t[lang].care} active={activeTab === "care"} onClick={() => setActiveTab("care")} darkMode={darkMode} />
        <NavIcon icon={Heart} label={t[lang].wellness} active={activeTab === "wellness"} onClick={() => setActiveTab("wellness")} darkMode={darkMode} />
        <NavIcon icon={Users} label={t[lang].forum} active={activeTab === "community"} onClick={() => setActiveTab("community")} darkMode={darkMode} />
        <NavIcon icon={User} label={t[lang].profile} active={activeTab === "profile"} onClick={() => setActiveTab("profile")} darkMode={darkMode} />
      </nav>
    </div>
  );
}

// =========================================================================
// 🔐 AUTH SCREEN
// =========================================================================
function AuthScreen({ darkMode, lang, toggleLang }: { darkMode: boolean, lang: Lang, toggleLang: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
        // FORCE ROLE: PATIENT
        await setDoc(doc(db, "users", res.user.uid), { name, email, role: "patient", gestationWeek: 12, stage: "pregnancy", createdAt: new Date().toISOString() });
        await set(ref(rtdb, `users/${res.user.uid}/savings`), { current: 0, goal: 5000 });
      }
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 animate-in fade-in text-slate-900">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 flex items-center gap-1">
          <ArrowLeft size={16}/> {t[lang].back}
        </Link>
        <button onClick={toggleLang} className="text-xs font-bold border border-slate-300 rounded px-2 py-1">
          {lang === "en" ? "BN" : "EN"}
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="h-16 w-16 bg-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-200">
           <Heart className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">{isLogin ? t[lang].welcome_back : t[lang].join_matri}</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && <input type="text" placeholder={t[lang].full_name} className="auth-input" value={name} onChange={e=>setName(e.target.value)} required />}
          <input type="email" placeholder={t[lang].email} className="auth-input" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder={t[lang].pass} className="auth-input" value={password} onChange={e=>setPassword(e.target.value)} required />
          {error && <p className="text-rose-500 text-sm bg-rose-50 p-3 rounded-lg border border-rose-100 font-medium">{error}</p>}
          <button type="submit" className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all mt-4">{isLogin ? t[lang].sign_in : t[lang].create_acc}</button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="text-slate-500 text-sm hover:text-rose-500 font-medium mt-6 text-center w-full block">
          {isLogin ? t[lang].no_acc : t[lang].have_acc}
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// 🏠 HOME TAB (Dashboard)
// =========================================================================
function HomeTab({ user, userData, mode, stage, darkMode, lang }: { user: any; userData: any; mode: UserMode; stage: AppStage; darkMode: boolean; lang: Lang }) {
  const [sosActive, setSosActive] = useState(false);
  const [waterCount, setWaterCount] = useState(0);
  const [kickCount, setKickCount] = useState(0);
  const [feedCount, setFeedCount] = useState(0);
  const [diaperCount, setDiaperCount] = useState(0);
  const [contacts, setContacts] = useState<any[]>([]);
  
  // Blood Request State
  const [showBloodModal, setShowBloodModal] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("O+");

  const savings = userData?.savings || { current: 0, goal: 5000 };
  const percentage = Math.min(100, (savings.current / savings.goal) * 100);

  // Fetch Emergency Contacts for Guardian
  useEffect(() => {
    if (mode === 'guardian') {
      const q = query(collection(db, "users", user.uid, "contacts"));
      onSnapshot(q, (snap) => setContacts(snap.docs.map(d => d.data())));
    }
  }, [mode, user.uid]);

  const addDeposit = async () => { await update(ref(rtdb, `users/${user.uid}/savings`), { current: increment(50) }); };

  // --- BLOOD REQUEST FUNCTION ---
  const handleBloodRequest = async () => {
    if (!navigator.geolocation) return alert("Enable GPS!");
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        // 1. Push to Doctor Alerts (Realtime)
        await push(ref(rtdb, 'doctor_alerts'), {
            type: 'BLOOD_REQ',
            patientId: user.uid,
            patientName: user.displayName,
            phone: userData?.phone || "N/A",
            message: `URGENT: ${bloodGroup} Blood Required at Location.`,
            location: { lat: latitude, lng: longitude },
            timestamp: Date.now(),
            status: 'unresolved'
        });

        // 2. Log in Firestore
        await addDoc(collection(db, "blood_requests"), {
            patientId: user.uid,
            bloodGroup,
            status: "pending",
            timestamp: Date.now()
        });

        alert(t[lang].req_sent);
        setShowBloodModal(false);
    });
  };

  const triggerSOS = async () => {
    if (!navigator.geolocation) return alert("Enable GPS!");
    const contactsSnap = await getDocs(collection(db, "users", user.uid, "contacts"));
    const contactsList = contactsSnap.docs.map(d => d.data());

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      if (navigator.onLine) {
        await set(ref(rtdb, `sos_alerts/${user.uid}`), {
          lat: latitude, lng: longitude, status: "RED", timestamp: Date.now(), 
          user_name: user.displayName, phone: userData?.phone || user.email,
          notified_contacts: contactsList
        });
        await push(ref(rtdb, 'doctor_alerts'), {
          type: 'SOS_EMERGENCY', patientId: user.uid, patientName: user.displayName,
          message: `SOS Triggered! Location: ${latitude}, ${longitude}. Contacts notified.`,
          timestamp: Date.now(), status: 'unresolved'
        });
        setSosActive(true);
      } else {
        const smsBody = `SOS! I need help. Location: https://maps.google.com/?q=${latitude},${longitude}`;
        window.open(`sms:999?body=${encodeURIComponent(smsBody)}`, '_self');
      }
    });
  };

  const cardClass = `p-4 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`;

  // --- BLOOD MODAL ---
  if (showBloodModal) return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className={`w-full max-w-sm rounded-2xl p-6 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
              <h2 className="text-xl font-bold text-rose-500 mb-4 flex items-center gap-2"><Droplet fill="currentColor"/> {t[lang].req_blood}</h2>
              <label className="text-sm font-bold opacity-60 mb-2 block">{t[lang].select_group}</label>
              <div className="grid grid-cols-4 gap-2 mb-6">
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <button key={bg} onClick={()=>setBloodGroup(bg)} className={`py-2 rounded-lg text-sm font-bold border ${bloodGroup === bg ? 'bg-rose-500 text-white border-rose-500' : 'border-slate-300 text-slate-500'}`}>
                          {bg}
                      </button>
                  ))}
              </div>
              <button onClick={handleBloodRequest} className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold mb-2 shadow-lg shadow-rose-500/30">{t[lang].send_req}</button>
              <button onClick={()=>setShowBloodModal(false)} className="w-full py-3 text-sm opacity-60">{t[lang].cancel}</button>
          </div>
      </div>
  );

  // --- GUARDIAN MODE ---
  if (mode === "guardian") {
    return (
      <div className="space-y-4 animate-in slide-in-from-bottom-5">
        <div className={`${cardClass} bg-sky-50/50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800`}>
           <h2 className={`text-lg font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-sky-300' : 'text-sky-900'}`}><CheckCircle size={18}/> {t[lang].guardian_duties}</h2>
           <div className="space-y-3">
             {["Iron Tablet", "Water 2L", "Check Swelling", "Talk to her"].map((task, i) => (
               <label key={i} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                 <input type="checkbox" className="h-5 w-5 rounded text-sky-500 focus:ring-sky-500" />
                 <span className="font-medium">{task}</span>
               </label>
             ))}
           </div>
        </div>

        {/* New Safety Network Card */}
        <div className={cardClass}>
           <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-rose-500"><PhoneCall size={18}/> {t[lang].safety_net}</h2>
           <div className="space-y-2">
             {contacts.length === 0 && <p className="text-xs opacity-50">No contacts added. Go to Profile.</p>}
             {contacts.map((c, i) => (
               <div key={i} className={`flex justify-between items-center p-2 rounded-lg border ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                 <div><p className="font-bold text-sm">{c.name}</p><p className="text-xs opacity-50">{c.relation}</p></div>
                 <a href={`tel:${c.phone}`} className="bg-green-500 text-white p-2 rounded-full"><Phone size={14}/></a>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-rose-900/20 p-6 rounded-2xl border border-rose-500/30">
          <h2 className="text-lg font-bold text-rose-500 mb-2">{t[lang].emergency_override}</h2>
          <button onClick={triggerSOS} className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
            <AlertOctagon /> {t[lang].trigger_sos}
          </button>
        </div>
      </div>
    );
  }

  // --- MOTHER MODE ---
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5">
      
      {/* 🤰 Week / Baby Status Card */}
      {stage === 'pregnancy' ? (
        <div className={`${cardClass} relative overflow-hidden bg-gradient-to-r from-pink-50 to-rose-50 dark:from-slate-900 dark:to-slate-800`}>
           <div className="flex justify-between items-start z-10 relative">
             <div>
               <h2 className="text-lg font-bold">{t[lang].weeks} {userData?.gestationWeek}</h2>
               <p className="text-sm opacity-60 mb-2">{t[lang].baby_size} <span className="font-bold text-orange-500">{t[lang].mango}</span> 🥭</p>
               <div className="flex gap-2 text-[10px] font-bold">
                  <span className="bg-white/50 px-2 py-1 rounded">{t[lang].length}: 30cm</span>
                  <span className="bg-white/50 px-2 py-1 rounded">{t[lang].weight}: 600g</span>
               </div>
             </div>
             <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm border border-rose-100">👶</div>
           </div>
           <div className="mt-4 p-3 bg-white/60 dark:bg-slate-800/50 rounded-xl text-xs">
              <span className="font-bold text-rose-500">{t[lang].normal}:</span> {t[lang].normal_symptoms}<br/>
              <span className="font-bold text-red-500">{t[lang].alert}:</span> {t[lang].alert_symptoms}
           </div>
        </div>
      ) : (
        <div className={`${cardClass} bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800`}>
           <div className="flex justify-between items-center">
             <div>
               <h2 className="text-lg font-bold">{t[lang].baby_growth}</h2>
               <p className="text-sm opacity-60">2 Months 1 Week</p>
             </div>
             <Baby size={32} className="text-blue-500"/>
           </div>
           <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={()=>setFeedCount(c=>c+1)} className="bg-white dark:bg-slate-800 p-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"><Droplet size={14} className="text-blue-500"/> {t[lang].feed} ({feedCount})</button>
              <button onClick={()=>setDiaperCount(c=>c+1)} className="bg-white dark:bg-slate-800 p-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"><Trash2 size={14} className="text-orange-500"/> {t[lang].diaper} ({diaperCount})</button>
           </div>
        </div>
      )}

      {/* 💰 Mayer Bank */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
         <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
               <h2 className="font-bold text-lg flex items-center gap-2"><Wallet/> {t[lang].bank}</h2>
               <span className="text-xs bg-white/20 px-2 py-1 rounded">{t[lang].goal}: ৳{savings.goal}</span>
            </div>
            <div className="mb-4">
               <p className="text-3xl font-black">৳ {savings.current}</p>
               <p className="text-emerald-100 text-xs">{t[lang].saved}</p>
            </div>
            <div className="w-full bg-black/20 h-2 rounded-full mb-4">
               <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
            </div>
            <button onClick={addDeposit} className="w-full bg-white text-emerald-900 font-bold py-3 rounded-xl shadow-sm hover:bg-emerald-50 active:scale-95 transition-all">
               {t[lang].deposit}
            </button>
         </div>
         <Wallet size={120} className="absolute -bottom-6 -right-6 text-white/10 rotate-12" />
      </div>

      {/* 🚨 SOS */}
      <div className="flex justify-center gap-3 py-2">
         {/* SOS BUTTON */}
         <button 
          onClick={sosActive ? () => setSosActive(false) : triggerSOS} 
          className={`
            relative w-32 h-32 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl
            ${sosActive ? "bg-red-600 shadow-red-500/50 animate-pulse ring-4 ring-red-400" : "bg-slate-800 dark:bg-slate-700 shadow-slate-900/20 ring-4 ring-white dark:ring-slate-800"}
          `}
        >
          <div className="text-center text-white z-10 flex flex-col items-center">
            <Shield size={28} className="mb-1" />
            <span className="text-xl font-black tracking-widest block">{t[lang].sos}</span>
          </div>
        </button>

        {/* 🩸 BLOOD REQUEST BUTTON */}
        <button onClick={()=>setShowBloodModal(true)} className="w-32 h-32 rounded-full bg-white dark:bg-slate-800 border-4 border-rose-500 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all text-rose-500">
            <Droplet size={28} className="mb-1 fill-rose-500"/>
            <span className="text-xs font-bold text-center leading-tight">{t[lang].req_blood}</span>
        </button>
      </div>

      {/* 🧬 Trackers */}
      <div className="grid grid-cols-2 gap-3">
         <div className={cardClass}>
            <div className="flex justify-between items-start mb-2">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Droplet size={18}/></div>
               <span className="text-xl font-bold">{waterCount}/8</span>
            </div>
            <p className="text-xs font-bold opacity-60 mb-2">{t[lang].hydration}</p>
            <button onClick={()=>setWaterCount(c=>c+1)} className="w-full py-1 bg-blue-500 text-white rounded-lg text-xs font-bold">{t[lang].glass}</button>
         </div>

         <div className={cardClass}>
            <div className="flex justify-between items-start mb-2">
               <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Footprints size={18}/></div>
               <span className="text-xl font-bold">{kickCount}</span>
            </div>
            <p className="text-xs font-bold opacity-60 mb-2">{t[lang].kick}</p>
            <button onClick={()=>setKickCount(c=>c+1)} className="w-full py-1 bg-rose-500 text-white rounded-lg text-xs font-bold">{t[lang].kick_btn}</button>
         </div>
      </div>
    </div>
  );
}

// =========================================================================
// 🌿 WELLNESS TAB (INTERACTIVE HUB + AI DIET)
// =========================================================================
function WellnessTab({ user, darkMode, stage, lang }: { user: any; darkMode: boolean; stage: AppStage; lang: Lang }) {
  const [view, setView] = useState<'hub' | 'diet' | 'exercise' | 'danger'>('hub');
  const [mood, setMood] = useState<string | null>(null);
  const [dietPlan, setDietPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cardClass = `p-4 rounded-2xl shadow-sm border cursor-pointer hover:scale-[1.02] transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`;

  // AI Diet Fetcher
  const fetchAIDiet = async () => {
    setLoading(true);
    try {
      const prompt = "Suggest 10 highly nutritious, affordable food items for a pregnant woman in Bangladesh based on current seasonal availability. Include estimated market price in BDT. Return a raw JSON array with keys: 'name', 'price', 'benefit'. Do not include markdown formatting.";
      const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: prompt }) });
      const data = await res.json();
      const jsonMatch = data.reply.match(/\[[\s\S]*\]/);
      const cleanJson = jsonMatch ? jsonMatch[0] : "[]";
      setDietPlan(JSON.parse(cleanJson));
    } catch (e) {
      setDietPlan([{ name: "Spinach (Palong)", price: "20৳", benefit: "Iron" }, { name: "Lentils", price: "110৳", benefit: "Protein" }]);
    }
    setLoading(false);
  };

  const saveMood = async (m: string) => {
    setMood(m);
    await addDoc(collection(db, "users", user.uid, "mood_logs"), { mood: m, timestamp: Date.now() });
  };

  // --- SUB-VIEWS ---
  if (view === 'diet') {
    return (
      <div className="space-y-4 animate-in slide-in-from-right-5">
        <button onClick={() => setView('hub')} className="flex items-center gap-2 font-bold mb-2 opacity-60"><ArrowLeft size={16}/> {t[lang].back}</button>
        <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg text-white">
           <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><Zap size={18}/> {t[lang].ai_diet_title}</h2>
           <button onClick={fetchAIDiet} disabled={loading} className="bg-white text-emerald-700 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 mt-4">
              {loading ? <RefreshCw className="animate-spin" size={14}/> : <RefreshCw size={14}/>} {t[lang].scan_market}
           </button>
        </div>
        <div className="space-y-3">
          {dietPlan.map((p, i) => (
            <div key={i} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-start mb-2"><h4 className="font-bold">{p.name}</h4><span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">{p.benefit}</span></div>
              <p className="text-sm font-mono text-emerald-600 font-bold">{t[lang].est_price}: {p.price}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'exercise') {
    return (
      <div className="space-y-4 animate-in slide-in-from-right-5">
        <button onClick={() => setView('hub')} className="flex items-center gap-2 font-bold mb-2 opacity-60"><ArrowLeft size={16}/> {t[lang].back}</button>
        <h2 className="font-bold text-lg">{t[lang].exercise_title}</h2>
        {["Prenatal Yoga - 10 min", "Pelvic Floor (Kegel)", "Walking - 20 min"].map((ex,i) => (
           <div key={i} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><h4 className="font-bold">{ex}</h4><p className="text-xs opacity-60">Safe for Trimester 2</p></div>
        ))}
      </div>
    );
  }

  if (view === 'danger') {
    return (
      <div className="space-y-4 animate-in slide-in-from-right-5">
        <button onClick={() => setView('hub')} className="flex items-center gap-2 font-bold mb-2 opacity-60"><ArrowLeft size={16}/> {t[lang].back}</button>
        <h2 className="font-bold text-lg text-red-500">{t[lang].danger_title}</h2>
        {["Severe Headache", "Blurred Vision", "Vaginal Bleeding", "Reduced Baby Movement"].map((s,i) => (
           <div key={i} className={`p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-bold flex items-center gap-3`}>
              <AlertTriangle size={20}/> {s}
           </div>
        ))}
        <button className="w-full bg-red-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg">{t[lang].call_ambulance}</button>
      </div>
    );
  }

  // --- MAIN HUB VIEW ---
  return (
    <div className="space-y-4 animate-in slide-in-from-right-5">
       <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
         <h2 className="font-bold mb-3 flex items-center gap-2"><Heart size={18} className="text-rose-500"/> {t[lang].how_feeling}</h2>
         <div className="flex justify-between gap-2">
            {['happy', 'neutral', 'sad', 'anxious'].map((m) => (
              <button key={m} onClick={() => saveMood(m)} className={`flex-1 py-3 rounded-xl text-2xl transition-all ${mood === m ? 'bg-rose-100 scale-110' : 'bg-slate-50 dark:bg-slate-800'}`}>
                 {m === 'happy' && '😊'}{m === 'neutral' && '😐'}{m === 'sad' && '😔'}{m === 'anxious' && '😰'}
              </button>
            ))}
         </div>
       </div>

       <div className={`p-4 rounded-xl border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100`}>
         <h2 className="font-bold mb-2 flex items-center gap-2 text-indigo-700 dark:text-indigo-300"><Music size={18}/> {t[lang].relax}</h2>
         <div className="flex gap-2">
            <button className="flex-1 bg-white dark:bg-slate-800 py-3 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2"><PlayCircle size={16}/> {t[lang].start_audio}</button>
            <button className="flex-1 bg-white dark:bg-slate-800 py-3 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2"><Activity size={16}/> {t[lang].breathe}</button>
         </div>
       </div>

       <h3 className="font-bold text-lg mt-4">{t[lang].learn_hub}</h3>
       <div className="grid grid-cols-2 gap-3">
          <div className={cardClass} onClick={() => { setView('diet'); fetchAIDiet(); }}>
             <BookOpen className="text-orange-500 mb-2"/><h4 className="font-bold text-sm">{t[lang].diet_plan}</h4><p className="text-[10px] opacity-60">AI Powered</p>
          </div>
          <div className={cardClass} onClick={() => setView('exercise')}>
             <Activity className="text-blue-500 mb-2"/><h4 className="font-bold text-sm">{t[lang].exercises}</h4><p className="text-[10px] opacity-60">{t[lang].safe_yoga}</p>
          </div>
          <div className={cardClass} onClick={() => setView('danger')}>
             <AlertOctagon className="text-red-500 mb-2"/><h4 className="font-bold text-sm">{t[lang].danger_signs}</h4><p className="text-[10px] opacity-60">{t[lang].call_doc}</p>
          </div>
          <div className={cardClass}>
             <Baby className="text-pink-500 mb-2"/><h4 className="font-bold text-sm">{t[lang].newborn_care}</h4><p className="text-[10px] opacity-60">{t[lang].bath_feed}</p>
          </div>
       </div>
    </div>
  );
}

// =========================================================================
// 💬 CARE TAB (UPDATED: Advanced Doctor + AI Flow)
// =========================================================================
function CareTab({ user, darkMode, lang, userData }: { user: any; darkMode: boolean; lang: Lang; userData: any }) {
  // Navigation State
  const [view, setView] = useState<'menu' | 'doctor_list' | 'chat' | 'appointments' | 'rx'>('menu');
   
  // Chat State
  const [mode, setMode] = useState<ChatMode>("ai"); 
  const [messages, setMessages] = useState<any[]>([]); 
  const [input, setInput] = useState("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const bottomRef = useRef<any>(null);
   
  // Appointment & Prescription State
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookReason, setBookReason] = useState("");
  const [bookDate, setBookDate] = useState("");

  // 1. Fetch Available Doctors (Role = doctor)
  useEffect(() => {
    if (view === 'doctor_list') {
      const q = query(collection(db, "users"), where("role", "==", "doctor"));
      getDocs(q).then(snap => setDoctors(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [view]);

  // 2. Real-time Listeners (Chat, Appointments, Prescriptions)
 // 2. Real-time Listeners (Chat, Appointments, Prescriptions)
  useEffect(() => {
    // Chat Listener
    if (view === 'chat') { 
      if (selectedDoc) {
        // CASE A: DOCTOR CHAT -> Listen to Firebase History
        const chatRef = ref(rtdb, `chats/${user.uid}`);
        return onValue(chatRef, (snap) => {
          const data = snap.val();
          if (data) { 
            setMessages(Object.values(data)); 
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); 
          }
        });
      } else {
        // CASE B: AI CHAT -> Clear History (Start Fresh)
        setMessages([]);
      }
    }

    // Appointments Listener
    if (view === 'appointments') {
      const q = query(collection(db, "appointments"), where("patientId", "==", user.uid), orderBy("timestamp", "desc"));
      const unsub = onSnapshot(q, (snap) => setAppointments(snap.docs.map(d => ({id: d.id, ...d.data()}))));
      return () => unsub();
    }

    // Prescriptions Listener
    if (view === 'rx') {
      const q = query(collection(db, "users", user.uid, "prescriptions"), orderBy("timestamp", "desc"));
      getDocs(q).then(snap => setPrescriptions(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [view, user.uid, selectedDoc]); // <--- IMPORTANT: Added selectedDoc to dependencies

  // 3. Send Message Logic (AI vs Doctor)
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input, timestamp: Date.now() };
    setInput("");
    
    // Safety Check: Alert Doctor if critical words found
    if (["bleeding", "pain", "fainted"].some(w => userMsg.content.includes(w))) {
       await push(ref(rtdb, 'doctor_alerts'), { 
         type: 'CRITICAL_AI_FLAG', 
         patientId: user.uid, 
         patientName: user.displayName, 
         message: userMsg.content, 
         timestamp: Date.now() 
       });
       alert("Doctor notified of emergency symptoms.");
    }
    
    if (selectedDoc) {
       // Send to Realtime DB for Doctor
       await push(ref(rtdb, `chats/${user.uid}`), userMsg);
    } else {
       // Simulate AI Response
       setMessages(prev => [...prev, userMsg]);
       try {
        const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: userMsg.content }) });
        const data = await res.json();
        setMessages(prev => [...prev, { role: "ai", content: data.reply, timestamp: Date.now() }]);
       } catch (e) {
        setMessages(prev => [...prev, { role: "ai", content: "AI is offline. Please select a doctor.", timestamp: Date.now() }]);
       }
    }
  };

  // 4. Book Appointment Logic
  const handleBookAppointment = async () => {
    if(!bookDate || !bookReason) return;
    await addDoc(collection(db, "appointments"), {
      patientId: user.uid, 
      patientName: user.displayName, 
      date: bookDate, 
      reason: bookReason, 
      status: 'pending', 
      timestamp: Date.now()
    });
    setIsBooking(false); 
    setBookDate(""); 
    setBookReason(""); 
    alert("Appointment Request Sent to Doctor!");
  };

  // --- RENDER VIEWS ---

  // A. Main Care Menu
  if (view === 'menu') return (
      <div className="space-y-4 animate-in slide-in-from-right-5 mt-4">
         <button onClick={() => setView('doctor_list')} className={`w-full p-6 rounded-2xl flex items-center gap-4 shadow-lg ${darkMode ? 'bg-indigo-900/50' : 'bg-indigo-50 border border-indigo-100'}`}>
            <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-white"><UserPlus size={24}/></div>
            <div className="text-left"><h3 className="font-bold text-lg">{t[lang].select_doc}</h3><p className="text-xs opacity-60">{t[lang].available_docs}</p></div>
         </button>
         <button onClick={() => setView('appointments')} className={`w-full p-6 rounded-2xl flex items-center gap-4 shadow-lg ${darkMode ? 'bg-emerald-900/50' : 'bg-emerald-50 border border-emerald-100'}`}>
            <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white"><Calendar size={24}/></div>
            <div className="text-left"><h3 className="font-bold text-lg">{t[lang].my_appt}</h3><p className="text-xs opacity-60">Book & Track Status</p></div>
         </button>
         <button onClick={() => setView('rx')} className={`w-full p-6 rounded-2xl flex items-center gap-4 shadow-lg ${darkMode ? 'bg-blue-900/50' : 'bg-blue-50 border border-blue-100'}`}>
            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white"><FileCheck size={24}/></div>
            <div className="text-left"><h3 className="font-bold text-lg">{t[lang].prescriptions}</h3><p className="text-xs opacity-60">{t[lang].view_rx}</p></div>
         </button>
         <button onClick={() => { setSelectedDoc(null); setView('chat'); }} className={`w-full p-6 rounded-2xl flex items-center gap-4 shadow-lg opacity-60 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div className="h-12 w-12 rounded-full bg-slate-500 flex items-center justify-center text-white"><Smartphone size={24}/></div>
            <div className="text-left"><h3 className="font-bold text-lg">AI Assistant</h3><p className="text-xs opacity-60">Quick Medical Help</p></div>
         </button>
      </div>
  );

  // B. Doctor List View
  if (view === 'doctor_list') return (
      <div className="space-y-4 animate-in slide-in-from-right-5">
         <button onClick={() => setView('menu')} className="flex items-center gap-2 font-bold opacity-60 mb-4"><ArrowLeft size={16}/> {t[lang].back}</button>
         <h2 className="font-bold text-lg">{t[lang].available_docs}</h2>
         <div className="space-y-3">
            {doctors.length === 0 && <p className="text-center opacity-50 text-xs py-10">{t[lang].no_docs}</p>}
            {doctors.map(doc => (
               <div key={doc.id} onClick={() => { setSelectedDoc(doc); setView('chat'); }} className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer hover:border-emerald-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">{doc.name?.[0]}</div>
                  <div><h3 className="font-bold">{doc.name}</h3><p className="text-xs opacity-60">{t[lang].doc_speciality || 'Medical Officer'}</p></div>
                  <div className="ml-auto bg-green-500 h-2 w-2 rounded-full"></div>
               </div>
            ))}
         </div>
      </div>
  );

  // C. Appointments View
  if (view === 'appointments') return (
    <div className="space-y-4 animate-in slide-in-from-right-5">
       <div className="flex justify-between items-center">
         <button onClick={() => setView('menu')} className="flex items-center gap-2 font-bold opacity-60"><ArrowLeft size={16}/> {t[lang].back}</button>
         <button onClick={() => setIsBooking(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Plus size={14}/> {t[lang].book_new}</button>
       </div>
       <h2 className="font-bold text-lg">{t[lang].my_appt}</h2>
       {isBooking && (
         <div className={`p-4 rounded-xl border animate-in fade-in ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="font-bold text-sm mb-3">Request Appointment</h3>
            <input type="date" className="w-full p-2 mb-2 rounded border text-sm dark:bg-slate-900" value={bookDate} onChange={e=>setBookDate(e.target.value)} />
            <input className="w-full p-2 mb-2 rounded border text-sm dark:bg-slate-900" placeholder="Reason (e.g. Headache)" value={bookReason} onChange={e=>setBookReason(e.target.value)} />
            <div className="flex gap-2">
               <button onClick={handleBookAppointment} className="flex-1 bg-emerald-600 text-white py-2 rounded text-xs font-bold">Submit</button>
               <button onClick={()=>setIsBooking(false)} className="px-4 py-2 border rounded text-xs">Cancel</button>
            </div>
         </div>
       )}
       <div className="space-y-3">
         {appointments.map(appt => (
           <div key={appt.id} className={`p-4 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div>
                 <div className="flex items-center gap-2"><Calendar size={14} className="opacity-50"/><span className="font-bold text-sm">{new Date(appt.date).toLocaleDateString()}</span></div>
                 <p className="text-xs opacity-60 mt-1">{appt.reason}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded ${appt.status==='confirmed'?'bg-emerald-100 text-emerald-600':appt.status==='rejected'?'bg-red-100 text-red-600':'bg-yellow-100 text-yellow-600'}`}>{appt.status.toUpperCase()}</span>
           </div>
         ))}
       </div>
    </div>
  );

  // D. Prescription View
  if (view === 'rx') return (
    <div className="space-y-4 animate-in slide-in-from-right-5">
       <button onClick={() => setView('menu')} className="flex items-center gap-2 font-bold opacity-60 mb-2"><ArrowLeft size={16}/> {t[lang].back}</button>
       <h2 className="font-bold text-lg mb-4">{t[lang].prescriptions}</h2>
       <div className="space-y-3">
          {prescriptions.length === 0 && <p className="text-center opacity-50 text-xs">No records found.</p>}
          {prescriptions.map((rx, i) => (
             <div key={i} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-emerald-600 flex items-center gap-2"><Pill size={16}/> {rx.medicine}</h3>
                   <span className="text-[10px] opacity-50">{new Date(rx.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                   <div className="p-2 rounded bg-slate-100 dark:bg-slate-800"><span className="opacity-50 block">{t[lang].dosage}</span><b>{rx.dosage}</b></div>
                   <div className="p-2 rounded bg-slate-100 dark:bg-slate-800"><span className="opacity-50 block">{t[lang].doctor_note}</span><b>{rx.doctor || "Dr. On Call"}</b></div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  // E. Chat View (Default for 'chat')
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-2 relative">
      <div className="flex justify-between items-center px-2">
        <button onClick={() => setView('menu')} className="flex items-center gap-2 font-bold opacity-60 text-xs"><ArrowLeft size={14}/> {t[lang].back}</button>
        {selectedDoc ? <span className="text-xs font-bold text-emerald-600">Chatting with {selectedDoc.name}</span> : <span className="text-xs font-bold text-slate-500">AI Assistant</span>}
      </div>

      <div className={`flex-1 rounded-2xl border overflow-hidden relative flex flex-col ${darkMode ? 'bg-[#0b141a] border-slate-800' : 'bg-[#e5ddd5] border-slate-200'}`}>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
           {messages.length === 0 && <p className="text-center mt-10 opacity-40 text-xs">Start messaging...</p>}
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
               <div className={`max-w-[80%] p-2 px-3 text-sm rounded-lg shadow-sm ${m.role==='user'?(darkMode?'bg-[#005c4b] text-white':'bg-[#d9fdd3] text-slate-900'):(darkMode?'bg-[#202c33] text-white':'bg-white text-slate-900')}`}>{m.content}</div>
             </div>
           ))}
           <div ref={bottomRef} />
        </div>
        <div className={`p-2 flex gap-2 items-center shrink-0 ${darkMode ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
          <div className={`flex-1 rounded-full px-4 py-2 flex items-center ${darkMode ? 'bg-[#2a3942]' : 'bg-white'}`}>
            <input className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white" placeholder={t[lang].type_msg} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}/>
          </div>
          <button onClick={sendMessage} className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm"><Send size={18}/></button>
        </div>
      </div>
    </div>
  );
}

// ... (CommunityTab remains unchanged) ...
function CommunityTab({ user, darkMode, lang }: { user: any, darkMode: boolean, lang: Lang }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  useEffect(() => {
    const q = query(collection(db, "community_posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);
  const handlePost = async () => {
    if (!newPost.title) return;
    await addDoc(collection(db, "community_posts"), { title: newPost.title, content: newPost.content, author: user.displayName, authorId: user.uid, createdAt: new Date().toISOString(), likes: 0 });
    setIsCreating(false); setNewPost({ title: "", content: "" });
  };
  const handleDelete = async (id: string) => { if (confirm(t[lang].delete_confirm)) await deleteDoc(doc(db, "community_posts", id)); };
  const cardClass = `p-5 rounded-2xl shadow-sm border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="text-lg font-black">{t[lang].forum_title}</h2><button onClick={() => setIsCreating(!isCreating)} className="bg-rose-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-md hover:bg-rose-600">{isCreating ? t[lang].cancel : t[lang].new_post}</button></div>
      {isCreating && (
        <div className={`${cardClass} animate-in fade-in`}>
           <input className={`w-full mb-2 p-2 border rounded-lg text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} placeholder="Title" value={newPost.title} onChange={e=>setNewPost({...newPost, title: e.target.value})} />
           <textarea className={`w-full mb-2 p-2 border rounded-lg text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} rows={3} placeholder={t[lang].share_exp} value={newPost.content} onChange={e=>setNewPost({...newPost, content: e.target.value})} />
           <button onClick={handlePost} className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-bold">{t[lang].post_now}</button>
        </div>
      )}
      <div className="space-y-3">{posts.map((p) => (<div key={p.id} className={`${cardClass} relative`}><h3 className="font-bold text-sm mb-1">{p.title}</h3><p className="text-sm opacity-80 mb-3">{p.content}</p><div className="text-xs opacity-50 flex justify-between items-center"><span>@{p.author}</span>{p.authorId === user.uid && <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>}</div></div>))}</div>
    </div>
  );
}

function ProfileTab({ user, userData, logout, darkMode, setDarkMode, toggleTheme, appStage, setAppStage, lang }: { user: any; userData: any; logout: () => void; darkMode: boolean; setDarkMode: any; toggleTheme: () => void; appStage: AppStage; setAppStage: any; lang: Lang; }) {
  const [view, setView] = useState('main');
  const [history, setHistory] = useState<any[]>([]);
  const [newReminder, setNewReminder] = useState({ title: "", time: "08:00", type: "med" });
  const [reminders, setReminders] = useState<any[]>([]);
  const [lmp, setLmp] = useState(userData?.lmp || "");
  const [vitals, setVitals] = useState({ bp: "", weight: "", sugar: "" });
  const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "" });
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (view === 'history') { const q = query(collection(db, "users", user.uid, "chat_history"), orderBy("timestamp", "desc")); getDocs(q).then(snap => setHistory(snap.docs.map(d => d.data()))); }
    if (view === 'reminders') { const q = query(collection(db, "users", user.uid, "reminders")); onSnapshot(q, (snap) => setReminders(snap.docs.map(d => ({id:d.id, ...d.data()})))); }
    if (view === 'contacts') { const q = query(collection(db, "users", user.uid, "contacts")); onSnapshot(q, (snap) => setContacts(snap.docs.map(d => ({id:d.id, ...d.data()})))); }
  }, [view, user.uid]);

  const saveReminder = async () => { if(!newReminder.title) return; await addDoc(collection(db, "users", user.uid, "reminders"), newReminder); setNewReminder({ title: "", time: "", type: "med" }); };
  const deleteReminder = async (id: string) => await deleteDoc(doc(db, "users", user.uid, "reminders", id));
  
  const saveContact = async () => { if(!newContact.name) return; await addDoc(collection(db, "users", user.uid, "contacts"), newContact); setNewContact({ name: "", phone: "", relation: "" }); };
  const deleteContact = async (id: string) => await deleteDoc(doc(db, "users", user.uid, "contacts", id));

  const saveProfile = async () => { let week = 1; if(lmp) { const start = new Date(lmp); week = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)); } await updateDoc(doc(db, "users", user.uid), { lmp, gestationWeek: week, stage: appStage }); alert("Profile Updated!"); setView('main'); };
  const saveVitals = async () => { await addDoc(collection(db, "users", user.uid, "health_logs"), { ...vitals, timestamp: Date.now() }); alert("Vitals Logged!"); setView('main'); };
  const SettingRow = ({ icon: Icon, label, color, onClick, toggle }: any) => (<button onClick={onClick} className={`w-full p-4 flex justify-between items-center border-b last:border-0 hover:opacity-80 ${darkMode ? 'border-slate-800 hover:bg-slate-900' : 'border-slate-50 hover:bg-slate-50'}`}><span className="text-sm font-bold flex items-center gap-3"><Icon size={18} className={color}/> {label}</span>{toggle ? (<div className={`w-10 h-5 rounded-full flex items-center p-1 ${darkMode ? 'bg-rose-500 justify-end' : 'bg-slate-300 justify-start'}`}><div className="w-3 h-3 bg-white rounded-full shadow-sm"></div></div>) : <ChevronRight size={16} className="opacity-50"/>}</button>);

  if (view === 'contacts') return (
    <div className="space-y-4 animate-in slide-in-from-right-5">
       <button onClick={() => setView('main')} className="flex items-center gap-2 font-bold mb-4 opacity-60"><ArrowLeft size={18}/> {t[lang].back}</button>
       <h2 className="font-bold text-lg">{t[lang].contacts}</h2>
       <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <input className={`w-full mb-2 p-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} placeholder={t[lang].name} value={newContact.name} onChange={e=>setNewContact({...newContact, name: e.target.value})} />
          <input className={`w-full mb-2 p-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} placeholder={t[lang].phone} value={newContact.phone} onChange={e=>setNewContact({...newContact, phone: e.target.value})} />
          <input className={`w-full mb-2 p-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} placeholder={t[lang].relation} value={newContact.relation} onChange={e=>setNewContact({...newContact, relation: e.target.value})} />
          <button onClick={saveContact} className="w-full bg-rose-500 text-white py-2 rounded-lg text-xs font-bold">{t[lang].add_contact}</button>
       </div>
       <div className="space-y-2">{contacts.map(c => (<div key={c.id} className={`flex justify-between items-center p-3 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><div><p className="font-bold text-sm">{c.name}</p><p className="text-xs opacity-50">{c.relation} • {c.phone}</p></div><button onClick={() => deleteContact(c.id)} className="text-red-400"><Trash2 size={16}/></button></div>))}</div>
    </div>
  );

  if (view === 'history') return (<div className="space-y-4 animate-in slide-in-from-right-5"><button onClick={() => setView('main')} className="flex items-center gap-2 font-bold mb-4 opacity-60"><ArrowLeft size={18}/> {t[lang].back_settings}</button><h2 className="font-bold text-lg mb-2">{t[lang].chat_archive}</h2><div className="space-y-2">{history.map((h, i) => (<div key={i} className={`p-3 rounded-xl border text-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>{h.image && <span className="text-xs bg-slate-200 px-1 rounded mr-2">IMAGE</span>}<span>{h.content}</span><p className="text-[10px] opacity-40 mt-1">{new Date(h.timestamp).toLocaleString()}</p></div>))}</div></div>);
  if (view === 'reminders') return (<div className="space-y-4 animate-in slide-in-from-right-5"><button onClick={() => setView('main')} className="flex items-center gap-2 font-bold mb-4 opacity-60"><ArrowLeft size={18}/> {t[lang].back}</button><h2 className="font-bold text-lg">{t[lang].set_reminders}</h2><div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><h3 className="text-sm font-bold mb-2">{t[lang].add_new}</h3><input className={`w-full mb-2 p-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} placeholder={t[lang].title_ex} value={newReminder.title} onChange={e=>setNewReminder({...newReminder, title: e.target.value})} /><div className="flex gap-2 mb-2"><input type="time" className={`p-2 rounded border text-sm flex-1 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={newReminder.time} onChange={e=>setNewReminder({...newReminder, time: e.target.value})} /><select className={`p-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={newReminder.type} onChange={e=>setNewReminder({...newReminder, type: e.target.value})}><option value="med">{t[lang].medicine}</option><option value="water">{t[lang].water}</option><option value="appt">{t[lang].doctor}</option><option value="food">{t[lang].food}</option></select></div><button onClick={saveReminder} className="w-full bg-rose-500 text-white py-2 rounded-lg text-xs font-bold">{t[lang].add_reminder}</button></div><div className="space-y-2">{reminders.map(r => (<div key={r.id} className={`flex justify-between items-center p-3 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><div><p className="font-bold text-sm">{r.title}</p><p className="text-xs opacity-50 capitalize">{r.type} • {r.time}</p></div><button onClick={() => deleteReminder(r.id)} className="text-red-400"><Trash2 size={16}/></button></div>))}</div></div>);
  if (view === 'edit_profile') return (<div className="space-y-4 animate-in slide-in-from-right-5"><button onClick={() => setView('main')} className="flex items-center gap-2 font-bold mb-4 opacity-60"><ArrowLeft size={18}/> {t[lang].back}</button><h2 className="font-bold text-lg">{t[lang].edit_profile}</h2><div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><label className="text-xs font-bold opacity-60 block mb-2">{t[lang].current_stage}</label><div className="flex gap-2 mb-4"><button onClick={() => setAppStage("pregnancy")} className={`flex-1 py-2 rounded-lg text-xs font-bold ${appStage === 'pregnancy' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{t[lang].pregnancy}</button><button onClick={() => setAppStage("postpartum")} className={`flex-1 py-2 rounded-lg text-xs font-bold ${appStage === 'postpartum' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{t[lang].postpartum}</button></div><label className="text-xs font-bold opacity-60 block mb-2">{t[lang].lmp}</label><input type="date" className={`w-full p-3 rounded border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={lmp} onChange={e=>setLmp(e.target.value)} /><button onClick={saveProfile} className="w-full bg-emerald-600 text-white py-3 rounded-xl mt-4 font-bold">{t[lang].save_changes}</button></div></div>);
  if (view === 'vitals') return (<div className="space-y-4 animate-in slide-in-from-right-5"><button onClick={() => setView('main')} className="flex items-center gap-2 font-bold mb-4 opacity-60"><ArrowLeft size={18}/> {t[lang].back}</button><h2 className="font-bold text-lg">{t[lang].log_vitals_title}</h2><div className={`p-4 rounded-xl border space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><input placeholder={t[lang].bp} className={`w-full p-3 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={vitals.bp} onChange={e=>setVitals({...vitals, bp: e.target.value})} /><input placeholder="Weight (kg)" type="number" className={`w-full p-3 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={vitals.weight} onChange={e=>setVitals({...vitals, weight: e.target.value})} /><input placeholder={t[lang].sugar} type="number" className={`w-full p-3 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} value={vitals.sugar} onChange={e=>setVitals({...vitals, sugar: e.target.value})} /><button onClick={saveVitals} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold">{t[lang].save_log}</button></div></div>);

  return (
    <div className="space-y-5 animate-in slide-in-from-right-5">
       <div className={`p-6 rounded-3xl shadow-sm border text-center relative overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><div className="h-20 w-20 bg-gradient-to-tr from-rose-400 to-orange-400 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-lg">{user.displayName?.[0]}</div><h2 className="font-bold text-lg">{user.displayName}</h2><p className="text-sm opacity-60">{user.email}</p></div>
       <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <SettingRow icon={darkMode ? Sun : Moon} label={t[lang].dark_mode} color={darkMode ? "text-yellow-400" : "text-slate-500"} onClick={toggleTheme} toggle={true} />
          <SettingRow icon={Edit} label={t[lang].preg_details} color="text-emerald-500" onClick={() => setView('edit_profile')} />
          <SettingRow icon={Bell} label={t[lang].reminders} color="text-orange-500" onClick={() => setView('reminders')} />
          <SettingRow icon={Activity} label={t[lang].log_vitals} color="text-red-500" onClick={() => setView('vitals')} />
          <SettingRow icon={Phone} label={t[lang].contacts} color="text-green-500" onClick={() => setView('contacts')} />
          <SettingRow icon={History} label={t[lang].chat_history} color="text-blue-500" onClick={() => setView('history')} />
          <button onClick={logout} className="w-full p-4 flex justify-between items-center hover:bg-red-500/10 text-red-500 border-t border-slate-50 dark:border-slate-800"><span className="text-sm font-bold flex items-center gap-3"><LogOut size={18}/> {t[lang].sign_out}</span></button>
       </div>
    </div>
  );
}

function NavIcon({ icon: Icon, label, active, onClick, darkMode }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 w-16 transition-all active:scale-95">
      <Icon size={24} className={active ? "text-rose-500" : (darkMode ? "text-slate-600" : "text-slate-300")} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-[10px] font-bold ${active ? "text-rose-500" : (darkMode ? "text-slate-600" : "text-slate-400")}`}>{label}</span>
    </button>
  );
}

const authInput = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all";