-- Create analytics_events table for tracking project events including failures
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow users to view events for projects they are members of
CREATE POLICY "Users can view analytics for their projects" ON public.analytics_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = analytics_events.project_id
            AND project_members.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = analytics_events.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Allow users to insert events for projects they have access to
CREATE POLICY "Users can insert analytics events" ON public.analytics_events
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND (
            EXISTS (
                SELECT 1 FROM public.project_members
                WHERE project_members.project_id = analytics_events.project_id
                AND project_members.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE projects.id = analytics_events.project_id
                AND projects.owner_id = auth.uid()
            )
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_project_id ON public.analytics_events(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
