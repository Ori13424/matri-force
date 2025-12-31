Here is a comprehensive and professional `README.md` file for your **Matri-Force** project. You can copy and paste this directly into your GitHub repository.

---

# Matri-Bandhob 👩‍🍼🚑🩺

**The Smart Maternal Health Safety Net for Bangladesh.**

Matri-Bandhob is a unified digital ecosystem designed to bridge the critical gap between expectant mothers, medical professionals, and emergency responders. It leverages real-time geolocation, AI-powered diagnostics, and a synchronized command center to ensure safe pregnancies and rapid emergency response in rural and urban settings.


## 🚀 Features

### 👩‍🍼 **For Patients (Mothers)**

* **Smart Dashboard:** Visual pregnancy timeline (Week-by-week baby size), "Mayer Bank" savings tracker for delivery costs, and daily health logs (Kick counter, Hydration).
* **Emergency Safety Net:** One-tap **SOS** button broadcasting live GPS location to doctors and family. Dedicated **Blood Request** feature.
* **Matri-AI Assistant:** 24/7 Chatbot powered by **Llama-3.2 Vision**. Analyzes symptoms and interprets images of medical reports or prescriptions.
* **Telemedicine:** Book appointments, view digital prescriptions sent by doctors, and access localized diet plans.

### 🩺 **For Doctors (Command Center)**

* **Live Operations Map:** Real-time visualization of all active SOS alerts, ambulance drivers (GPS tracked), and hospital capacities.
* **Patient Management:** Searchable database with risk stratification (High/Low risk). Live feed of patient vitals (BP, Weight trends).
* **Digital Ops:** Integrated Prescription Writer (Rx), Appointment Manager (Accept/Reject), and Fleet Dispatch capability.

### 🚑 **For Drivers (Ambulance Fleet)**

* **Mission Control:** "Uber-style" ride requests for medical emergencies.
* **Live Tracking:** Continuous GPS location broadcasting to the Doctor Console.
* **Workflow:** Simple status updates: *Request Received* → *Accepted* → *Arrived* → *Trip Started* → *Completed*.

---

## 🛠️ Tech Stack

* **Frontend:** [Next.js 14](https://nextjs.org/) (React)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) (Animations)
* **Backend / Database:** [Firebase](https://firebase.google.com/)
* **Authentication:** Role-based security (Patient/Doctor/Driver).
* **Firestore:** Structured data (Profiles, Appointments, Medical History).
* **Realtime Database:** Sub-second latency for Chat, GPS Tracking, and SOS Alerts.


* **AI Engine:** [Groq SDK](https://groq.com/) using **Llama-3.2-90b-vision** and **Llama-3.3-70b**.
* **Maps:** [React Leaflet](https://react-leaflet.js.org/) (OpenStreetMap).

---

## ⚙️ Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v18+)
* NPM or Yarn
* A Firebase Project
* A Groq API Key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/matri-force.git
cd matri-force

```


2. **Install dependencies**
```bash
npm install
# or
yarn install

```


3. **Environment Setup**
Create a `.env.local` file in the root directory and add your keys:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com

# AI Configuration (Groq)
GROQ_API_KEY=gsk_your_groq_api_key

```


4. **Run the Development Server**
```bash
npm run dev

```


Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

---

Or Run directly through Vercel

Open [https://matri-bandhob-git-main-fayem-muktadir-rahmans-projects.vercel.app?_vercel_share=jVvMVWUqrd7mrkFsFRzqzniATgBNdD7S] in your browser.
<img width="320" height="326" alt="image" src="https://github.com/user-attachments/assets/c5ce2a20-3421-4c38-90bf-1428d4b9b28c" />


## 🔐 Role-Based Access Guide

The app enforces strict role-based redirects. To test all features, create three separate accounts:

1. **Patient App:**
* Go to `/patient` (or click "I am a Mother").
* Sign up. (Role is automatically set to `patient`).


2. **Doctor Console:**
* Go to `/doctor`.
* Click "Register Access". (Role is automatically set to `doctor`).


3. **Driver App:**
* Go to `/driver`.
* Click "Register Unit". (Role is automatically set to `driver`).



> **Tip:** Open the Doctor Console in one browser window and the Patient/Driver apps in Incognito windows to test real-time interactions like Chat, SOS, and Tracking simultaneously.


---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.


---

**Built with ❤️ for the MillionX Bangladesh Hackathon 2025.**
