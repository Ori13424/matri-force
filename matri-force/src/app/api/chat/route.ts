import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    // 1. Get Message & Image from Frontend
    const { message, imageBase64 } = await req.json();
    
    // 2. Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // 'gemini-1.5-flash' is fast, cheap/free, and handles images well.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Define System Instructions (Persona)
    const systemPrompt = `
      You are 'Matri-Force AI', a compassionate maternal health assistant for rural Bangladesh.
      - 
      - Be empathetic, calm,reassuring,helpful and funny.
      - If the user mentions emergency symptoms (bleeding, severe pain, no movement), reply with "ALERT: RED" at the start.
      - Keep answers short (under 5 sentences) and simple.
    `;

    // 4. Construct the Prompt Parts
    const promptParts: any[] = [systemPrompt, "\nUser Question: " + message];

    // 5. Handle Image (if attached)
    if (imageBase64) {
      // Remove the header prefix (e.g., "data:image/jpeg;base64,") if present
      const base64Data = imageBase64.split(",")[1] || imageBase64;
      
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg", // Assuming JPEG, Gemini is flexible
        },
      });
    }

    // 6. Generate Content
    const result = await model.generateContent(promptParts);
    const response = await result.response;
    const aiReply = response.text();

    console.log("✅ Gemini Reply:", aiReply);

    return NextResponse.json({ 
      success: true, 
      reply: aiReply 
    });

  } catch (error: any) {
    console.error("❌ Gemini API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gemini Error: " + error.message }, 
      { status: 500 }
    );
  }
}