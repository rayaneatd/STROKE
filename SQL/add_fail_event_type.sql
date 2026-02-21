-- Migration to add 'FAIL' to allowed event_types in analytics_events

-- Drop the existing check constraint
ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;

-- Re-add the constraint with 'FAIL' included
ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_event_type_check 
    CHECK (event_type = ANY (ARRAY['UPLOAD', 'QUALIFY', 'REJECT', 'CONTACT', 'FAIL']));
