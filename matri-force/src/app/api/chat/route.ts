import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy_key", 
});

export async function POST(req: Request) {
  try {
    const { message, imageBase64 } = await req.json();

    // 1. Validation
    if (!process.env.GROQ_API_KEY) {
      throw new Error("Missing GROQ_API_KEY in .env.local");
    }

    // 2. System Prompt
    const systemPrompt = `
    ROLE: You are 'Matri-AI', a maternal health assistant for rural Bangladesh.
    TONE: Empathetic, concise, and culturally aware.
    SAFETY: You are NOT a doctor. If the user mentions bleeding, severe pain, or vision loss, advise them to use the SOS button immediately.
    CONTEXT: Recommend local affordable foods (Spinach/Palong, Lentils/Dal, Small fish).
    `;

    let messages: any[] = [{ role: "system", content: systemPrompt }];
    let selectedModel = "llama-3.3-70b-versatile"; // Default stable text model

    // 3. Handle Input Type
    if (imageBase64) {
      // Switch to Vision Model for images
      selectedModel = "llama-3.2-90b-vision-preview"; 
      messages.push({
        role: "user",
        content: [
          { type: "text", text: message || "Analyze this medical image." },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      });
    } else {
      // Standard Text Model
      messages.push({ role: "user", content: message });
    }

    // 4. API Call with Fallback
    try {
      const completion = await groq.chat.completions.create({
        messages: messages,
        model: selectedModel,
        temperature: 0.5,
        max_tokens: 512,
        top_p: 1,
        stream: false,
      });

      const reply = completion.choices[0]?.message?.content || "I couldn't generate a response.";
      return NextResponse.json({ reply });

    } catch (apiError: any) {
      console.error("Groq Model Error:", apiError);
      
      // FALLBACK: If Vision model fails/is deprecated, try basic text model
      if (imageBase64 && apiError.status === 400) {
         return NextResponse.json({ 
           reply: "I am having trouble analyzing images right now due to a system update. However, I can still answer your text questions! How are you feeling?" 
         });
      }
      throw apiError; // Re-throw other errors to be caught below
    }

  } catch (error: any) {
    console.error("Server Error:", error);
    
    // SAFE FALLBACK (Prevents UI Crash)
    let safeReply = "I am focusing on your health. Please consult a doctor for urgent matters.";
    const lowerMsg = (await req.json().catch(() => ({}))).message?.toLowerCase() || "";
    
    if (lowerMsg.includes("bleed") || lowerMsg.includes("pain")) {
      safeReply = "⚠️ WARNING: Severe pain or bleeding can be dangerous. Please press the SOS button or go to a hospital immediately.";
    } else if (lowerMsg.includes("diet")) {
      safeReply = "For a healthy pregnancy, eat Spinach (Iron), Lentils (Protein), and Eggs. Avoid raw foods.";
    }

    return NextResponse.json({ reply: safeReply });
  }
}