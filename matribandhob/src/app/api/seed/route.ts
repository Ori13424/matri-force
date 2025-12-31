import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed"; // Ensure seed.ts is inside src/lib/

export async function GET() {
  try {
    console.log("🚀 Triggering Database Seed...");
    
    // Call the exported function from your seed.ts file
    await seedDatabase();

    return NextResponse.json({ 
      success: true, 
      message: "✅ Database seeded successfully! Patients, Drivers, Donors, and Hospitals are live." 
    });

  } catch (error: any) {
    console.error("❌ Seeding Error:", error);
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}