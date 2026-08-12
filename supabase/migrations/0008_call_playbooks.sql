-- ════════════════════════════════════════════════════════════════
-- 0008 — Call Playbooks (Glencoco-style guided cold-call scripts)
-- ════════════════════════════════════════════════════════════════
-- Modular "card deck" model per Glencoco's Create/Build system:
--   call_playbooks   one deck per product × industry vertical
--   playbook_cards   discrete stage cards (intro/pitch/qual/close/end)
--                    + shared objection cards (playbook_id NULL, product set)
--   card_variants    A/B script variants per card ("v1 · control", "v2 …")
--   call_sessions    one row per dial — variant assignment + disposition,
--                    feeds the variant performance stats (A/B winner picking)
--
-- Script body conventions (parsed by the CRM live-call UI):
--   {{merge_field}}          filled from the selected lead / rep
--   [GREEN] / [BLUE] / [RED] color-coded conditional branches
--   (pause) (wait for answer) stage directions, rendered muted italic
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.call_playbooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  product     TEXT NOT NULL CHECK (product IN ('deltpay','deltcapital')),
  industry    TEXT NOT NULL DEFAULT 'Universal',
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.playbook_cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  playbook_id   UUID REFERENCES public.call_playbooks(id) ON DELETE CASCADE,
  product       TEXT CHECK (product IN ('deltpay','deltcapital')),
  card_type     TEXT NOT NULL CHECK (card_type IN
                  ('intro','pitch','qualification','objection','close','scheduling','end_call','expansion')),
  title         TEXT NOT NULL,
  trigger_label TEXT,             -- one-tap objection chip label in the live-call UI
  sort_order    INT NOT NULL DEFAULT 0,
  test_mode     BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE → rotate active variants A/B
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- a card belongs to a playbook OR is a shared product-level objection card
  CONSTRAINT card_owner CHECK (playbook_id IS NOT NULL OR product IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.card_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id       UUID NOT NULL REFERENCES public.playbook_cards(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'v1',
  body          TEXT NOT NULL,
  coaching_note TEXT,             -- "Caller thinking" — the why, shown to green reps
  is_control    BOOLEAN NOT NULL DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.call_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  rep_name         TEXT,
  lead_id          TEXT,
  lead_name        TEXT,
  playbook_id      UUID REFERENCES public.call_playbooks(id) ON DELETE SET NULL,
  variant_map      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { card_id: variant_id }
  disposition      TEXT,
  connected        BOOLEAN NOT NULL DEFAULT FALSE,
  conversation_30s BOOLEAN NOT NULL DEFAULT FALSE,
  meeting_booked   BOOLEAN NOT NULL DEFAULT FALSE,
  objections_hit   UUID[] NOT NULL DEFAULT '{}',
  duration_seconds INT,
  notes            TEXT
);

CREATE INDEX IF NOT EXISTS idx_playbook_cards_playbook ON public.playbook_cards(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_cards_product  ON public.playbook_cards(product) WHERE playbook_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_card_variants_card      ON public.card_variants(card_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_playbook  ON public.call_sessions(playbook_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_created   ON public.call_sessions(created_at);

-- ─── RLS: staff only (matches 0005 crm_staff_access model) ───────
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'call_playbooks', 'playbook_cards', 'card_variants', 'call_sessions'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_staff_all ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_staff_all ON public.%I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())', t, t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════
-- SEED — Playbooks
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.call_playbooks (slug, product, industry, name, description) VALUES
('dp-universal',  'deltpay',     'Universal',           'Deltpay — Universal Savings Pitch',      'Default processing-savings script for any merchant type. Start here when the vertical has no dedicated deck.'),
('dp-restaurant', 'deltpay',     'Restaurant',          'Deltpay — Restaurant & Food Service',    'Rate-creep + statement-review angle for restaurants, cafes, and QSR.'),
('dp-retail',     'deltpay',     'Retail',              'Deltpay — Retail',                       'Card-volume savings angle for brick-and-mortar retail.'),
('dp-auto',       'deltpay',     'Automotive',          'Deltpay — Auto Repair',                  'High-average-ticket angle; probes card-not-present phone deposits.'),
('dp-salon',      'deltpay',     'Salon & Spa',         'Deltpay — Salon & Spa',                  'Recurring membership billing + tip-adjust premium-rate angle.'),
('dp-medical',    'deltpay',     'Medical & Dental',    'Deltpay — Medical & Dental',             'Front-desk, phone-balance, and payment-plan processing angle.'),
('dp-ecom',       'deltpay',     'E-Commerce',          'Deltpay — E-Commerce',                   'Online gateway fees, checkout friction, and chargeback angle.'),
('dc-universal',  'deltcapital', 'Universal',           'DeltCapital — Universal Working Capital','Default MCA / working-capital script. Pattern-interrupt opener + positions discovery.'),
('dc-restaurant', 'deltcapital', 'Restaurant',          'DeltCapital — Restaurant',               'Seasonal cash-flow bridge, equipment repair, buildout framing.'),
('dc-retail',     'deltcapital', 'Retail',              'DeltCapital — Retail',                   'Inventory buy-in ahead of seasonal rush framing.'),
('dc-auto',       'deltcapital', 'Automotive',          'DeltCapital — Auto Repair',              'Same-day parts orders and equipment framing.'),
('dc-salon',      'deltcapital', 'Salon & Spa',         'DeltCapital — Salon & Spa',              'Equipment upgrades and staffing-gap framing.'),
('dc-medical',    'deltcapital', 'Medical & Dental',    'DeltCapital — Medical & Dental',         'Equipment and expansion framing for practices.'),
('dc-ecom',       'deltcapital', 'E-Commerce',          'DeltCapital — E-Commerce',               'Inventory + ad-spend scaling ahead of demand spikes.')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- SEED — Stage cards per playbook
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.playbook_cards (slug, playbook_id, card_type, title, sort_order, test_mode)
SELECT v.slug, p.id, v.card_type, v.title, v.sort_order, v.test_mode
FROM (VALUES
  -- Deltpay Universal (opener + close are live A/B tests out of the box)
  ('dp-universal-intro','dp-universal','intro','Opener',10,TRUE),
  ('dp-universal-pitch','dp-universal','pitch','Main Pitch',20,FALSE),
  ('dp-universal-qual','dp-universal','qualification','Discovery',30,FALSE),
  ('dp-universal-close','dp-universal','close','Appointment Close',40,TRUE),
  ('dp-universal-end','dp-universal','end_call','End The Call',50,FALSE),
  -- Deltpay Restaurant
  ('dp-restaurant-intro','dp-restaurant','intro','Opener',10,FALSE),
  ('dp-restaurant-pitch','dp-restaurant','pitch','Main Pitch',20,FALSE),
  ('dp-restaurant-qual','dp-restaurant','qualification','Discovery',30,FALSE),
  ('dp-restaurant-close','dp-restaurant','close','Appointment Close',40,FALSE),
  ('dp-restaurant-end','dp-restaurant','end_call','End The Call',50,FALSE),
  -- Deltpay Retail
  ('dp-retail-intro','dp-retail','intro','Opener',10,FALSE),
  ('dp-retail-pitch','dp-retail','pitch','Main Pitch',20,FALSE),
  ('dp-retail-qual','dp-retail','qualification','Discovery',30,FALSE),
  ('dp-retail-close','dp-retail','close','Appointment Close',40,FALSE),
  ('dp-retail-end','dp-retail','end_call','End The Call',50,FALSE),
  -- Deltpay Auto
  ('dp-auto-intro','dp-auto','intro','Opener',10,FALSE),
  ('dp-auto-pitch','dp-auto','pitch','Main Pitch',20,FALSE),
  ('dp-auto-qual','dp-auto','qualification','Discovery',30,FALSE),
  ('dp-auto-close','dp-auto','close','Appointment Close',40,FALSE),
  ('dp-auto-end','dp-auto','end_call','End The Call',50,FALSE),
  -- Deltpay Salon
  ('dp-salon-intro','dp-salon','intro','Opener',10,FALSE),
  ('dp-salon-pitch','dp-salon','pitch','Main Pitch',20,FALSE),
  ('dp-salon-qual','dp-salon','qualification','Discovery',30,FALSE),
  ('dp-salon-close','dp-salon','close','Appointment Close',40,FALSE),
  ('dp-salon-end','dp-salon','end_call','End The Call',50,FALSE),
  -- Deltpay Medical
  ('dp-medical-intro','dp-medical','intro','Opener',10,FALSE),
  ('dp-medical-pitch','dp-medical','pitch','Main Pitch',20,FALSE),
  ('dp-medical-qual','dp-medical','qualification','Discovery',30,FALSE),
  ('dp-medical-close','dp-medical','close','Appointment Close',40,FALSE),
  ('dp-medical-end','dp-medical','end_call','End The Call',50,FALSE),
  -- Deltpay E-Commerce
  ('dp-ecom-intro','dp-ecom','intro','Opener',10,FALSE),
  ('dp-ecom-pitch','dp-ecom','pitch','Main Pitch',20,FALSE),
  ('dp-ecom-qual','dp-ecom','qualification','Discovery',30,FALSE),
  ('dp-ecom-close','dp-ecom','close','Appointment Close',40,FALSE),
  ('dp-ecom-end','dp-ecom','end_call','End The Call',50,FALSE),
  -- DeltCapital Universal (opener is a live A/B test out of the box)
  ('dc-universal-intro','dc-universal','intro','Opener',10,TRUE),
  ('dc-universal-pitch','dc-universal','pitch','Main Pitch',20,FALSE),
  ('dc-universal-qual','dc-universal','qualification','Positions Discovery',30,FALSE),
  ('dc-universal-close','dc-universal','close','Close & Next Step',40,FALSE),
  ('dc-universal-end','dc-universal','end_call','End The Call',50,FALSE),
  -- DeltCapital industry decks
  ('dc-restaurant-intro','dc-restaurant','intro','Opener',10,FALSE),
  ('dc-restaurant-pitch','dc-restaurant','pitch','Main Pitch',20,FALSE),
  ('dc-restaurant-qual','dc-restaurant','qualification','Positions Discovery',30,FALSE),
  ('dc-restaurant-close','dc-restaurant','close','Close & Next Step',40,FALSE),
  ('dc-restaurant-end','dc-restaurant','end_call','End The Call',50,FALSE),
  ('dc-retail-intro','dc-retail','intro','Opener',10,FALSE),
  ('dc-retail-pitch','dc-retail','pitch','Main Pitch',20,FALSE),
  ('dc-retail-qual','dc-retail','qualification','Positions Discovery',30,FALSE),
  ('dc-retail-close','dc-retail','close','Close & Next Step',40,FALSE),
  ('dc-retail-end','dc-retail','end_call','End The Call',50,FALSE),
  ('dc-auto-intro','dc-auto','intro','Opener',10,FALSE),
  ('dc-auto-pitch','dc-auto','pitch','Main Pitch',20,FALSE),
  ('dc-auto-qual','dc-auto','qualification','Positions Discovery',30,FALSE),
  ('dc-auto-close','dc-auto','close','Close & Next Step',40,FALSE),
  ('dc-auto-end','dc-auto','end_call','End The Call',50,FALSE),
  ('dc-salon-intro','dc-salon','intro','Opener',10,FALSE),
  ('dc-salon-pitch','dc-salon','pitch','Main Pitch',20,FALSE),
  ('dc-salon-qual','dc-salon','qualification','Positions Discovery',30,FALSE),
  ('dc-salon-close','dc-salon','close','Close & Next Step',40,FALSE),
  ('dc-salon-end','dc-salon','end_call','End The Call',50,FALSE),
  ('dc-medical-intro','dc-medical','intro','Opener',10,FALSE),
  ('dc-medical-pitch','dc-medical','pitch','Main Pitch',20,FALSE),
  ('dc-medical-qual','dc-medical','qualification','Positions Discovery',30,FALSE),
  ('dc-medical-close','dc-medical','close','Close & Next Step',40,FALSE),
  ('dc-medical-end','dc-medical','end_call','End The Call',50,FALSE),
  ('dc-ecom-intro','dc-ecom','intro','Opener',10,FALSE),
  ('dc-ecom-pitch','dc-ecom','pitch','Main Pitch',20,FALSE),
  ('dc-ecom-qual','dc-ecom','qualification','Positions Discovery',30,FALSE),
  ('dc-ecom-close','dc-ecom','close','Close & Next Step',40,FALSE),
  ('dc-ecom-end','dc-ecom','end_call','End The Call',50,FALSE)
) AS v(slug, playbook_slug, card_type, title, sort_order, test_mode)
JOIN public.call_playbooks p ON p.slug = v.playbook_slug
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- SEED — Shared objection / smokescreen cards (product-level)
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.playbook_cards (slug, product, card_type, title, trigger_label, sort_order) VALUES
-- Deltpay objections
('dp-obj-happy',    'deltpay','objection','Happy With Current Processor','Happy w/ processor',10),
('dp-obj-email',    'deltpay','objection','Just Send Me An Email','Send email',20),
('dp-obj-contract', 'deltpay','objection','I''m In A Contract','In a contract',30),
('dp-obj-busy',     'deltpay','objection','I''m Busy Right Now','I''m busy',40),
('dp-obj-savings',  'deltpay','objection','How Much Can You Save Me?','How much?',50),
('dp-obj-salescall','deltpay','objection','Is This A Sales Call?','Sales call?',60),
('dp-obj-dm',       'deltpay','objection','Not The Decision-Maker','Not the DM',70),
-- DeltCapital objections
('dc-obj-noneed',   'deltcapital','objection','Don''t Need Money / Not Interested','Not interested',10),
('dc-obj-timing',   'deltcapital','objection','Timing Isn''t Right','Bad timing',20),
('dc-obj-notenough','deltcapital','objection','That''s Not Enough Money','Not enough',30),
('dc-obj-rate',     'deltcapital','objection','Rate / Payment Too High','Rate too high',40),
('dc-obj-broker',   'deltcapital','objection','Already Working With Another Broker','Has a broker',50),
('dc-obj-flooded',  'deltcapital','objection','Getting Flooded With Calls','Too many calls',60),
('dc-obj-interest', 'deltcapital','objection','What''s The Interest Rate?','Interest rate?',70),
('dc-obj-email',    'deltcapital','objection','Just Send Me An Email','Send email',80),
('dc-obj-busy',     'deltcapital','objection','I''m Busy Right Now','I''m busy',90)
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- SEED — Variants (script bodies + coaching notes)
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.card_variants (card_id, label, body, coaching_note, is_control)
SELECT c.id, v.label, v.body, v.note, v.is_control
FROM (VALUES

-- ─── DELTPAY UNIVERSAL ───────────────────────────────────────────
('dp-universal-intro','v1 · permission-based', $s$Hey {{owner_first_name}}?

Oh... hey {{owner_first_name}}... it's {{rep_name}} over at Delt...

I know I might've caught you in the middle of something here...
but do you mind if I grab uhh... half a minute... tell you exactly why I called... and then you can let me know if it's relevant... or not?

(wait for answer)

Great... appreciate that...

And then, umm... does Delt ring a bell, just by the off chance?

IF NO / NOT FAMILIAR:
Ahh okay... no worries, not unusual...
feel free to cut me off if it's not in your wheelhouse...$s$, 'Permission-based opener. The downswing tone and the "cut me off" line lower their guard — you sound human, not scripted. Never rush the first 10 seconds.', TRUE),

('dp-universal-intro','v2 · local anchor', $s$Hi, is this {{owner_first_name}}? Great — this is {{rep_name}} with Delt.

I noticed {{business_name}} over on {{street_name}}... I've been working with a few other {{business_type}} around {{city}} to lower their card processing costs.

Got a quick minute?

IF BUSY:
Totally get it — real quick, are you the one who handles your payment processing? Great — when's a better 5-minute window?$s$, 'Local-anchor opener. Naming the street and nearby businesses makes it feel researched, not random. Test this against v1 on connect-to-conversation rate.', FALSE),

('dp-universal-pitch','v1 · control', $s$So quick background on us... Delt is a payment processing company... but the whole model is built around something most processors actively avoid...

Most owners think they're getting a good rate... until someone actually reads the statement line by line...
Processors bury fees and let rates creep every single year... and nobody ever calls to tell you.

So the thing that makes us different... we do a free statement analysis...
I'll show you exactly what you're paying versus what you should be paying — on your own numbers, not a brochure.

If I can save you money... great.
If not... you'll know for a fact you're already in good shape... and I'll tell you that too.

BRIDGE:
Now {{owner_first_name}}... obviously you've already got processing set up... I'd be worried if you didn't...
We're not here to rip out what's working... this is about verifying it actually IS working.

SOFT QUALIFICATION:
But just out of curiosity... who are you processing with right now?

(wait for answer)$s$, 'Status → Change → UVP. Disarm with the bridge ("you already have X, that''s fine") before qualifying. The "I''ll tell you that too" line builds trust — you sound like an auditor, not a salesman.', TRUE),

('dp-universal-qual','v1 · control', $s$Who do you currently process with?

(wait for answer)

Do you know roughly what you're paying in fees each month... or is that more of a "trust the statement" situation?

(wait for answer)

When's the last time someone actually reviewed your statement line-by-line?

(wait for answer)

And are you mostly card-present in store... or do you also take payments over the phone or online?$s$, 'One question at a time. The "trust the statement" phrasing gives them permission to say "I don''t know" — which is the hook. Most owners can''t answer question two; that''s the moment to bridge to the close.', TRUE),

('dp-universal-close','v1 · statement grab', $s$Here's the easiest way to do this...

Can you text or snap a photo of your last processing statement? I'll run the analysis and call you back within 24 hours with the exact savings number...

No obligation — if I can save you money, I'll show you how... if not, you'll know you're in good shape.

What's the best number to text you the secure upload link?

(lock it down)

Perfect — and if the number's meaningful, we'll grab 15 minutes to walk through it. Fair?$s$, 'Statement-grab close: the smallest possible ask. You''re not selling a switch — you''re selling a free audit. Always end with next step + timeline + commitment.', TRUE),

('dp-universal-close','v2 · direct meeting', $s$Let's do this — let's grab 15 minutes... I'll walk through your statement live and show you exactly what you're paying versus what you should be paying...

I've got {{day_1}} at {{time_1}}... or {{day_2}} at {{time_2}} — which one's easier?

(wait — do not fill the silence)

Perfect... I'll text you a calendar invite right now so it's locked in. If anything changes, just reply to that text.$s$, 'Direct time-bound close. Offering two specific slots converts better than "when works for you?" — and time-bound closes show up better than soft asks. Test vs v1 on booked AND show rate.', FALSE),

('dp-universal-end','v1 · control', $s$IF MEETING BOOKED:
Perfect {{owner_first_name}} — you're locked in for {{day_1}} at {{time_1}}... I'm texting you the invite right now...
One thing — have that statement handy on the call, that's where the money is. Talk then!

IF NO / NOT NOW:
All good {{owner_first_name}} — I appreciate the straight answer...
I'll check back in a few months... rates creep, so it's worth a look once a year either way. Have a good one.

(log the disposition immediately)$s$, 'Every call ends with a clear next step — a booked time or a scheduled re-check. "If your call doesn''t end with a clear next step, it wasn''t a sales call — it was a chat."', TRUE),

-- ─── DELTPAY RESTAURANT ──────────────────────────────────────────
('dp-restaurant-intro','v1 · control', $s$Hey {{owner_first_name}}?

Oh hey... it's {{rep_name}} over at Delt... I know you're probably in the middle of service prep, so I'll be quick...

I've been working with a few other restaurants around {{city}} on their card processing costs... mind if I grab 30 seconds to tell you why I called... and you can tell me if it's relevant?

(wait for answer)$s$, 'Acknowledging service prep shows you know their world. Call between 2-4pm — after lunch rush, before dinner.', TRUE),

('dp-restaurant-pitch','v1 · control', $s$So here's the thing with restaurants specifically...

You're running high card volume on thin margins... and processors love that... because rate creep on a restaurant statement is almost invisible...
A tenth of a percent here... a new "non-qualified" tier there... nobody has time to catch it during service.

Most restaurant owners we sit with are overpaying without realizing it...

So we do a free statement analysis — I'll show you exactly what you're paying versus what you should be... line by line...
If I find money, great... if not, you'll know you're in good shape.

BRIDGE:
You've obviously got processing running — we're not ripping anything out... this is a verify, not a switch.

SOFT QUALIFICATION:
Quick one — who are you with right now... and is that through your POS, like Toast or Clover... or a separate processor?$s$, 'POS-bundled processing (Toast/Clover/Square) usually carries premium rates — that''s the wedge. Margins framing resonates: every basis point is food cost.', TRUE),

('dp-restaurant-qual','v1 · control', $s$Is your processing bundled through your POS... or separate?

(wait for answer)

Roughly what's your monthly card volume... ballpark?

(wait for answer)

Do you do online ordering or delivery through your own site? Those card-not-present rates are usually where the leak is...

And when's the last time anyone reviewed the statement line-by-line?$s$, 'Online ordering is the restaurant-specific leak — CNP rates run higher and owners never see them broken out. That question alone often creates the meeting.', TRUE),

('dp-restaurant-close','v1 · control', $s$Easiest path — snap a photo of last month's statement and text it over... I'll have your savings number back within 24 hours...

If it's meaningful, we grab 15 minutes before dinner service one day and walk through it...
If not, you'll know you're in good shape — either way you win.

What's the best number for the secure link?$s$, 'Statement grab, framed around their schedule ("before dinner service"). Small ask, clear turnaround, no-lose framing.', TRUE),

('dp-restaurant-end','v1 · control', $s$IF STATEMENT PROMISED:
Perfect — I'll text the secure link right now... you'll hear back from me within 24 hours with the exact number. Talk soon.

IF NO:
All good — I know margins are tight and time's tighter... I'll check back after the season. Have a great service tonight.$s$, 'Leave the door open with a specific re-check window. Restaurants churn processors after bad months — timing matters.', TRUE),

-- ─── DELTPAY RETAIL ──────────────────────────────────────────────
('dp-retail-intro','v1 · control', $s$Hey {{owner_first_name}}? It's {{rep_name}} over at Delt...

I've been working with a few {{business_type}} around {{city}} on lowering card processing costs... do you mind if I grab half a minute and tell you why I called... and you can tell me if it's relevant or not?

(wait for answer)$s$, 'Standard permission-based opener with the local anchor. Retail owners are usually at the counter — keep it tight.', TRUE),

('dp-retail-pitch','v1 · control', $s$So real quick... most retail owners think they're getting a decent rate... until someone reads the statement line by line...

Rates creep every year... fees get buried... and with your kind of card volume, even half a percent is real money by year end.

We do a free statement analysis — exactly what you're paying versus what you should be paying...
If I find savings, I'll show you... if not, I'll tell you you're in good shape and leave you alone.

SOFT QUALIFICATION:
Who are you processing with right now... and how long have you been with them?$s$, 'Volume math is the retail hook — translate percentage into dollars fast. "Leave you alone" disarms better than any pitch line.', TRUE),

('dp-retail-qual','v1 · control', $s$Who's your current processor... and is it tied into your POS system?

(wait for answer)

Ballpark monthly card volume?

(wait for answer)

Do you also sell online... or is it all in-store?

And do you know your effective rate — the all-in number — or just the quoted rate?$s$, 'The quoted-rate vs effective-rate gap is the retail wedge. Almost nobody knows their all-in number.', TRUE),

('dp-retail-close','v1 · control', $s$Simplest way — text me a photo of your last statement... I'll run it and come back within 24 hours with the exact savings number...

If it's real money, we grab 15 minutes and I'll walk you through it... if not, you'll know you're in good shape.

Best number for the secure link?$s$, 'Statement grab. Keep the turnaround promise specific — 24 hours — and keep it.', TRUE),

('dp-retail-end','v1 · control', $s$IF STATEMENT PROMISED:
Perfect — link's on its way... you'll have your number back within 24 hours.

IF NO:
No problem at all — I'll check back ahead of the holiday season... that's when the volume makes it worth a second look. Take care.$s$, 'Holiday season re-check is a natural retail callback hook.', TRUE),

-- ─── DELTPAY AUTO ────────────────────────────────────────────────
('dp-auto-intro','v1 · control', $s$Hey {{owner_first_name}}? It's {{rep_name}} over at Delt...

I work with a bunch of auto shops around {{city}} on card processing costs... mind if I grab half a minute... tell you why I called... and you can tell me if it's relevant?

(wait for answer)$s$, 'Shops answer their own phones — expect the owner or service manager directly. Get to the point fast.', TRUE),

('dp-auto-pitch','v1 · control', $s$So here's why shops specifically...

You're running $150 to $400 average tickets on card... and at that ticket size, even half a percent rate difference adds up fast across a month of repair orders...

And the part most shops miss — phone deposits and parts orders run card-not-present... which is a whole different, higher rate category most owners never see broken out.

We do a free statement analysis... exactly what you're paying versus what you should be... on your own numbers.

SOFT QUALIFICATION:
Are you mostly running cards in-shop... or do you also take phone deposits for parts and bigger jobs?$s$, 'High-average-ticket math + the CNP phone-deposit angle is unique to auto — it makes you sound like you know shops, not just processing.', TRUE),

('dp-auto-qual','v1 · control', $s$Who are you processing with now?

(wait for answer)

What's a typical repair order run on card — ballpark?

(wait for answer)

Phone deposits for parts or big jobs — how often does that happen?

And who set up your current rates... did anyone ever break out card-present versus card-not-present for you?$s$, 'The CP vs CNP breakout question is the credibility moment. No one has ever shown them that split.', TRUE),

('dp-auto-close','v1 · control', $s$Easiest thing — snap a photo of last month's statement, text it over... I'll have the exact savings number back to you in 24 hours...

If it's meaningful, we grab 15 minutes between jobs and walk through it... if not, you'll know you're set.

Best number for the secure link?$s$, '"Between jobs" shows you respect shop time. Statement grab stays the smallest possible ask.', TRUE),

('dp-auto-end','v1 · control', $s$IF STATEMENT PROMISED:
Perfect — link's coming now... 24 hours, you'll have your number.

IF NO:
All good — appreciate the straight answer... I'll check back in a few months. Good luck with the bays today.$s$, 'Keep it human. Shops remember reps who didn''t waste their time.', TRUE),

-- ─── DELTPAY SALON ───────────────────────────────────────────────
('dp-salon-intro','v1 · control', $s$Hey {{owner_first_name}}? It's {{rep_name}} over at Delt...

I've been working with a few salons and spas around {{city}} on card processing costs... mind if I grab half a minute and tell you why I called?

(wait for answer)$s$, 'Call mid-morning or mid-afternoon between appointment blocks.', TRUE),

('dp-salon-pitch','v1 · control', $s$So the thing with salons specifically...

A lot of salons don't realize their POS is charging a premium rate on tip-adjusted transactions... every single adjusted ticket can re-price at a worse tier...

And if you're running memberships or packages on recurring billing... those are usually priced as card-not-present... the most expensive category on the statement.

We do a free statement analysis... exactly what you're paying versus what you should be...

SOFT QUALIFICATION:
Are you running recurring memberships... or mostly one-off visits? And do you tip-adjust at close of day?$s$, 'Tip-adjust downgrades and recurring-billing CNP rates are the two salon-specific leaks. Naming them makes you the specialist.', TRUE),

('dp-salon-qual','v1 · control', $s$What system are you on — Square, Vagaro, Boulevard... something else?

(wait for answer)

Memberships or packages on auto-billing?

(wait for answer)

Roughly what's monthly card volume?

And has anyone ever shown you what the tip adjustments are costing on the statement?$s$, 'Software-first question builds rapport — salon owners identify with their booking platform.', TRUE),

('dp-salon-close','v1 · control', $s$Simplest way — text me a photo of last month's statement... I'll run the numbers and come back within 24 hours...

If the savings are real, we'll grab 15 minutes between appointments and walk through it... if not, you're in good shape and you'll know it.

Best number for the secure link?$s$, 'Statement grab with the "between appointments" respect line.', TRUE),

('dp-salon-end','v1 · control', $s$IF STATEMENT PROMISED:
Perfect — link's on its way... you'll have your number in 24 hours.

IF NO:
Totally fine — I'll check back next quarter... rates creep, so it's worth a look once a year. Have a great rest of your day.$s$, 'Soft close, annual-review framing.', TRUE),

-- ─── DELTPAY MEDICAL ─────────────────────────────────────────────
('dp-medical-intro','v1 · control', $s$Hi, is this {{owner_first_name}}? This is {{rep_name}} with Delt...

We work with medical and dental practices around {{city}} on payment processing costs... do you have half a minute for me to tell you why I called... and you can tell me if it's relevant?

(wait for answer)

IF GATEKEEPER:
Sure — I'm calling about the practice's card processing costs... who handles that, the office manager or the doctor directly? Could you point me to them?$s$, 'Front desk is a gatekeeper 80% of the time — target the office manager. Be specific about "processing costs," not "an opportunity."', TRUE),

('dp-medical-pitch','v1 · control', $s$So here's what we see with practices specifically...

You're taking cards three different ways — front desk, over the phone for balances, and on payment plans...
And most practices are paying card-not-present rates — the most expensive tier — on plans and phone payments they could be processing cheaper.

We do a free statement analysis... I'll show you exactly what you're paying versus what you should be... by category.

SOFT QUALIFICATION:
Quick one — are you running payment plans in-house... and do you take card payments over the phone for balances?$s$, 'The three-channel breakdown (desk/phone/plans) is the practice-specific wedge. Office managers care about clean, defensible numbers.', TRUE),

('dp-medical-qual','v1 · control', $s$Who's your current processor... is it bundled with your practice management software?

(wait for answer)

Payment plans — in-house or through a third party?

(wait for answer)

Roughly what's the monthly card volume across front desk and phone?

And when's the last time anyone reviewed the statement by rate category?$s$, 'PM-software-bundled processing usually carries premium rates — same wedge as POS-bundled in retail.', TRUE),

('dp-medical-close','v1 · control', $s$Easiest path — have your office manager text or upload last month's statement... I'll run the analysis and come back within 24 hours with the number...

If it's meaningful, we grab 15 minutes — you, me, and the office manager — and walk through it... if not, you'll know the practice is in good shape.

What's the best email or number for the secure link?$s$, 'Include the office manager in the meeting ask — they''re the real operator and often the blocker if excluded.', TRUE),

('dp-medical-end','v1 · control', $s$IF STATEMENT PROMISED:
Perfect — link's on its way... 24-hour turnaround on the analysis.

IF NO:
Understood — I'll check back next quarter... worth a look annually either way. Have a great day.$s$, 'Practices move slowly — a polite, professional exit earns the future callback.', TRUE),

-- ─── DELTPAY ECOM ────────────────────────────────────────────────
('dp-ecom-intro','v1 · control', $s$Hi {{owner_first_name}}, this is {{rep_name}} with Delt...

We help e-commerce businesses like {{business_name}} cut their online processing and gateway fees... got half a minute for me to tell you why I called?

(wait for answer)$s$, 'No street/city anchor for e-com — lead with the category. These owners live in their dashboards; talk numbers fast.', TRUE),

('dp-ecom-pitch','v1 · control', $s$So with online businesses specifically...

You're paying card-not-present rates on everything... plus gateway fees... plus whatever your platform skims on top...
Most owners only know their headline rate — not the blended, all-in number.

We do a free analysis of your processing setup... exactly what you're paying all-in versus what you should be...
And we'll look at your chargeback exposure while we're in there — that's usually the second leak.

SOFT QUALIFICATION:
Do you know what you're paying blended, all-in, on your online transactions... or just the quoted rate?$s$, 'The blended all-in number is the e-com wedge — platform + gateway + processing stacks up invisibly. Chargebacks are the urgency layer.', TRUE),

('dp-ecom-qual','v1 · control', $s$What's the stack — Shopify, Woo, custom checkout?

(wait for answer)

Roughly what's monthly online volume?

(wait for answer)

Where do chargebacks sit as a percentage... under one percent, or is it creeping?

And is checkout friction something you've measured... cart abandonment at the payment step?$s$, 'Chargeback rate and payment-step abandonment create urgency beyond rate savings — real e-com pains, not just cost.', TRUE),

('dp-ecom-close','v1 · control', $s$Easiest way — I'll send a secure link, you upload a recent processing statement or a screenshot of your fee dashboard...

I'll come back within 24 hours with the all-in number and where it should be...
If it's meaningful, we grab 15 minutes on a screen share... if not, you'll know your stack is clean.

Best email for the link?$s$, 'Screen-share close fits e-com — they expect remote. Fee-dashboard screenshot lowers the ask vs hunting for a statement.', TRUE),

('dp-ecom-end','v1 · control', $s$IF STATEMENT/SCREENSHOT PROMISED:
Perfect — link's on its way... 24 hours, you'll have your all-in number.

IF NO:
All good — I'll check back ahead of your peak season... that's when the volume makes it worth the look. Good luck with the store.$s$, 'Peak-season callback hook mirrors retail.', TRUE),

-- ─── DELTCAPITAL UNIVERSAL ───────────────────────────────────────
('dc-universal-intro','v1 · prior-signal', $s$Hey, is this {{owner_first_name}}?

Hey — it's {{rep_name}} with Delt... I'm looking for a little bit of help...

It looks like {{business_name}} may have looked into financing options at some point... what was the situation — what were you looking for?

(wait — let them talk. curious tone, not pitchy)$s$, 'Pattern-interrupt opener, delivered curious and understated. People respond to tonality more than the actual words — sound like you''re trying to understand, not sell.', TRUE),

('dc-universal-intro','v2 · cold direct', $s$Hi {{owner_first_name}}, this is {{rep_name}} with Delt...

The reason for my call is we offer working capital to help businesses like yours grow...
Based on monthly revenue, businesses like {{business_name}} typically qualify for up to {{max_amount}} in funding...

Are you familiar with these kinds of programs?

(wait for answer)$s$, 'Direct reason-for-call opener. Stating the reason for the call early is associated with ~2x higher success. Test vs v1 on conversation rate.', FALSE),

('dc-universal-pitch','v1 · control', $s$So real quick on how this works — because it's not a bank loan...

We offer up-front capital based on your revenue... not your credit score, not a stack of paperwork, not a 60-day process...
Approval usually runs on your last three months of bank statements... funding can land in 24 to 48 hours.

And the payback flexes with your sales... if you have a slow week, the payback slows down with it...

Businesses use it for inventory, equipment, buildouts, bridging a slow season... whatever moves the business forward.

BRIDGE:
And look — I'm not asking if you "need money"... most owners I talk to are doing fine...
The question is whether there's something you'd DO with capital if it was sitting in the account this week.

SOFT QUALIFICATION:
So let me ask you — if I could get you funds at terms that make sense... what would you put them toward?$s$, 'Status → Change → UVP for capital: fast, revenue-based, flexes with sales. The bridge kills the "I don''t need money" reflex before it forms. Purpose question = urgency check: no use case, no deal.', TRUE),

('dc-universal-qual','v1 · control', $s$What's the purpose of the capital — what would you use it for?

(wait — no urgency means no deal. dig here.)

Do you have any current approvals or offers on the table?

IF YES: What's the term... what's the payback... what's the actual daily or weekly payment?

Do you have any other active fundings right now?

IF YES: Who's it with... what's the balance... how's the payment history been?

Ever had a default or a missed payment on an advance?

How much do you process monthly in card sales... ballpark?

And when do you need the funds by?$s$, 'The positions discovery, in order. Card-volume question doubles as the Deltpay cross-sell qualifier. Get real numbers on competing offers — vague answers usually mean no real offer exists.', TRUE),

('dc-universal-close','v1 · control', $s$Here's what I'll do...

I'm going to process this and see exactly what I can get you... as close to {{requested_amount}} as possible...

I'll need your last three months of bank statements — I'll text you a secure upload link right now...

And I'll call you back within a couple hours once I've spoken to underwriting... fair enough?

(lock down the callback time)

Perfect — statements in, and you'll have a real number today.$s$, 'Concrete next step + timeline + commitment. "Fair enough?" earns a verbal yes — a micro-commitment that lifts follow-through on the doc upload.', TRUE),

('dc-universal-end','v1 · control', $s$IF DOCS PROMISED:
Perfect {{owner_first_name}} — the upload link is on its way... I'm on this as soon as the statements land... talk in a couple hours.

IF NO / NOT NOW:
All good — I appreciate the straight answer...
One thing — when the next slow season or big opportunity shows up, you want this relationship already open... I'll check in down the road. Good luck out there.

(log the disposition immediately)$s$, 'Plant the future-need seed on the way out. Re-engage stalled prospects 6-12 months later — lead with curiosity, not offers.', TRUE),

-- ─── DELTCAPITAL RESTAURANT ──────────────────────────────────────
('dc-restaurant-intro','v1 · control', $s$Hey, is this {{owner_first_name}}?

Hey — it's {{rep_name}} with Delt... I'll keep this quick, I know you've got a restaurant to run...

It looks like {{business_name}} may have looked into financing at some point... what was the situation — what were you looking for?

(wait — curious tone)$s$, 'Same pattern-interrupt, restaurant-aware. Call 2-4pm between rushes.', TRUE),

('dc-restaurant-pitch','v1 · control', $s$So here's how restaurant owners typically use us...

A lot of them use this to bridge a slow season... cover an equipment repair when the walk-in dies... or fund a buildout... without waiting 60 days on a bank...

It's revenue-based — approval runs off your last three months of bank statements, funding lands in 24 to 48 hours... and the payback flexes with sales, so a slow week means a lighter payback.

SOFT QUALIFICATION:
If capital was sitting in the account this week... what would it go toward — equipment, the patio, bridging until season picks up?$s$, 'Walk-in dying and slow-season bridging are visceral, real scenarios — every restaurant owner has lived one.', TRUE),

('dc-restaurant-qual','v1 · control', $s$What would the capital go toward?

(wait for answer)

Any offers or approvals on the table right now?

IF YES: What's the payback... the actual daily number?

Any active advances right now... who with, what's the balance?

Roughly what do you do monthly in card sales?

And when would you want funds by — before the season, before that repair becomes an emergency?$s$, 'Standard positions discovery with seasonal urgency framing.', TRUE),

('dc-restaurant-close','v1 · control', $s$Here's what I'll do — I'll process this and see exactly what I can get you...

Last three months of bank statements — secure upload link coming by text right now...

I'll call you back before dinner service with a real number... fair enough?$s$, '"Before dinner service" — timeline in their language.', TRUE),

('dc-restaurant-end','v1 · control', $s$IF DOCS PROMISED:
Perfect — link's on its way... talk before service.

IF NO:
All good — when the season turns or the next equipment surprise hits, you'll want this relationship open... I'll check in down the road.$s$, 'Equipment-surprise seed is the restaurant callback hook.', TRUE),

-- ─── DELTCAPITAL RETAIL ──────────────────────────────────────────
('dc-retail-intro','v1 · control', $s$Hey, is this {{owner_first_name}}?

Hey — it's {{rep_name}} with Delt...

It looks like {{business_name}} may have looked into financing at some point... what was the situation — what were you looking for?

(wait — curious tone)$s$, 'Pattern-interrupt opener.', TRUE),

('dc-retail-pitch','v1 · control', $s$So with retail, here's the most common play...

Owners use this to buy inventory ahead of a season — holiday, back-to-school — when suppliers want cash now but revenue lands later...

It's revenue-based... last three months of bank statements, funding in 24 to 48 hours... payback flexes with your sales.

SOFT QUALIFICATION:
If the capital was in the account this week... what's the buy — seasonal inventory, a second location, something else?$s$, 'Inventory-ahead-of-season is the retail use case — supplier terms vs revenue timing is a pain every retailer knows.', TRUE),

('dc-retail-qual','v1 · control', $s$What would the capital go toward?

(wait for answer)

Any offers on the table... what's the actual payback on them?

Any active advances — who with, what balance?

Monthly card volume, ballpark?

When do you need to place the inventory order by?$s$, 'The order-deadline question converts vague interest into a real timeline.', TRUE),

('dc-retail-close','v1 · control', $s$Here's what I'll do — process this today and get you a real number...

Three months of bank statements — secure link coming by text...

I'll call you back in a couple hours... fair enough?$s$, 'Standard concrete close.', TRUE),

('dc-retail-end','v1 · control', $s$IF DOCS PROMISED:
Perfect — link's on its way... talk in a couple hours.

IF NO:
All good — before the next season buy comes around, worth having this open... I'll check in ahead of the holidays.$s$, 'Holiday-buy callback hook.', TRUE),

-- ─── DELTCAPITAL AUTO ────────────────────────────────────────────
('dc-auto-intro','v1 · control', $s$Hey, is this {{owner_first_name}}?

Hey — it's {{rep_name}} with Delt...

Looks like {{business_name}} may have looked into financing at some point... what was the situation — what were you looking for?

(wait — curious tone)$s$, 'Pattern-interrupt opener.', TRUE),

('dc-auto-pitch','v1 · control', $s$So with shops, here's where this usually comes in...

A big job lands and you need parts same-day... or a lift dies and the bay's earning nothing until it's replaced...
This bridges that gap so you never turn down the job.

Revenue-based... three months of bank statements... funding in 24 to 48 hours... payback flexes with sales.

SOFT QUALIFICATION:
If capital hit the account this week — what's it go toward... equipment, parts inventory, another bay?$s$, '"Never turn down the job" is the shop hook — lost jobs are lost forever, which makes cost-of-inaction concrete.', TRUE),

('dc-auto-qual','v1 · control', $s$What would the capital go toward?

(wait for answer)

Any offers on the table... what's the real daily payment on them?

Any active advances — who with, what balance?

Monthly card volume through the shop, ballpark?

And is there a job or equipment need on the table right now?$s$, 'The "job on the table" question surfaces immediate urgency.', TRUE),

('dc-auto-close','v1 · control', $s$Here's what I'll do — process this today, see exactly what I can get you...

Three months of bank statements — secure upload link by text right now...

Call you back in a couple hours with a real number... fair enough?$s$, 'Standard concrete close.', TRUE),

('dc-auto-end','v1 · control', $s$IF DOCS PROMISED:
Perfect — link's coming... talk in a couple hours.

IF NO:
All good — next time a lift dies or a big job needs same-day parts, you'll want this open... I'll check back. Good luck in the bays.$s$, 'Equipment-failure seed for the callback.', TRUE),

-- ─── DELTCAPITAL SALON ───────────────────────────────────────────
('dc-salon-intro','v1 · control', $s$Hey, is this {{owner_first_name}}?

Hey — it's {{rep_name}} with Delt...

Looks like {{business_name}} may have looked into financing at some point... what was the situation — what were you looking for?

(wait — curious tone)$s$, 'Pattern-interrupt opener. Call between appointment blocks.', TRUE),

('dc-salon-pitch','v1 · control', $s$So with salons and spas, here's the usual play...

Owners use this for equipment upgrades — chairs, lasers, hydrafacial machines — or to cover a staffing gap while new stylists build their book...

Revenue-based... three months of bank statements... funding in 24 to 48 hours... payback flexes with your sales, so a slow week is a lighter payback.

SOFT QUALIFICATION:
If capital hit the account this week — what's the upgrade... equipment, a new room, bringing on staff?$s$, 'Equipment and staffing-ramp are the salon use cases — new-stylist ramp time is a cash-flow pain owners rarely hear named.', TRUE),

('dc-salon-qual','v1 · control', $s$What would the capital go toward?

(wait for answer)

Any offers on the table... what's the actual payback?

Any active advances — who with, what balance?

Monthly card volume, ballpark?

And is there an equipment purchase or expansion you've been putting off?$s$, 'The "putting off" question surfaces latent demand.', TRUE),

('dc-salon-close','v1 · control', $s$Here's what I'll do — process this today and get you a real number...

Three months of bank statements — secure link by text right now...

Call you back between your appointments this afternoon... fair enough?$s$, 'Timeline in their language — between appointments.', TRUE),

('dc-salon-end','v1 · control', $s$IF DOCS PROMISED:
Perfect — link's on its way... talk this afternoon.

IF NO:
All good — when that equipment upgrade stops being optional, you'll want this open... I'll check in down the road.$s$, 'Upgrade-seed callback hook.', TRUE),

-- ─── DELTCAPITAL MEDICAL ─────────────────────────────────────────
('dc-medical-intro','v1 · control', $s$Hi, is this {{owner_first_name}}?

This is {{rep_name}} with Delt...

It looks like {{business_name}} may have looked into practice financing at some point... what was the situation — what were you looking for?

(wait — curious tone)

IF GATEKEEPER:
I'm calling about practice financing options — who handles that, the office manager or the doctor directly?$s$, 'Gatekeeper-aware pattern interrupt for practices.', TRUE),

('dc-medical-pitch','v1 · control', $s$So with practices, here's where this usually comes in...

Equipment — imaging, chairs, lasers — or an expansion... where the bank wants 60 days of committee meetings and the opportunity won't wait...

This is revenue-based... approval off your last three months of bank statements... funding in 24 to 48 hours... payback flexes with collections.

SOFT QUALIFICATION:
If capital hit the account this month — what's the project... equipment, a new operatory, buying out a partner?$s$, 'Bank-speed vs opportunity-speed is the practice wedge — banks love practices but move slow.', TRUE),

('dc-medical-qual','v1 · control', $s$What would the capital go toward?

(wait for answer)

Any financing offers on the table... what are the actual terms?

Any active fundings — who with, what balance?

Roughly what does the practice collect monthly?

And what's the timeline on the project?$s$, '"Collections" is the practice vocabulary for revenue — use their language.', TRUE),

('dc-medical-close','v1 · control', $s$Here's what I'll do — process this and get you a real number today...

Last three months of bank statements — I'll send a secure upload link to you or your office manager...

And I'll call back within a couple hours... fair enough?$s$, 'Offer the office-manager routing — they run the documents.', TRUE),

('dc-medical-end','v1 · control', $s$IF DOCS PROMISED:
Perfect — link's on its way... talk in a couple hours.

IF NO:
Understood — when the next equipment decision or expansion comes up, you'll want this relationship open... I'll check back next quarter.$s$, 'Quarterly professional cadence for practices.', TRUE),

-- ─── DELTCAPITAL ECOM ────────────────────────────────────────────
('dc-ecom-intro','v1 · control', $s$Hi {{owner_first_name}}, this is {{rep_name}} with Delt...

It looks like {{business_name}} may have looked into growth capital at some point... what was the situation — what were you looking for?

(wait — curious tone)$s$, 'Pattern-interrupt, e-com vocabulary ("growth capital").', TRUE),

('dc-ecom-pitch','v1 · control', $s$So with e-commerce, here's the classic play...

You've found a winning product or a converting ad... and the only thing capping growth is inventory and ad spend...
Owners use this to scale the buy and the budget ahead of a demand spike — instead of waiting on this month's payouts to fund next month's growth.

Revenue-based... three months of bank statements... funding in 24 to 48 hours... payback flexes with your sales.

SOFT QUALIFICATION:
If capital hit the account this week — where does it go... inventory, ad budget, both?$s$, 'The payout-lag pain (this month''s revenue funding next month''s growth) is the e-com wedge — ROAS-positive owners feel capital-capped, not needy.', TRUE),

('dc-ecom-qual','v1 · control', $s$Where would the capital go — inventory, ads, both?

(wait for answer)

What's monthly revenue running... and is it trending up?

Any offers on the table... what's the actual payback?

Any active advances — who with, what balance?

And what's the window — is there a launch or a season you're scaling into?$s$, 'Trend question matters — e-com underwrites on trajectory. Launch-window creates the deadline.', TRUE),

('dc-ecom-close','v1 · control', $s$Here's what I'll do — process this today and get you a real number...

Three months of bank statements — secure upload link coming by email or text, your pick...

I'll call you back in a couple hours... fair enough?$s$, 'Standard concrete close; offer email for e-com founders.', TRUE),

('dc-ecom-end','v1 · control', $s$IF DOCS PROMISED:
Perfect — link's on its way... talk in a couple hours.

IF NO:
All good — when the next launch or peak season comes around, you'll want this open... I'll check in ahead of Q4.$s$, 'Q4 is every e-com founder''s capital crunch — natural callback hook.', TRUE),

-- ═══ DELTPAY OBJECTIONS ══════════════════════════════════════════
('dp-obj-happy','v1 · verify not switch', $s$That's great to hear... and honestly, I'm not asking you to switch anything right now...

But here's the thing — most owners think they're getting good rates... until they see a comparison...
I've had dozens of "happy" customers discover they were overpaying by 30 to 40 percent.

[GREEN] IF SOFTENING:
Wouldn't it be worth five minutes to make sure you're not one of them? The analysis is completely free... worst case, I confirm you're in good shape.

[BLUE] IF STILL FIRM:
Totally fair... let me ask just one thing — do you know your effective rate... the all-in number, not the quoted one?
(if they don't know — that's the hook. nobody knows.)$s$, 'Never argue the "happy" claim — validate it, then reframe from "switch" to "verify." Verifying costs them nothing, which removes the risk from the ask.', TRUE),

('dp-obj-happy','v2 · savings frame', $s$I completely understand... many of the businesses I work with were happy with their current processor too — right up until they saw how much they could save...

Even if you're satisfied, it never hurts to get a comparison...

What if you could put an extra few hundred a month back into the business... would that be worth a five-minute look?

(wait for answer)

[RED] READY TO BOOK:
Great — easiest way is a photo of last month's statement... I'll have your number back in 24 hours.$s$, 'Softer alternative framing. Test against v1 — same objection, different emotional angle (belonging vs risk).', FALSE),

('dp-obj-email','v1 · control', $s$Yeah... a hundred percent... happy to do that...

Just so I send you the right stuff and don't waste your inbox... one quick question...
do you know right now what your effective rate is — the all-in number — or is that more of a "trust the statement" situation?

(wait for answer)

[GREEN] IF FUZZY / DON'T KNOW:
Yeah... that's actually the most common answer we hear...
And honestly, that's exactly what the email would point to anyway...
So rather than an email that just sits there... would it make more sense to grab 15 minutes and see it live on your own numbers?

[BLUE] IF THEY STILL WANT THE EMAIL:
Totally... I'll send that over...
And when you look at it... the main thing to pay attention to is the effective-rate section — that's your real all-in cost, off your actual statement... not the quoted rate they sold you.$s$, 'Email is a brush-off most of the time. Get one answer out of them before you agree to send anything. If they''re genuinely curious, pivot to the meeting; if not, anchor the email to one specific thing they must look at.', TRUE),

('dp-obj-contract','v1 · control', $s$Totally understand... and honestly, even in a contract it's worth getting the analysis...

Most contracts have exit clauses... and sometimes the savings are big enough to offset any cancellation fee entirely...

Plus — and this is the part most people miss — you'll know exactly what to negotiate when the contract IS up.

[GREEN] IF SOFTENING:
When does it renew, roughly? ... Perfect — let's run the free analysis now, and you'll walk into that renewal knowing your numbers cold.$s$, 'The contract isn''t a wall, it''s a timeline. The analysis has value in both cases: exit math now, or negotiation ammo at renewal. Always capture the renewal date.', TRUE),

('dp-obj-busy','v1 · control', $s$I totally understand you're busy...

Real quick — are you the person who handles the payment processing decisions?

(wait for answer)

[GREEN] IF YES:
Great — when's a better time for a five-minute call to see if I can save you some money... later today, or tomorrow morning?

[BLUE] IF NO:
No problem — who handles that? ... Perfect, and what's the best way to reach them?$s$, 'Don''t apologize for calling — qualify while you have them. Offer two concrete windows, never "whenever works."', TRUE),

('dp-obj-savings','v1 · control', $s$Fair question — and I can tell you're a savvy owner for asking it...

Honest answer: I don't know yet... and anyone who quotes you a number before seeing your statement is guessing.

Let's do this — 15 minutes... I'll take your statement and show you exactly what you're paying versus what you should be paying... real numbers, not a pitch.

What's easier — {{day_1}} or {{day_2}}?$s$, 'Refusing to guess IS the credibility move. Every competitor throws out a fake number; you anchor on their real statement.', TRUE),

('dp-obj-salescall','v1 · control', $s$Ha — it's a fair question... yes, I work for Delt, so I'm not calling to sell you nothing...

But this specific call is about one thing — whether your current processor is overcharging you...

Ninety seconds, one question, and if it's not relevant you can hang up on me — deal?

(wait for answer)

Do you know your effective rate — the all-in number on your statement?$s$, 'Honesty disarms the smokescreen. "You can hang up on me" gives control back — most stay on.', TRUE),

('dp-obj-dm','v1 · control', $s$No problem at all — who handles the payment processing decisions?

(wait for answer)

Perfect... and when's the best time to catch them?

One favor — could you let them know Delt called about the statement review? Takes five minutes and it's free money if we find anything...

And what's the best direct line or email for them?$s$, 'Convert the gatekeeper into a referrer. Get a name, a time, AND a direct line — three commitments, not one.', TRUE),

-- ═══ DELTCAPITAL OBJECTIONS ══════════════════════════════════════
('dc-obj-noneed','v1 · put it to work', $s$I'm sure, I'm sure — we hear that a lot...

But let me ask you this — if I was able to put $50,000 in your account this week... you're telling me you couldn't put that to work?

(wait for answer)

Of course... anybody can put capital to work...
I understand you don't need money to keep the lights on — that's not what this is...

[GREEN] IF ENGAGING:
So if I could get you capital at rates and terms that make sense... how much could you actually use right now?

[BLUE] IF STILL COLD:
Fair enough — one last thing... what's changed? Because it looks like you were looking into this not that long ago...$s$, 'Separate "need" from "use." Nobody needs money; everybody can use it at the right terms. The "what''s changed?" line re-opens prior-signal leads.', TRUE),

('dc-obj-noneed','v2 · empathy first', $s$Honestly... I empathize with you... I don't envy you — you must be getting what, 10... 20 of these calls a day?

(wait — let them vent)

Okay, I got you... and I know you're busy, so I'll make this brief — I've got other calls too...

But here's the difference — we work directly with the owner... my job is to work with you one-on-one through the whole process, not pass you around...

I know you're getting lit up with calls... but what were you originally looking for?

(wait for answer)$s$, 'Always agree first — never say "no, no, no." Disarm before you get back in. Naming the call flood makes you the one caller who gets it. Test vs v1.', FALSE),

('dc-obj-timing','v1 · control', $s$Totally fair... let me ask it this way though...

Say you were going to look at capital a month from now... three months... six months...

If I could get you the right terms NOW... in the meantime, how much could you put to use right now?

(wait for answer)

[GREEN] IF ENGAGING:
Okay — and what would it go toward? Because if the use case is real, the timing usually takes care of itself...$s$, 'Collapse the future into the present. "Later" usually means "no urgency" — the use-case question tests whether the need is real or polite deflection.', TRUE),

('dc-obj-notenough','v1 · control', $s$I hear you — you were looking for more, and I get it...

But here's the thing — I can fund THIS today... it lands in your account this week...

Could you put this to work while we build the relationship?

Because here's how it actually works — once we've got some positive payment history together... the renewal unlocks more capital, usually at better terms...

Most of our biggest fundings started smaller than this one.$s$, 'Reframe the small offer as round one, not the ceiling. Renewals at 50-60% paid down are the real LTV — sell the relationship, not the number.', TRUE),

('dc-obj-rate','v1 · control', $s$You know what — you're a hundred percent right... and honestly I'm glad I'm talking to an owner who actually prices it out...

That tells me you're doing the numbers... looking at cash flow, looking at the invoices... not just saying yes to whoever calls first... you're exactly the kind of owner we want to work with.

(pause)

[GREEN] IF ENGAGING:
So let me ask — what would get this done? What's the daily payment you'd actually feel comfortable with?

[RED] READY TO MOVE:
I could fund this today and we start the relationship there... then the renewal pricing gets better with history. Want me to run the numbers both ways?$s$, 'Agree and elevate — complimenting their diligence flips the frame from adversary to advisor. Then let THEM name the comfortable payment; now you''re negotiating structure, not defending price.', TRUE),

('dc-obj-broker','v1 · control', $s$That's great — sounds like you're already moving...

Here's what I'd do though — while you're waiting on him... send me the docs... three months of bank statements, driver's license, voided check...

While you're waiting on him... I can get you funded. Worst case, you've got two real offers to compare.

[BLUE] IF "THE DEAL IS ALREADY DONE":
Perfect — then send me the contract... if the deal's real, comparing costs you nothing...

(if they won't send it)
No problem — but between us... to me that means the deal doesn't exist yet.$s$, 'Never attack the other broker — race them. "While you''re waiting on him" makes you the backup that becomes the primary. The contract ask calls the bluff politely.', TRUE),

('dc-obj-flooded','v1 · control', $s$I empathize with you — you must be getting 50-plus calls a day... that has to be eating your whole morning... I'm sorry to hear that, honestly.

(wait — let them vent. do not pitch yet.)

So look — I'm not going to add to the pile... let me just ask straight...

What was the situation — how much were you looking for... and did anyone actually get it done for you yet?

(wait for answer)$s$, 'The vent IS the rapport. Every other caller talks over the frustration — you sit in it for one beat, then ask the only question that matters: did anyone actually deliver?', TRUE),

('dc-obj-interest','v1 · control', $s$Good question — and important distinction...

We're not a bank... and this isn't a loan, so there's no interest rate in the traditional sense...

We provide up-front capital in exchange for a fixed portion of your future receivables... one flat cost, agreed up front... it never compounds and it never grows.

And the payback flexes with your sales — slow week, lighter payback.

So the better question is the total cost against what the capital MAKES you... if {{requested_amount}} generates more than it costs, it's a good trade... want me to run those numbers with you?$s$, 'Answer honestly, then move from rate to ROI. Sophisticated owners respect the flat-cost transparency; the receivables framing is also the legally accurate one.', TRUE),

('dc-obj-email','v1 · control', $s$Yeah, of course — happy to send something over...

Just so I send the right numbers and not a generic brochure... one quick thing...
roughly how much were you thinking... and what would it go toward?

(wait for answer)

[GREEN] IF THEY ENGAGE:
Perfect — you know what, instead of an email with ranges... give me two hours and I'll come back with your ACTUAL number from underwriting... that beats any PDF I could send. Fair?

[BLUE] IF THEY STILL WANT THE EMAIL:
You got it... and when it lands, look at one thing — the payback flexibility section... that's what separates this from the fixed-payment guys stacking you up.$s$, 'Same Glencoco email pattern, capital edition: one qualifying question before agreeing, pivot to the real underwritten number, or anchor the email to one differentiator.', TRUE),

('dc-obj-busy','v1 · control', $s$Totally get it — you're running a business...

Fifteen seconds, then I'll let you go...

Are you the one who'd handle a funding decision... and is capital even on the radar this quarter?

[GREEN] IF YES:
Great — when's a better window today or tomorrow... morning or afternoon?

[BLUE] IF NO:
All good — who should I be talking to, and what's the best way to reach them?$s$, 'Respect the time, keep the two qualifying questions. Two concrete windows, never "whenever."', TRUE)

) AS v(card_slug, label, body, note, is_control)
JOIN public.playbook_cards c ON c.slug = v.card_slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.card_variants cv WHERE cv.card_id = c.id AND cv.label = v.label
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_call_playbooks() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_touch_call_playbooks ON public.call_playbooks;
CREATE TRIGGER trg_touch_call_playbooks BEFORE UPDATE ON public.call_playbooks
  FOR EACH ROW EXECUTE FUNCTION public.touch_call_playbooks();
