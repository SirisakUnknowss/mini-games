create sequence "public"."feedbacks_id_seq";

create sequence "public"."guest_game_history_id_seq";

create sequence "public"."visitor_sessions_id_seq";

drop function if exists "public"."bump_streak_for_today"(p_user_id uuid, p_date date);


  create table "public"."feedbacks" (
    "id" bigint not null default nextval('public.feedbacks_id_seq'::regclass),
    "rating" smallint not null,
    "comment" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."feedbacks" enable row level security;


  create table "public"."guest_game_history" (
    "id" bigint not null default nextval('public.guest_game_history_id_seq'::regclass),
    "session_id" uuid not null,
    "guest_display_id" text not null,
    "mode" text not null,
    "daily_date" date,
    "level" text,
    "time_seconds" integer not null default 0,
    "mistakes" integer not null default 0,
    "hints_used" integer not null default 0,
    "score" integer not null default 0,
    "completed_at" timestamp with time zone not null default now(),
    "claimed_user_id" uuid
      );


alter table "public"."guest_game_history" enable row level security;


  create table "public"."online_sessions" (
    "session_id" uuid not null,
    "last_seen" timestamp with time zone not null default now(),
    "is_guest" boolean not null default true
      );


alter table "public"."online_sessions" enable row level security;


  create table "public"."page_views" (
    "page" text not null,
    "count" bigint not null default 0,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."page_views" enable row level security;


  create table "public"."visitor_sessions" (
    "id" bigint not null default nextval('public.visitor_sessions_id_seq'::regclass),
    "session_id" uuid not null,
    "visited_date" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone not null default now(),
    "is_guest" boolean not null default true
      );


alter table "public"."visitor_sessions" enable row level security;

alter sequence "public"."feedbacks_id_seq" owned by "public"."feedbacks"."id";

alter sequence "public"."guest_game_history_id_seq" owned by "public"."guest_game_history"."id";

alter sequence "public"."visitor_sessions_id_seq" owned by "public"."visitor_sessions"."id";

CREATE UNIQUE INDEX feedbacks_pkey ON public.feedbacks USING btree (id);

CREATE INDEX guest_game_history_claimed_idx ON public.guest_game_history USING btree (claimed_user_id) WHERE (claimed_user_id IS NOT NULL);

CREATE INDEX guest_game_history_date_idx ON public.guest_game_history USING btree (daily_date);

CREATE UNIQUE INDEX guest_game_history_pkey ON public.guest_game_history USING btree (id);

CREATE INDEX guest_game_history_session_idx ON public.guest_game_history USING btree (session_id);

CREATE UNIQUE INDEX online_sessions_pkey ON public.online_sessions USING btree (session_id);

CREATE UNIQUE INDEX page_views_pkey ON public.page_views USING btree (page);

CREATE INDEX visitor_sessions_date_idx ON public.visitor_sessions USING btree (visited_date);

CREATE UNIQUE INDEX visitor_sessions_pkey ON public.visitor_sessions USING btree (id);

CREATE UNIQUE INDEX visitor_sessions_session_id_visited_date_key ON public.visitor_sessions USING btree (session_id, visited_date);

alter table "public"."feedbacks" add constraint "feedbacks_pkey" PRIMARY KEY using index "feedbacks_pkey";

alter table "public"."guest_game_history" add constraint "guest_game_history_pkey" PRIMARY KEY using index "guest_game_history_pkey";

alter table "public"."online_sessions" add constraint "online_sessions_pkey" PRIMARY KEY using index "online_sessions_pkey";

alter table "public"."page_views" add constraint "page_views_pkey" PRIMARY KEY using index "page_views_pkey";

alter table "public"."visitor_sessions" add constraint "visitor_sessions_pkey" PRIMARY KEY using index "visitor_sessions_pkey";

alter table "public"."feedbacks" add constraint "feedbacks_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."feedbacks" validate constraint "feedbacks_rating_check";

alter table "public"."guest_game_history" add constraint "guest_game_history_claimed_user_id_fkey" FOREIGN KEY (claimed_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."guest_game_history" validate constraint "guest_game_history_claimed_user_id_fkey";

alter table "public"."visitor_sessions" add constraint "visitor_sessions_session_id_visited_date_key" UNIQUE using index "visitor_sessions_session_id_visited_date_key";

set check_function_bodies = off;

create or replace view "public"."guest_leaderboard_view" as  SELECT session_id,
    guest_display_id,
    daily_date,
    time_seconds,
    mistakes,
    hints_used,
    score,
    completed_at,
    claimed_user_id,
    (rank() OVER (PARTITION BY daily_date ORDER BY score DESC, time_seconds))::integer AS rank,
    (count(*) OVER (PARTITION BY daily_date))::integer AS total_players
   FROM public.guest_game_history g
  WHERE ((mode = 'daily'::text) AND (claimed_user_id IS NULL));


CREATE OR REPLACE FUNCTION public.increment_view(p_page text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE new_count BIGINT;
BEGIN
  INSERT INTO page_views (page, count, updated_at)
    VALUES (p_page, 1, now())
  ON CONFLICT (page) DO UPDATE
    SET count = page_views.count + 1, updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.migrate_guest_scores(p_session_id uuid, p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  migrated INT := 0;
BEGIN
  -- Insert unclaimed guest history into user_game_history
  INSERT INTO user_game_history (
    user_id, mode, daily_date, level,
    time_seconds, mistakes, hints_used, score, completed_at
  )
  SELECT
    p_user_id, mode, daily_date, level,
    time_seconds, mistakes, hints_used, score, completed_at
  FROM guest_game_history
  WHERE session_id = p_session_id
    AND claimed_user_id IS NULL
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS migrated = ROW_COUNT;

  -- Mark as claimed
  UPDATE guest_game_history
     SET claimed_user_id = p_user_id
   WHERE session_id = p_session_id
     AND claimed_user_id IS NULL;

  RETURN migrated;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.bump_streak_for_today(p_user_id uuid, p_date date)
 RETURNS TABLE(out_current_streak integer, out_longest_streak integer, is_new_milestone boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_last DATE;
  v_current INTEGER;
  v_longest INTEGER;
  v_milestone BOOLEAN := false;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT last_daily_played, current_streak, longest_streak
  INTO v_last, v_current, v_longest
  FROM user_progression WHERE user_id = p_user_id;

  IF v_last IS NULL OR p_date = v_last + interval '1 day' THEN
    v_current := COALESCE(v_current, 0) + 1;
  ELSIF p_date = v_last THEN
    NULL;
  ELSE
    v_current := 1;
  END IF;

  IF v_current > COALESCE(v_longest, 0) THEN
    v_longest := v_current;
  END IF;

  IF v_current IN (3, 7, 14, 30, 50, 100, 200, 365) THEN
    v_milestone := true;
  END IF;

  UPDATE user_progression
  SET current_streak = v_current,
      longest_streak = v_longest,
      last_daily_played = p_date,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current, v_longest, v_milestone;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  generated_username TEXT;
BEGIN
  generated_username := 'user_' || substr(NEW.id::text, 1, 8);
  INSERT INTO profiles (id, username, is_anonymous)
  VALUES (NEW.id, generated_username, COALESCE(NEW.is_anonymous, false))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO user_wallet (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO user_progression (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO coin_transactions (user_id, amount, reason, balance_after, metadata)
  VALUES (NEW.id, 100, 'signup_bonus', 100, '{}'::jsonb);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.grant_coins(p_user_id uuid, p_amount integer, p_reason text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_amount = 0 THEN
    SELECT coins INTO v_new_balance FROM user_wallet WHERE user_id = p_user_id;
    RETURN v_new_balance;
  END IF;
  UPDATE user_wallet
  SET coins = coins + p_amount,
    total_earned = CASE WHEN p_amount > 0 THEN total_earned + p_amount ELSE total_earned END,
    total_spent = CASE WHEN p_amount < 0 THEN total_spent + (-p_amount) ELSE total_spent END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING coins INTO v_new_balance;
  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'wallet not found for user';
  END IF;
  INSERT INTO coin_transactions (user_id, amount, reason, metadata, balance_after)
  VALUES (p_user_id, p_amount, p_reason, p_metadata, v_new_balance);
  RETURN v_new_balance;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.grant_xp(p_user_id uuid, p_amount integer)
 RETURNS TABLE(new_xp bigint, new_level integer, leveled_up boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_xp BIGINT;
  v_level INTEGER;
  v_old_level INTEGER;
  v_xp_for_level INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT xp, level INTO v_xp, v_old_level FROM user_progression WHERE user_id = p_user_id;
  IF v_xp IS NULL THEN
    RAISE EXCEPTION 'progression not found for user';
  END IF;
  v_xp := v_xp + p_amount;
  v_level := v_old_level;
  LOOP
    IF v_level >= 100 THEN EXIT; END IF;
    v_xp_for_level := floor(100 * power(v_level, 1.6));
    IF v_xp < v_xp_for_level THEN EXIT; END IF;
    v_xp := v_xp - v_xp_for_level;
    v_level := v_level + 1;
  END LOOP;
  UPDATE user_progression
  SET xp = v_xp, level = v_level, updated_at = now()
  WHERE user_id = p_user_id;
  RETURN QUERY SELECT v_xp, v_level, v_level > v_old_level;
END;
$function$
;

grant delete on table "public"."feedbacks" to "anon";

grant insert on table "public"."feedbacks" to "anon";

grant references on table "public"."feedbacks" to "anon";

grant select on table "public"."feedbacks" to "anon";

grant trigger on table "public"."feedbacks" to "anon";

grant truncate on table "public"."feedbacks" to "anon";

grant update on table "public"."feedbacks" to "anon";

grant delete on table "public"."feedbacks" to "authenticated";

grant insert on table "public"."feedbacks" to "authenticated";

grant references on table "public"."feedbacks" to "authenticated";

grant select on table "public"."feedbacks" to "authenticated";

grant trigger on table "public"."feedbacks" to "authenticated";

grant truncate on table "public"."feedbacks" to "authenticated";

grant update on table "public"."feedbacks" to "authenticated";

grant delete on table "public"."feedbacks" to "service_role";

grant insert on table "public"."feedbacks" to "service_role";

grant references on table "public"."feedbacks" to "service_role";

grant select on table "public"."feedbacks" to "service_role";

grant trigger on table "public"."feedbacks" to "service_role";

grant truncate on table "public"."feedbacks" to "service_role";

grant update on table "public"."feedbacks" to "service_role";

grant delete on table "public"."guest_game_history" to "anon";

grant insert on table "public"."guest_game_history" to "anon";

grant references on table "public"."guest_game_history" to "anon";

grant select on table "public"."guest_game_history" to "anon";

grant trigger on table "public"."guest_game_history" to "anon";

grant truncate on table "public"."guest_game_history" to "anon";

grant update on table "public"."guest_game_history" to "anon";

grant delete on table "public"."guest_game_history" to "authenticated";

grant insert on table "public"."guest_game_history" to "authenticated";

grant references on table "public"."guest_game_history" to "authenticated";

grant select on table "public"."guest_game_history" to "authenticated";

grant trigger on table "public"."guest_game_history" to "authenticated";

grant truncate on table "public"."guest_game_history" to "authenticated";

grant update on table "public"."guest_game_history" to "authenticated";

grant delete on table "public"."guest_game_history" to "service_role";

grant insert on table "public"."guest_game_history" to "service_role";

grant references on table "public"."guest_game_history" to "service_role";

grant select on table "public"."guest_game_history" to "service_role";

grant trigger on table "public"."guest_game_history" to "service_role";

grant truncate on table "public"."guest_game_history" to "service_role";

grant update on table "public"."guest_game_history" to "service_role";

grant delete on table "public"."online_sessions" to "anon";

grant insert on table "public"."online_sessions" to "anon";

grant references on table "public"."online_sessions" to "anon";

grant select on table "public"."online_sessions" to "anon";

grant trigger on table "public"."online_sessions" to "anon";

grant truncate on table "public"."online_sessions" to "anon";

grant update on table "public"."online_sessions" to "anon";

grant delete on table "public"."online_sessions" to "authenticated";

grant insert on table "public"."online_sessions" to "authenticated";

grant references on table "public"."online_sessions" to "authenticated";

grant select on table "public"."online_sessions" to "authenticated";

grant trigger on table "public"."online_sessions" to "authenticated";

grant truncate on table "public"."online_sessions" to "authenticated";

grant update on table "public"."online_sessions" to "authenticated";

grant delete on table "public"."online_sessions" to "service_role";

grant insert on table "public"."online_sessions" to "service_role";

grant references on table "public"."online_sessions" to "service_role";

grant select on table "public"."online_sessions" to "service_role";

grant trigger on table "public"."online_sessions" to "service_role";

grant truncate on table "public"."online_sessions" to "service_role";

grant update on table "public"."online_sessions" to "service_role";

grant delete on table "public"."page_views" to "anon";

grant insert on table "public"."page_views" to "anon";

grant references on table "public"."page_views" to "anon";

grant select on table "public"."page_views" to "anon";

grant trigger on table "public"."page_views" to "anon";

grant truncate on table "public"."page_views" to "anon";

grant update on table "public"."page_views" to "anon";

grant delete on table "public"."page_views" to "authenticated";

grant insert on table "public"."page_views" to "authenticated";

grant references on table "public"."page_views" to "authenticated";

grant select on table "public"."page_views" to "authenticated";

grant trigger on table "public"."page_views" to "authenticated";

grant truncate on table "public"."page_views" to "authenticated";

grant update on table "public"."page_views" to "authenticated";

grant delete on table "public"."page_views" to "service_role";

grant insert on table "public"."page_views" to "service_role";

grant references on table "public"."page_views" to "service_role";

grant select on table "public"."page_views" to "service_role";

grant trigger on table "public"."page_views" to "service_role";

grant truncate on table "public"."page_views" to "service_role";

grant update on table "public"."page_views" to "service_role";

grant delete on table "public"."visitor_sessions" to "anon";

grant insert on table "public"."visitor_sessions" to "anon";

grant references on table "public"."visitor_sessions" to "anon";

grant select on table "public"."visitor_sessions" to "anon";

grant trigger on table "public"."visitor_sessions" to "anon";

grant truncate on table "public"."visitor_sessions" to "anon";

grant update on table "public"."visitor_sessions" to "anon";

grant delete on table "public"."visitor_sessions" to "authenticated";

grant insert on table "public"."visitor_sessions" to "authenticated";

grant references on table "public"."visitor_sessions" to "authenticated";

grant select on table "public"."visitor_sessions" to "authenticated";

grant trigger on table "public"."visitor_sessions" to "authenticated";

grant truncate on table "public"."visitor_sessions" to "authenticated";

grant update on table "public"."visitor_sessions" to "authenticated";

grant delete on table "public"."visitor_sessions" to "service_role";

grant insert on table "public"."visitor_sessions" to "service_role";

grant references on table "public"."visitor_sessions" to "service_role";

grant select on table "public"."visitor_sessions" to "service_role";

grant trigger on table "public"."visitor_sessions" to "service_role";

grant truncate on table "public"."visitor_sessions" to "service_role";

grant update on table "public"."visitor_sessions" to "service_role";


  create policy "anon_insert"
  on "public"."feedbacks"
  as permissive
  for insert
  to anon
with check (true);



  create policy "anon_read"
  on "public"."feedbacks"
  as permissive
  for select
  to anon
using (true);



  create policy "guest_game_claim"
  on "public"."guest_game_history"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "guest_game_insert"
  on "public"."guest_game_history"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "guest_game_select"
  on "public"."guest_game_history"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "online_sessions_all"
  on "public"."online_sessions"
  as permissive
  for all
  to anon, authenticated
using (true)
with check (true);



  create policy "allow_read"
  on "public"."page_views"
  as permissive
  for select
  to anon
using (true);



  create policy "visitor_sessions_insert"
  on "public"."visitor_sessions"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "visitor_sessions_select"
  on "public"."visitor_sessions"
  as permissive
  for select
  to anon, authenticated
using (true);



