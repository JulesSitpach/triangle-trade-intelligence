-- Simple test data that doesn't require auth.users references
-- First, let's insert into workflow_completions and certificates to test analytics

-- Insert some workflow completions (these don't require user_profiles to exist)
INSERT INTO public.workflow_completions (
    id, workflow_type, product_description, hs_code, 
    classification_confidence, savings_amount, completion_time_seconds,
    steps_completed, total_steps, certificate_generated, completed_at
) VALUES
(gen_random_uuid(), 'usmca_compliance', 'Wireless networking equipment', '8517620000', 92.5, 45000.00, 420, 4, 4, true, NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'usmca_compliance', 'Computer processors', '8542310000', 88.2, 62000.00, 380, 4, 4, true, NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'usmca_compliance', 'Steel automotive parts', '8708999000', 91.3, 85000.00, 520, 4, 4, true, NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'usmca_compliance', 'LED displays', '8531200000', 94.1, 28000.00, 450, 4, 4, false, NOW() - INTERVAL '3 days'),
(gen_random_uuid(), 'usmca_compliance', 'Agricultural machinery', '8432900000', 86.4, 35000.00, 390, 4, 4, true, NOW());

-- Insert some certificates 
INSERT INTO public.certificates_generated (
    id, certificate_type, product_description, 
    hs_code, qualification_percentage, savings_amount, 
    is_valid, generated_at
) VALUES
(gen_random_uuid(), 'usmca_compliance', 'Wireless networking equipment', '8517620000', 92.5, 45000.00, true, NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'usmca_compliance', 'Computer processors', '8542310000', 88.2, 62000.00, true, NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'usmca_compliance', 'Steel automotive parts', '8708999000', 91.3, 85000.00, true, NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'usmca_compliance', 'Agricultural machinery', '8432900000', 86.4, 35000.00, true, NOW());

-- Check if data was inserted
SELECT 'Workflow completions inserted:' as status, COUNT(*) as count FROM public.workflow_completions;
SELECT 'Certificates inserted:' as status, COUNT(*) as count FROM public.certificates_generated;