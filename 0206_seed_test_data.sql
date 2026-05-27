-- あいくっく テストデータ投入SQL
-- Supabase SQL Editorで実行してください。
--
-- 使い方:
--   - Authユーザーが1人だけなら、このまま実行できます。
--   - 特定ユーザーに紐づけたい場合は、下の seed_user_id_text を
--     Authentication > Users のユーザーIDに置き換えてください。
--
-- 注意:
--   - auth.users にユーザーが存在している必要があります。
--   - このSQLは barcode = 'seed-*' / url = 'seed:aicook' / memo = '[seed]...'
--     のデータだけを入れ直します。

begin;

do $$
declare
  seed_user_id_text constant text := 'REPLACE_WITH_AUTH_USER_ID';

  v_user_id uuid;
  v_user_mail text;

  v_salmon_id bigint;
  v_komatsuna_id bigint;
  v_milk_id bigint;
  v_egg_id bigint;
  v_onion_id bigint;
  v_rice_id bigint;

  v_recipe_1_id uuid;
  v_recipe_2_id uuid;
begin
  if seed_user_id_text = 'REPLACE_WITH_AUTH_USER_ID' then
    select au.id, au.email
      into v_user_id, v_user_mail
    from auth.users au
    order by au.created_at asc
    limit 1;
  else
    select au.id, au.email
      into v_user_id, v_user_mail
    from auth.users au
    where au.id = seed_user_id_text::uuid
    limit 1;
  end if;

  if v_user_id is null then
    raise exception 'auth.users に対象ユーザーがありません。seed_user_id_text を確認してください。';
  end if;

  insert into public.users (
    user_id,
    user_name,
    user_mail,
    user_age,
    gender
  )
  values (
    v_user_id,
    'テストユーザー',
    coalesce(v_user_mail, 'seed-' || v_user_id::text || '@example.com'),
    20,
    '未設定'
  )
  on conflict (user_id) do update
  set
    user_name = excluded.user_name,
    user_mail = excluded.user_mail,
    user_age = excluded.user_age,
    gender = excluded.gender;

  -- seedデータを入れ直すため、seed印のデータだけ削除
  delete from public.shopping
  where user_id = v_user_id
    and memo like '[seed]%';

  delete from public.favorites f
  using public.recipes r
  where f.recipe_id = r.recipe_id
    and r.user_id = v_user_id
    and r.url = 'seed:aicook';

  delete from public.cooking_history h
  using public.recipes r
  where h.recipe_id = r.recipe_id
    and r.user_id = v_user_id
    and r.url = 'seed:aicook';

  delete from public.recipe_ingredients ri
  using public.recipes r
  where ri.recipe_id = r.recipe_id
    and r.user_id = v_user_id
    and r.url = 'seed:aicook';

  delete from public.recipes
  where user_id = v_user_id
    and url = 'seed:aicook';

  delete from public.inventory
  where user_id = v_user_id
    and memo like '[seed]%';

  delete from public.ingredient_management
  where user_id = v_user_id
    and barcode like 'seed-%';

  -- 食材マスター
  insert into public.ingredient_management (
    user_id,
    ingredient_name,
    category,
    barcode
  )
  values (v_user_id, '鮭切り身', '魚', 'seed-salmon')
  returning ingredient_id into v_salmon_id;

  insert into public.ingredient_management (
    user_id,
    ingredient_name,
    category,
    barcode
  )
  values (v_user_id, '小松菜', '野菜', 'seed-komatsuna')
  returning ingredient_id into v_komatsuna_id;

  insert into public.ingredient_management (
    user_id,
    ingredient_name,
    category,
    barcode
  )
  values (v_user_id, '牛乳', '乳製品', 'seed-milk')
  returning ingredient_id into v_milk_id;

  insert into public.ingredient_management (
    user_id,
    ingredient_name,
    category,
    barcode
  )
  values (v_user_id, '卵', '卵', 'seed-egg')
  returning ingredient_id into v_egg_id;

  insert into public.ingredient_management (
    user_id,
    ingredient_name,
    category,
    barcode
  )
  values (v_user_id, '玉ねぎ', '野菜', 'seed-onion')
  returning ingredient_id into v_onion_id;

  insert into public.ingredient_management (
    user_id,
    ingredient_name,
    category,
    barcode
  )
  values (v_user_id, '米', '主食', 'seed-rice')
  returning ingredient_id into v_rice_id;

  -- 在庫
  insert into public.inventory (
    ingredient_id,
    user_id,
    quantity,
    gram,
    expiration_date,
    purchase_date,
    memo
  )
  values
    (v_salmon_id, v_user_id, null, 320, current_date, current_date - 1, '[seed] 今日使いたい魚'),
    (v_komatsuna_id, v_user_id, 1, null, current_date + 1, current_date - 2, '[seed] 1束'),
    (v_milk_id, v_user_id, null, 500, current_date + 2, current_date - 3, '[seed] ml相当をgram欄で管理'),
    (v_egg_id, v_user_id, 6, null, current_date + 7, current_date - 1, '[seed] 6個入り'),
    (v_onion_id, v_user_id, 3, null, current_date + 10, current_date - 4, '[seed] 常備野菜'),
    (v_rice_id, v_user_id, null, 2000, current_date + 60, current_date - 14, '[seed] 米びつ');

  -- 保存済みレシピ例 1
  insert into public.recipes (
    user_id,
    name,
    cook_time,
    cook_process,
    url
  )
  values (
    v_user_id,
    '鮭と小松菜のミルク煮',
    25,
    '1. 鮭を一口大に切る
2. 小松菜と玉ねぎを食べやすく切る
3. フライパンで玉ねぎ、鮭、小松菜を炒める
4. 牛乳を加えて弱火で煮る
5. 塩こしょうで味を整える',
    'seed:aicook'
  )
  returning recipe_id into v_recipe_1_id;

  insert into public.recipe_ingredients (
    recipe_id,
    ingredient_id,
    required_amount,
    unit
  )
  values
    (v_recipe_1_id, v_salmon_id, 120, 'g'),
    (v_recipe_1_id, v_komatsuna_id, 0.5, '個'),
    (v_recipe_1_id, v_milk_id, 150, 'ml'),
    (v_recipe_1_id, v_onion_id, 0.5, '個');

  -- 保存済みレシピ例 2
  insert into public.recipes (
    user_id,
    name,
    cook_time,
    cook_process,
    url
  )
  values (
    v_user_id,
    '小松菜と卵の雑炊',
    15,
    '1. 小松菜を細かく切る
2. ご飯を水で軽く煮る
3. 小松菜を加えて火を通す
4. 溶き卵を回し入れる
5. 塩やだしで味を整える',
    'seed:aicook'
  )
  returning recipe_id into v_recipe_2_id;

  insert into public.recipe_ingredients (
    recipe_id,
    ingredient_id,
    required_amount,
    unit
  )
  values
    (v_recipe_2_id, v_rice_id, 120, 'g'),
    (v_recipe_2_id, v_komatsuna_id, 0.25, '個'),
    (v_recipe_2_id, v_egg_id, 1, '個');

  insert into public.favorites (
    user_id,
    recipe_id
  )
  values (
    v_user_id,
    v_recipe_1_id
  )
  on conflict (user_id, recipe_id) do nothing;

  insert into public.shopping (
    user_id,
    ingredient_id,
    necessary_amount,
    unit,
    memo,
    delete_flag
  )
  values
    (v_user_id, v_salmon_id, 200, 'g', '[seed] 追加で買う候補', false),
    (v_user_id, null, 1, '本', '[seed] めんつゆ', false);

  raise notice 'seed completed for user_id=%', v_user_id;
end $$;

commit;
