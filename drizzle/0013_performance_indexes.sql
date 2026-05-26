CREATE INDEX IF NOT EXISTS services_category_idx ON services(category);
CREATE INDEX IF NOT EXISTS budget_requests_user_id_idx ON budget_requests(user_id);
CREATE INDEX IF NOT EXISTS budget_requests_service_id_status_idx ON budget_requests(service_id, status);
CREATE INDEX IF NOT EXISTS proposals_request_id_idx ON proposals(request_id);
CREATE INDEX IF NOT EXISTS proposals_provider_id_idx ON proposals(provider_id);
CREATE INDEX IF NOT EXISTS proposals_client_id_idx ON proposals(client_id);
CREATE INDEX IF NOT EXISTS negotiation_messages_proposal_id_idx ON negotiation_messages(proposal_id);
