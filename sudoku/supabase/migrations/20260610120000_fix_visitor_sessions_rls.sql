-- Add update policy for visitor_sessions to allow upserting duplicate sessions
CREATE POLICY "visitor_sessions_update"
  ON public.visitor_sessions
  AS PERMISSIVE
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
