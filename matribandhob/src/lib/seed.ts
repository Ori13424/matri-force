import { db, rtdb } from "./firebase";
import { ref, set } from "firebase/database";
import { collection, doc, writeBatch, GeoPoint, Timestamp } from "firebase/firestore";

export const seedDatabase = async () => {
  console.log("🌱 Starting Matri-Force Full Database Seeding...");

  // ======================================================
  // 1. PREPARE DATASETS
  // ======================================================

  // A. Mother's Location (Center: Dhanmondi 32, Dhaka)
  const motherLocation = {
    lat: 23.7461,
    lng: 90.3742,
    address: "Dhanmondi 32, Dhaka",
    updated_at: Date.now()
  };

  // B. ACTIVE PATIENTS (SOS ALERTS) - Added 10 Patients
  const activePatients = [
    { id: "patient_amen_01", lat: 23.7465, lng: 90.3745, status: "RED", timestamp: Date.now() - 100000, assignedDriver: null }, // Near User
    { id: "patient_fatima_02", lat: 23.7510, lng: 90.3790, status: "RED", timestamp: Date.now() - 500000, assignedDriver: null }, // Panthapath
    { id: "patient_nusrat_03", lat: 23.7390, lng: 90.3720, status: "RED", timestamp: Date.now() - 200000, assignedDriver: null }, // Lalmatia
    { id: "patient_rokeya_04", lat: 23.7350, lng: 90.3850, status: "DISPATCHED", timestamp: Date.now() - 900000, assignedDriver: "driver_02" }, // Science Lab (Mission Active)
    { id: "patient_sumaiya_05", lat: 23.7550, lng: 90.3650, status: "RED", timestamp: Date.now() - 120000, assignedDriver: null }, // Satmasjid Road
    { id: "patient_jorina_06", lat: 23.7420, lng: 90.3820, status: "RED", timestamp: Date.now() - 60000, assignedDriver: null }, // Green Road
    { id: "patient_bilkis_07", lat: 23.7250, lng: 90.3900, status: "RED", timestamp: Date.now() - 300000, assignedDriver: null }, // New Market
    { id: "patient_tania_08", lat: 23.7600, lng: 90.3700, status: "DISPATCHED", timestamp: Date.now() - 1500000, assignedDriver: "driver_04" }, // Shyamoli (Mission Active)
    { id: "patient_kulsum_09", lat: 23.7480, lng: 90.3600, status: "RED", timestamp: Date.now() - 400000, assignedDriver: null }, // Jigatola
    { id: "patient_salma_10", lat: 23.7300, lng: 90.4000, status: "RED", timestamp: Date.now() - 80000, assignedDriver: null }  // Shahbag
  ];

  // C. Drivers Data (5 Profiles)
  const driversList = [
    { id: "driver_01", name: "Rahim Uddin", type: "CNG", phone: "+8801711223344", status: "online", lat: 23.7500, lng: 90.3750, rating: 4.8 },
    { id: "driver_02", name: "Karim Mia", type: "Ambulance", phone: "+8801811223344", status: "busy", lat: 23.7400, lng: 90.3700, rating: 4.9 }, // Busy with Rokeya
    { id: "driver_03", name: "Sujon Ahmed", type: "EasyBike", phone: "+8801911223344", status: "online", lat: 23.7461, lng: 90.3800, rating: 4.5 },
    { id: "driver_04", name: "Bilal Hossain", type: "Ambulance", phone: "+8801611223344", status: "busy", lat: 23.7550, lng: 90.3650, rating: 5.0 }, // Busy with Tania
    { id: "driver_05", name: "Rafiqul Islam", type: "CNG", phone: "+8801511223344", status: "offline", lat: 23.7350, lng: 90.3850, rating: 4.2 }
  ];

  // D. Donors Data (10 Profiles)
  const bloodGroups = ["O+", "AB-", "B+", "A+", "O-", "B-", "A-", "AB+", "O+", "B+"];
  const donorsList = bloodGroups.map((bg, index) => {
    const latOffset = (Math.random() - 0.5) * 0.05; 
    const lngOffset = (Math.random() - 0.5) * 0.05;
    
    return {
      id: `donor_${index + 1}`,
      name: `Donor User ${index + 1}`,
      bloodGroup: bg,
      phone: `+88017${Math.floor(10000000 + Math.random() * 90000000)}`,
      lat: 23.7461 + latOffset,
      lng: 90.3742 + lngOffset,
      lastDonatedDate: index % 3 === 0 ? new Date("2025-01-01") : new Date("2024-10-01"),
      isAvailable: true
    };
  });

  // E. Community Posts
  const postsList = [
    { id: "post_01", title: "Best iron tablets brand?", category: "Nutrition", content: "Doctor suggested Folison, is it good?", author: "Fatima Begum", likes: 12 },
    { id: "post_02", title: "Ultrasound cost in Square Hospital?", category: "Checkups", content: "Does anyone know the current price for 4D scan?", author: "Nusrat Jahan", likes: 5 },
    { id: "post_03", title: "Warning signs for pre-eclampsia", category: "Health", content: "My feet are very swollen, should I worry?", author: "Anonymous", likes: 34 },
    { id: "post_04", title: "Looking for O- blood in Uttara", category: "Emergency", content: "Urgent need for C-section tomorrow.", author: "Tanvir Hasan", likes: 89 },
    { id: "post_05", title: "Post-partum diet tips", category: "Nutrition", content: "What to eat to increase milk supply?", author: "Ayesha Siddiqua", likes: 21 }
  ];

  // F. Hospitals
  const hospitalsList = [
    { id: 'h1', name: 'Dhaka Medical College', lat: 23.7250, lng: 90.3970, beds: 12, icu: 0, phone: "+880255165088" },
    { id: 'h2', name: 'Square Hospital', lat: 23.7530, lng: 90.3770, beds: 45, icu: 3, phone: "10616" },
    { id: 'h3', name: 'Evercare Hospital', lat: 23.8103, lng: 90.4125, beds: 22, icu: 5, phone: "10678" },
  ];

  try {
    // ======================================================
    // 2. SEED REALTIME DATABASE (RTDB)
    // ======================================================
    console.log("🔴 Seeding Realtime Database (Live Data)...");

    const rtdbData = {
      user_location: motherLocation,
      // Create SOS Alerts Map
      sos_alerts: activePatients.reduce((acc, p) => ({...acc, [p.id]: p }), {}),
      // Create Drivers Map
      drivers: driversList.reduce((acc, d) => ({...acc, [d.id]: { ...d, last_updated: Date.now() }}), {}),
      // Create Donors Map
      donors: donorsList.reduce((acc, d) => ({...acc, [d.id]: { ...d, lastDonated: d.lastDonatedDate.toISOString() }}), {}),
      // Create Community Map
      community_posts: postsList.reduce((acc, p) => ({...acc, [p.id]: { ...p, timestamp: Date.now() }}), {}),
      // Create Hospital Map
      hospitals: hospitalsList.reduce((acc, h) => ({...acc, [h.id]: { ...h, last_updated: Date.now() }}), {}),
      
      chats: {}
    };

    await set(ref(rtdb, "/"), rtdbData);
    console.log("✅ RTDB Populated with 10 Patients!");

    // ======================================================
    // 3. SEED CLOUD FIRESTORE (Queryable Data)
    // ======================================================
    console.log("🟠 Seeding Firestore (Query Data)...");
    const batch = writeBatch(db);

    // Seed Drivers
    driversList.forEach((d) => {
      const docRef = doc(collection(db, "drivers"), d.id);
      batch.set(docRef, {
        name: d.name, type: d.type, phone: d.phone, rating: d.rating, status: d.status,
        joinedAt: Timestamp.now(), location: new GeoPoint(d.lat, d.lng)
      });
    });

    // Seed Donors
    donorsList.forEach((d) => {
      const docRef = doc(collection(db, "donors"), d.id);
      batch.set(docRef, {
        name: d.name, bloodGroup: d.bloodGroup, phone: d.phone, isAvailable: d.isAvailable,
        lastDonated: Timestamp.fromDate(d.lastDonatedDate), location: new GeoPoint(d.lat, d.lng)
      });
    });

    // Seed Posts
    postsList.forEach((p) => {
      const docRef = doc(collection(db, "community_posts"), p.id);
      batch.set(docRef, {
        title: p.title, content: p.content, category: p.category, author: p.author,
        likes: p.likes, createdAt: Timestamp.now(), commentsCount: Math.floor(Math.random() * 10)
      });
    });

    // Seed Hospitals
    hospitalsList.forEach((h) => {
      const docRef = doc(collection(db, "hospitals"), h.id);
      batch.set(docRef, {
        name: h.name, beds: h.beds, icu: h.icu, phone: h.phone,
        location: new GeoPoint(h.lat, h.lng), updatedAt: Timestamp.now()
      });
    });

    await batch.commit();
    console.log("✅ Firestore Populated!");

    console.log("🎉 SUCCESS: Matri-Force Environment Reset with 10 Active Patients.");
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    throw error;
  }
};