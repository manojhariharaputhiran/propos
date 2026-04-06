import { NextRequest, NextResponse } from "next/server";

// Disable body parsing — Stripe requires the raw body for signature verification
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle relevant events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as { metadata?: Record<string, string>; subscription?: string };
      const { user_email, plan } = session.metadata ?? {};
      // TODO: update your DB — mark org as plan=growth|scale, store subscription ID
      console.log(`Payment complete: ${user_email} subscribed to ${plan}, sub=${session.subscription}`);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as { metadata?: Record<string, string> };
      // TODO: downgrade org back to free
      console.log("Subscription cancelled", sub.metadata);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
