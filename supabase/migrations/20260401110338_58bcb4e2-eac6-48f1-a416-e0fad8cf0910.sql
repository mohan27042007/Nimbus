
-- Create workers table
CREATE TABLE public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  swiggy_id VARCHAR,
  zone VARCHAR,
  pincode VARCHAR,
  city VARCHAR,
  trust_score INTEGER DEFAULT 100,
  earnings_baseline DECIMAL DEFAULT 1000,
  upi_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  tier VARCHAR NOT NULL DEFAULT 'basic',
  weekly_premium DECIMAL NOT NULL,
  max_payout DECIMAL NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  renewal_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disruptions table
CREATE TABLE public.disruptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR UNIQUE,
  type VARCHAR NOT NULL,
  zone VARCHAR,
  pincode VARCHAR,
  severity VARCHAR DEFAULT 'low',
  reading VARCHAR,
  threshold VARCHAR,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create claims table
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  disruption_id UUID REFERENCES public.disruptions(id),
  payout_amount DECIMAL,
  baseline_earnings DECIMAL,
  protection_percentage INTEGER,
  explainer_text TEXT,
  status VARCHAR DEFAULT 'processing',
  fraud_flag BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL NOT NULL,
  upi_id VARCHAR,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (demo app, no auth required)
CREATE POLICY "Allow public read on workers" ON public.workers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on workers" ON public.workers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on workers" ON public.workers FOR UPDATE USING (true);

CREATE POLICY "Allow public read on policies" ON public.policies FOR SELECT USING (true);
CREATE POLICY "Allow public insert on policies" ON public.policies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on policies" ON public.policies FOR UPDATE USING (true);

CREATE POLICY "Allow public read on disruptions" ON public.disruptions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on disruptions" ON public.disruptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on disruptions" ON public.disruptions FOR UPDATE USING (true);

CREATE POLICY "Allow public read on claims" ON public.claims FOR SELECT USING (true);
CREATE POLICY "Allow public insert on claims" ON public.claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on claims" ON public.claims FOR UPDATE USING (true);

CREATE POLICY "Allow public read on payouts" ON public.payouts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on payouts" ON public.payouts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on payouts" ON public.payouts FOR UPDATE USING (true);
