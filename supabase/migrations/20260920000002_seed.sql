-- Seed zones, items. Idempotent.
insert into zones (slug, name, max_instances, is_persistent) values
  ('forest', 'Whispering Forest', 20, true),
  ('ruins', 'Sunken Ruins', 20, true),
  ('arena', 'Duel Arena', 10, true)
on conflict (slug) do update set name = excluded.name;

insert into items (slug, name, rarity, slot, stats) values
  ('blade-common-1', 'Apprentice Blade', 'common', 'weapon', '{"atk": 3}'),
  ('blade-rare-1', 'Ranger Fang', 'rare', 'weapon', '{"atk": 7}'),
  ('blade-epic-1', 'Emberbrand', 'epic', 'weapon', '{"atk": 12}'),
  ('blade-legend-1', 'Doomcaller', 'legendary', 'weapon', '{"atk": 20}'),
  ('armor-common-1', 'Cloth Wrap', 'common', 'armor', '{"def": 2}'),
  ('armor-rare-1', 'Ironweave', 'rare', 'armor', '{"def": 5}'),
  ('armor-epic-1', 'Dragonscale', 'epic', 'armor', '{"def": 9}'),
  ('armor-legend-1', 'Aegis of Dawn', 'legendary', 'armor', '{"def": 14}'),
  ('trinket-common-1', 'Lucky Pebble', 'common', 'trinket', '{"hp": 10}'),
  ('trinket-rare-1', 'Moon Charm', 'rare', 'trinket', '{"hp": 25}'),
  ('trinket-epic-1', 'Phoenix Feather', 'epic', 'trinket', '{"hp": 45}'),
  ('trinket-legend-1', 'Crown Fragment', 'legendary', 'trinket', '{"hp": 80}')
on conflict (slug) do nothing;
