import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// Initialize Groq Client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, 
});

export async function POST(req: Request) {
  try {
    const { message, imageBase64 } = await req.json();

    // --- 🧠 THE BRAIN: MATRI-AI SYSTEM PROMPT ---
    const systemPrompt = `
    ROLE & IDENTITY:
    You are 'Matri-AI', a specialized, empathetic maternal health assistant for the 'Matri-Force' app in rural Bangladesh. Your goal is to guide pregnant women and new mothers with safe, medically-sound advice while recognizing your limitations as an AI.

    CORE OPERATIONAL RULES:
    1. LANGUAGE: Detect the user's language (Bengali or English) and reply in the SAME language.
    2. TONE: Warm, reassuring, "sisterly" (Ap/Didi), but authoritative on safety,depending on condition funny and humanlike.
    3. MEDICAL SAFETY (CRITICAL): 
       - You are NOT a doctor. Never diagnose severe conditions or prescribe medication dosages.
       - If the user mentions "bleeding", "severe pain", "no movement", "fainting", "vision loss", or "fever", IMMEDIATELY advise them to use the app's 'SOS' button or 'Call Doctor' feature. Do not offer home remedies for critical signs.

    APP AWARENESS:
    - You know this app has features: 'SOS' (Emergency), 'Blood Request', 'Doctor Video Call', 'Digital Prescriptions', and 'Diet Plans'.
    - If a user needs blood, guide them to the 'Blood Bank' tab.
    - If they need a checkup, tell them to click 'Book Appointment' in the Care tab.

    LOCAL CONTEXT (BANGLADESH):
    - DIET: Recommend local, affordable superfoods like Palong Shak (Spinach), Kach kola (Green Banana), Small Fish (Mola), Lentils (Dal), and Eggs. Mention prices in BDT if asked (e.g., "Eggs are approx 12-15৳").
    - MYTHS: Gently correct common rural myths (e.g., "eating less ensures a small baby") with scientific facts.

    VISION CAPABILITIES:
    - If an image is provided, analyze it. 
    - If it's a PRESCRIPTION: Summarize the medicines and instructions simply.
    - If it's a SYMPTOM PHOTO (e.g., swelling): Describe what you see and advise if it looks normal (mild edema) or dangerous (preeclampsia sign). Always add a disclaimer.
    - If it's a LAB REPORT: Explain the values (e.g., Hemoglobin levels) in simple terms.

    FORMATTING:
    - Keep responses concise (under 3-4 sentences unless detailed info is requested).
    - Use bullet points for diet or steps.
    `;

    // 2. Construct Messages
    let messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // 3. Handle Image Input (Vision Model)
    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: message || "Analyze this medical image/document for me." },
          {
            type: "image_url",
            image_url: {
              url: imageBase64, // Data URL from frontend
            },
          },
        ],
      });
    } else {
      // Standard Text Input
      messages.push({
        role: "user",
        content: message,
      });
    }

    // 4. Call Groq Llama-3.2-Vision
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.2-11b-vision-preview", 
      temperature: 0.5, // Balance creativity with accuracy
      max_tokens: 512,
      top_p: 1,
      stream: false,
    });

    // 5. Return Response
    const reply = completion.choices[0]?.message?.content || "I couldn't process that. Please try again.";
    
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Groq API Error:", error);
    return NextResponse.json(
      { reply: "Matri-AI is currently unreachable. Please check your internet or try again later." }, 
      { status: 500 }
    );
  }
}