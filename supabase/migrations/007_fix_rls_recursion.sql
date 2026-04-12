-- ============================================================
-- Fix infinite recursion in group_members RLS policies
-- The original policy queried group_members FROM WITHIN group_members,
-- causing Postgres to throw "infinite recursion detected in policy".
-- Solution: SECURITY DEFINER function that bypasses RLS for the inner check.
-- ============================================================

-- 1. Helper function: returns the group IDs the current user belongs to.
--    SECURITY DEFINER bypasses RLS so there is no recursive policy check.
CREATE OR REPLACE FUNCTION public.user_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT group_id FROM public.group_members WHERE user_id = auth.uid();
$$;

-- 2. Recreate the recursive group_members SELECT policy
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;
CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT
  USING (group_id IN (SELECT public.user_group_ids()));

-- 3. Also fix deceased SELECT policy — it too queries group_members, which
--    previously relied on the broken recursive policy above.
DROP POLICY IF EXISTS "Group members can view deceased" ON public.deceased;
CREATE POLICY "Group members can view deceased"
  ON public.deceased FOR SELECT
  USING (group_id IN (SELECT public.user_group_ids()));

DROP POLICY IF EXISTS "Group members can add deceased" ON public.deceased;
CREATE POLICY "Group members can add deceased"
  ON public.deceased FOR INSERT
  WITH CHECK (
    group_id IN (SELECT public.user_group_ids())
    AND auth.uid() = created_by
  );

DROP POLICY IF EXISTS "Admins can update deceased" ON public.deceased;
CREATE POLICY "Admins can update deceased"
  ON public.deceased FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can delete deceased" ON public.deceased;
CREATE POLICY "Admins can delete deceased"
  ON public.deceased FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Fix yahrzeit_events policy
DROP POLICY IF EXISTS "Group members can view yahrzeit events" ON public.yahrzeit_events;
CREATE POLICY "Group members can view yahrzeit events"
  ON public.yahrzeit_events FOR SELECT
  USING (
    deceased_id IN (
      SELECT d.id FROM public.deceased d
      WHERE d.group_id IN (SELECT public.user_group_ids())
    )
  );

-- 5. Fix gathering_events policies
DROP POLICY IF EXISTS "Group members can view gatherings" ON public.gathering_events;
CREATE POLICY "Group members can view gatherings"
  ON public.gathering_events FOR SELECT
  USING (
    deceased_id IN (
      SELECT d.id FROM public.deceased d
      WHERE d.group_id IN (SELECT public.user_group_ids())
    )
  );

DROP POLICY IF EXISTS "Group members can create gatherings" ON public.gathering_events;
CREATE POLICY "Group members can create gatherings"
  ON public.gathering_events FOR INSERT
  WITH CHECK (
    deceased_id IN (
      SELECT d.id FROM public.deceased d
      WHERE d.group_id IN (SELECT public.user_group_ids())
    )
    AND auth.uid() = created_by
  );
