-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deceased ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yahrzeit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gathering_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS policies
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow viewing other members' basic info (for group display)
CREATE POLICY "Group members can see each other"
  ON public.users FOR SELECT
  USING (
    id IN (
      SELECT gm.user_id FROM public.group_members gm
      WHERE gm.group_id IN (
        SELECT group_id FROM public.group_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- FAMILY_GROUPS policies
-- ============================================================
CREATE POLICY "Group members can view their groups"
  ON public.family_groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON public.family_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Group admins can update group"
  ON public.family_groups FOR UPDATE
  USING (
    id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Group admins can delete group"
  ON public.family_groups FOR DELETE
  USING (
    id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow joining via invite code (anyone authenticated can read to verify)
CREATE POLICY "Authenticated users can lookup by invite code"
  ON public.family_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- GROUP_MEMBERS policies
-- ============================================================
CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage group members"
  ON public.group_members FOR ALL
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- DECEASED policies
-- ============================================================
CREATE POLICY "Group members can view deceased"
  ON public.deceased FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add deceased"
  ON public.deceased FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Admins can update deceased"
  ON public.deceased FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Admins can delete deceased"
  ON public.deceased FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- YAHRZEIT_EVENTS policies
-- ============================================================
CREATE POLICY "Group members can view yahrzeit events"
  ON public.yahrzeit_events FOR SELECT
  USING (
    deceased_id IN (
      SELECT d.id FROM public.deceased d
      JOIN public.group_members gm ON d.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

-- Service role handles inserts via Edge Functions
CREATE POLICY "Service role can manage yahrzeit events"
  ON public.yahrzeit_events FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- REMINDER_SCHEDULE policies
-- ============================================================
CREATE POLICY "Users can manage own reminders"
  ON public.reminder_schedule FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- GATHERING_EVENTS policies
-- ============================================================
CREATE POLICY "Group members can view gatherings"
  ON public.gathering_events FOR SELECT
  USING (
    deceased_id IN (
      SELECT d.id FROM public.deceased d
      JOIN public.group_members gm ON d.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create gatherings"
  ON public.gathering_events FOR INSERT
  WITH CHECK (
    deceased_id IN (
      SELECT d.id FROM public.deceased d
      JOIN public.group_members gm ON d.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Creator can update/delete gatherings"
  ON public.gathering_events FOR ALL
  USING (created_by = auth.uid());
