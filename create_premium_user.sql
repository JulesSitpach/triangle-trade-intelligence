-- Create Premium user for development testing
INSERT INTO user_profiles (
  id,
  email,
  company_name,
  full_name,
  subscription_tier,
  status,
  created_at,
  terms_accepted_at
) VALUES (
  gen_random_uuid(),
  'dev@triangleintelligence.com',
  'Triangle Dev Company',
  'Developer Admin',
  'Premium',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  subscription_tier = 'Premium',
  status = 'active';
