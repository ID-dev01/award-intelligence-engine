import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  // 1. Fetch the latest flight from Supabase
  const { data: flight, error } = await supabase
    .from('award_snapshots')
    .select('*')
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !flight) return NextResponse.json({ error: "No flights found" });

  // 2. Set Alert Threshold (e.g., alert if BOM-JFK drops below 90k)
  const TARGET_PRICE = 90000;

  if (flight.miles_required <= TARGET_PRICE) {
    // 3. Send the Email
    await resend.emails.send({
      from: 'AwardEngine <onboarding@resend.dev>',
      to: ['your-email@example.com'], // Put your real email here
      subject: `🚨 ALERT: ${flight.airline} Price Drop!`,
      html: `
        <h2>Rare Deal Found for BOM ⇄ JFK</h2>
        <p>A business class seat is now available for <strong>${flight.miles_required} miles</strong>.</p>
        <p><strong>Program:</strong> ${flight.program}</p>
        <p>This is below your target of ${TARGET_PRICE}.</p>
        <a href="https://award-intelligence-engine-m8l3.vercel.app/">Go to Dashboard to Book</a>
      `
    });

    return NextResponse.json({ status: "Alert Sent!" });
  }

  return NextResponse.json({ status: "Price still high. No alert sent." });
}