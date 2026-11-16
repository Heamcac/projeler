CREATE INDEX IF NOT EXISTS idx_events_created ON request_events(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_created ON request_events(event_type, created_at DESC);
