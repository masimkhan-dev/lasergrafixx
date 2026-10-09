-- Real clinic details from the clinic's own banner
INSERT INTO public.settings (key, value) VALUES
  ('clinic_name', 'Laser Grafix'),
  ('clinic_phone', '0309-9593182'),
  ('clinic_address', 'City Height Basement, Near Pull Al-Habib & Soneri Bank, Kohat Road, Peshawar'),
  ('receipt_header', 'Skin & Hair — Advanced Care. Visible Results.'),
  ('receipt_footer', 'Thank you for visiting Laser Grafix'),
  ('social_handle', '@lasergrafix')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Replace the seeded demo catalogue with the clinic's real price list.
UPDATE public.services SET is_active = false;

INSERT INTO public.services (name, category, price, description, is_active) VALUES
  ('Beard Line Laser', 'Hair Removal', 1000, 'Laser hair removal — beard line shaping', true),
  ('Full Face Laser (Female)', 'Hair Removal', 2500, 'Laser hair removal — full face, female', true),
  ('Underarms Laser', 'Hair Removal', 2500, 'Laser hair removal — underarms', true),
  ('Arms Laser', 'Hair Removal', 8000, 'Laser hair removal — full arms', true),
  ('Full Legs Laser', 'Hair Removal', 8000, 'Laser hair removal — full legs', true),
  ('Chest & Abdomen Laser', 'Hair Removal', 7000, 'Laser hair removal — chest and abdomen', true),
  ('Full Back Laser', 'Hair Removal', 7000, 'Laser hair removal — full back', true),
  ('Shoulder Laser', 'Hair Removal', 4500, 'Laser hair removal — shoulders', true),
  ('Arms & Shoulder Laser', 'Hair Removal', 12500, 'Laser hair removal — arms with shoulders package', true),
  ('HydraFacial', 'Skin Treatment', 3500, 'Deep cleansing and hydration facial', true),
  ('Micro Needling', 'Skin Treatment', 3500, 'Collagen induction therapy', true),
  ('BB Glow', 'Skin Treatment', 4000, 'Semi-permanent glow and tone treatment', true),
  ('Chemical Peel', 'Skin Treatment', 4000, 'Renews skin tone and texture', true),
  ('PRP Face', 'Skin Treatment', 4000, 'Platelet rich plasma for facial skin', true),
  ('PRP Hair', 'Skin Treatment', 3000, 'Platelet rich plasma for hair growth', true),
  ('Whitening Drip (Single)', 'Skin Treatment', 4000, 'Skin whitening IV drip — single session', true),
  ('Whitening Drip (Premium)', 'Skin Treatment', 7000, 'Skin whitening IV drip — premium formulation', true),
  ('Mole Removal', 'Skin Treatment', 500, 'Per mole removal', true)
ON CONFLICT DO NOTHING;
