import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const PLANS: Record<string, { priceId: string; name: string }> = {
  growth: {
    priceId: process.env.STRIPE_PRICE_GROWTH ?? "",
    name: "Growth",
  },
  scale: {
    priceId: process.env.STRIPE_PRICE_SCALE ?? "",
    name: "Scale",
  },
};

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to your environment." },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { plan, interval } = await req.json();
  const planKey = plan?.toLowerCase() as keyof typeof PLANS;
  const planConfig = PLANS[planKey];

  if (!planConfig?.priceId) {
    return NextResponse.json(
      { error: `No Stripe price ID configured for plan "${plan}". Set STRIPE_PRICE_${plan?.toUpperCase()} in environment.` },
      { status: 400 }
    );
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email,
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${appUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/upgrade`,
    metadata: {
      user_email: session.user.email,
      plan: planKey,
      interval: interval ?? "monthly",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
