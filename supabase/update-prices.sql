-- =========================================================
--  PRICE LIST — sync an existing database to the current list
-- =========================================================
--  The seed in schema.sql only fills in services that don't exist yet, so it will never change a
--  price on a database that has already been set up. Run this to bring an existing database in
--  line with the list below.
--
--  These are the prices shown to customers, so check every line before running it. Anything you
--  change here can also be changed later under Admin → Services, one service at a time.
--
--  Benchmarks used (Copenhagen area, 2026): brow threading 115–160 kr, women's cut 400–595 kr,
--  classic manicure 250–300 kr, gel polish on hands 350–400 kr, gel/acrylic full set 450–600 kr.
--  A home-based salon normally sits below high-street rates, and these do.
-- =========================================================

update public.services s
set price = v.price,
    duration_minutes = v.duration_minutes,
    description = v.description,
    category = v.category,
    sort_order = v.sort_order
from (
  values
    -- name,             category, price, minutes, description,                                        order
    ('Threading',        'Face',      50, 15, 'Precise eyebrow and facial hair threading.',                1),
    ('Facial',           'Face',     450, 45, 'Cleansing and rejuvenating facial treatment.',              2),
    ('Cleansing',        'Face',     300, 30, 'Deep pore cleansing facial.',                               3),
    ('Hair Cut',         'Hair',     350, 45, 'Style consultation and precision haircut.',                 4),
    ('Manicure',         'Nails',    275, 40, 'Classic manicure with polish.',                             5),
    ('Pedicure',         'Nails',    375, 50, 'Relaxing pedicure with polish.',                            6),
    ('Gel Nail',         'Nails',    350, 45, 'Long-lasting gel polish application.',                      7),
    ('Acrylic Nail',     'Nails',    450, 60, 'Full set of acrylic nails.',                                8),
    ('Nail Extension',   'Nails',    500, 60, 'Nail extensions with custom shape and length.',             9),
    ('Waxing',           'Body',     200, 30, 'Smooth, long-lasting hair removal.',                       10)
) as v(name, category, price, duration_minutes, description, sort_order)
where lower(s.name) = lower(v.name);

-- Show the result so you can check it at a glance.
select name, category, price || ' kr.' as price, duration_minutes || ' min' as duration
from public.services
order by sort_order;
