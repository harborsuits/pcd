-- Phase 1: Make lead_id nullable for unmatched inbound SMS
ALTER TABLE lead_outreach_events ALTER COLUMN lead_id DROP NOT NULL;

-- Add index for querying unmatched events efficiently
CREATE INDEX IF NOT EXISTS idx_lead_outreach_events_unmatched 
ON lead_outreach_events (status) 
WHERE lead_id IS NULL;

-- Add index for querying by direction (inbound vs outbound)
CREATE INDEX IF NOT EXISTS idx_lead_outreach_events_direction
ON lead_outreach_events (direction, created_at DESC);