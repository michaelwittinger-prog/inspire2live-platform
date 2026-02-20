/**
 * Centralized demo/fallback data for all pages.
 * Used when Supabase returns empty results (no seed data applied).
 * When real DB data exists, it takes priority.
 */

export const DEMO_INITIATIVE_IDS = {
  palliative: 'demo-init-0001-0000-000000000001',
  earlyDetection: 'demo-init-0002-0000-000000000002',
  trialAccess: 'demo-init-0003-0000-000000000003',
  survivorship: 'demo-init-0004-0000-000000000004',
  immunotherapy: 'demo-init-0005-0000-000000000005',
  genomics: 'demo-init-0006-0000-000000000006',
}

export const DEMO_INITIATIVES = [
  {
    id: DEMO_INITIATIVE_IDS.palliative,
    title: 'Palliative Care Access in Sub-Saharan Africa',
    phase: 'execution',
    status: 'active',
    pillar: 'Inspire2Go',
    member_count: 12,
    open_tasks: 8,
    blocked_tasks: 1,
    completed_milestones: 3,
    total_milestones: 7,
    approaching_milestones: 1,
    overdue_milestones: 0,
    last_activity_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    countries: ['GH', 'NG', 'KE'],
    cancer_types: ['All solid tumors', 'Palliative care'],
    description: 'Expanding access to quality palliative care across 3 Sub-Saharan African countries through training, policy advocacy, and community partnerships.',
    objectives: ['Train 200 healthcare workers in palliative care', 'Establish 5 new palliative care units', 'Develop country-specific policy recommendations'],
    lead: { name: 'Sophie van der Berg', role: 'HubCoordinator', country: 'NL' },
  },
  {
    id: DEMO_INITIATIVE_IDS.earlyDetection,
    title: 'Early Detection Biomarkers — Breast Cancer',
    phase: 'research',
    status: 'active',
    pillar: 'Inspire2Live',
    member_count: 8,
    open_tasks: 5,
    blocked_tasks: 0,
    completed_milestones: 2,
    total_milestones: 6,
    approaching_milestones: 0,
    overdue_milestones: 0,
    last_activity_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    countries: ['NL', 'JP', 'US'],
    cancer_types: ['Breast cancer'],
    description: 'Multi-center study evaluating liquid biopsy biomarkers for early breast cancer detection in high-risk populations.',
    objectives: ['Collect 500 patient samples', 'Validate 3 biomarker panels', 'Publish interim results'],
    lead: { name: 'Kai Tanaka', role: 'Researcher', country: 'JP' },
  },
  {
    id: DEMO_INITIATIVE_IDS.trialAccess,
    title: 'Clinical Trial Access for Rare Cancers',
    phase: 'planning',
    status: 'active',
    pillar: 'Inspire2Live',
    member_count: 6,
    open_tasks: 3,
    blocked_tasks: 2,
    completed_milestones: 0,
    total_milestones: 5,
    approaching_milestones: 2,
    overdue_milestones: 1,
    last_activity_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    countries: ['NL', 'DE', 'BE'],
    cancer_types: ['Sarcoma', 'Neuroendocrine tumors'],
    description: 'Building a rare cancer trial matching platform connecting patients with available clinical trials across European centers.',
    objectives: ['Map 100 active rare cancer trials', 'Build patient matching algorithm', 'Partner with 10 medical centers'],
    lead: { name: 'Nadia Al-Rashid', role: 'Clinician', country: 'NL' },
  },
  {
    id: DEMO_INITIATIVE_IDS.survivorship,
    title: 'Childhood Cancer Survivorship Program',
    phase: 'execution',
    status: 'active',
    pillar: 'WorldCampus',
    member_count: 9,
    open_tasks: 4,
    blocked_tasks: 0,
    completed_milestones: 4,
    total_milestones: 8,
    approaching_milestones: 1,
    overdue_milestones: 0,
    last_activity_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    countries: ['NL', 'GH', 'IN'],
    cancer_types: ['Pediatric cancers'],
    description: 'Long-term follow-up and support program for childhood cancer survivors addressing psychosocial and medical late effects.',
    objectives: ['Enroll 300 survivors', 'Develop survivor care plans', 'Train 50 follow-up coordinators'],
    lead: { name: 'Maria Santos', role: 'PatientAdvocate', country: 'PT' },
  },
  {
    id: DEMO_INITIATIVE_IDS.immunotherapy,
    title: 'Immunotherapy Response Prediction',
    phase: 'research',
    status: 'active',
    pillar: 'Inspire2Live',
    member_count: 7,
    open_tasks: 6,
    blocked_tasks: 0,
    completed_milestones: 1,
    total_milestones: 5,
    approaching_milestones: 0,
    overdue_milestones: 0,
    last_activity_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    countries: ['NL', 'US', 'AU'],
    cancer_types: ['Melanoma', 'NSCLC'],
    description: 'AI-driven prediction model for immunotherapy response in melanoma and non-small cell lung cancer patients.',
    objectives: ['Collect multi-omic data from 1000 patients', 'Train prediction model', 'Clinical validation study'],
    lead: { name: 'Kai Tanaka', role: 'Researcher', country: 'JP' },
  },
  {
    id: DEMO_INITIATIVE_IDS.genomics,
    title: 'Genomic Profiling Access Program',
    phase: 'planning',
    status: 'active',
    pillar: 'Inspire2Go',
    member_count: 5,
    open_tasks: 2,
    blocked_tasks: 0,
    completed_milestones: 0,
    total_milestones: 4,
    approaching_milestones: 1,
    overdue_milestones: 0,
    last_activity_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    countries: ['NG', 'GH', 'KE', 'TZ'],
    cancer_types: ['All cancers'],
    description: 'Making comprehensive genomic profiling accessible in low-resource settings through partnerships and mobile sequencing labs.',
    objectives: ['Deploy 3 mobile sequencing labs', 'Profile 500 tumor samples', 'Build local bioinformatics capacity'],
    lead: { name: 'Sophie van der Berg', role: 'HubCoordinator', country: 'NL' },
  },
]

export const DEMO_TASKS = [
  { id: 't1', title: 'Finalize ethics committee submission', status: 'in_progress', priority: 'urgent', due_date: new Date(Date.now() - 2 * 86400000).toISOString(), initiative_id: DEMO_INITIATIVE_IDS.palliative, assignee: 'Sophie van der Berg' },
  { id: 't2', title: 'Review biomarker panel results Q1', status: 'todo', priority: 'high', due_date: new Date(Date.now() + 5 * 86400000).toISOString(), initiative_id: DEMO_INITIATIVE_IDS.earlyDetection, assignee: 'Kai Tanaka' },
  { id: 't3', title: 'Contact Ghana Ministry of Health', status: 'in_progress', priority: 'medium', due_date: new Date(Date.now() + 10 * 86400000).toISOString(), initiative_id: DEMO_INITIATIVE_IDS.palliative, assignee: 'Maria Santos' },
  { id: 't4', title: 'Draft trial matching algorithm spec', status: 'todo', priority: 'high', due_date: new Date(Date.now() + 3 * 86400000).toISOString(), initiative_id: DEMO_INITIATIVE_IDS.trialAccess, assignee: 'Nadia Al-Rashid' },
  { id: 't5', title: 'Prepare Congress 2026 presentation', status: 'todo', priority: 'medium', due_date: new Date(Date.now() + 30 * 86400000).toISOString(), initiative_id: DEMO_INITIATIVE_IDS.survivorship, assignee: 'Maria Santos' },
  { id: 't6', title: 'Set up mobile sequencing lab logistics', status: 'todo', priority: 'low', due_date: new Date(Date.now() + 45 * 86400000).toISOString(), initiative_id: DEMO_INITIATIVE_IDS.genomics, assignee: 'Sophie van der Berg' },
]

export const DEMO_TEAM_MEMBERS = [
  { user_id: 'u1', name: 'Sophie van der Berg', role: 'lead', platform_role: 'HubCoordinator', country: 'NL', joined_at: '2025-09-15' },
  { user_id: 'u2', name: 'Maria Santos', role: 'contributor', platform_role: 'PatientAdvocate', country: 'PT', joined_at: '2025-10-01' },
  { user_id: 'u3', name: 'Kai Tanaka', role: 'contributor', platform_role: 'Researcher', country: 'JP', joined_at: '2025-10-10' },
  { user_id: 'u4', name: 'Nadia Al-Rashid', role: 'reviewer', platform_role: 'Clinician', country: 'NL', joined_at: '2025-11-01' },
  { user_id: 'u5', name: 'Peter de Groot', role: 'reviewer', platform_role: 'BoardMember', country: 'NL', joined_at: '2025-11-15' },
]

export const DEMO_DISCUSSIONS = [
  { id: 'd1', title: 'Ethics approval timeline', thread_type: 'decision', author: 'Sophie van der Berg', created_at: '2026-01-15T10:00:00Z', reply_count: 4, preview: 'We need to decide on the timeline for the ethics committee submission across all 3 countries.' },
  { id: 'd2', title: 'Blocked: Lab equipment shipment to Accra', thread_type: 'blocker', author: 'Maria Santos', created_at: '2026-02-01T14:30:00Z', reply_count: 7, preview: 'The sequencing equipment is stuck in customs in Accra. Need urgent help with import documentation.' },
  { id: 'd3', title: 'Idea: Patient-reported outcomes mobile app', thread_type: 'idea', author: 'Kai Tanaka', created_at: '2026-02-10T09:15:00Z', reply_count: 2, preview: 'What if we build a simple mobile app for patients to report outcomes directly? Could improve data collection significantly.' },
]

export const DEMO_MILESTONES = [
  { id: 'm1', title: 'Ethics approval obtained (all sites)', status: 'completed', target_date: '2025-12-01', completed_date: '2025-11-28', evidence_required: true },
  { id: 'm2', title: 'Training curriculum finalized', status: 'completed', target_date: '2026-01-15', completed_date: '2026-01-12', evidence_required: true },
  { id: 'm3', title: 'First 50 healthcare workers trained', status: 'in_progress', target_date: '2026-04-01', completed_date: null, evidence_required: true },
  { id: 'm4', title: 'Policy recommendations drafted', status: 'upcoming', target_date: '2026-07-01', completed_date: null, evidence_required: false },
]

export const DEMO_EVIDENCE = [
  { id: 'e1', title: 'Ethics Approval Letter - Ghana', type: 'document', language: 'en', version: '1.0', uploaded_by: 'Sophie van der Berg', uploaded_at: '2025-11-28' },
  { id: 'e2', title: 'Training Curriculum v2.1', type: 'document', language: 'en', version: '2.1', uploaded_by: 'Maria Santos', uploaded_at: '2026-01-12' },
  { id: 'e3', title: 'Baseline Survey Results', type: 'data', language: 'en', version: '1.0', uploaded_by: 'Kai Tanaka', uploaded_at: '2026-02-05' },
]

export const DEMO_NOTIFICATIONS = [
  { id: 'n1', type: 'task_assigned', title: 'New task assigned to you', body: 'You have been assigned "Finalize ethics committee submission" in Palliative Care initiative.', is_read: false, created_at: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: 'n2', type: 'milestone_completed', title: 'Milestone completed', body: 'Training curriculum finalized has been marked as completed in Palliative Care initiative.', is_read: false, created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: 'n3', type: 'discussion_reply', title: 'New reply in discussion', body: 'Kai Tanaka replied to "Ethics approval timeline" discussion.', is_read: false, created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: 'n4', type: 'member_joined', title: 'New team member', body: 'Peter de Groot joined the Palliative Care Access initiative as reviewer.', is_read: true, created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'n5', type: 'initiative_update', title: 'Initiative status update', body: 'Early Detection Biomarkers initiative moved to research phase.', is_read: true, created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
]

export const DEMO_CONGRESS = {
  event: { title: 'Inspire2Live Congress 2026', date: '2026-11-14', location: 'Amsterdam, Netherlands', description: 'Annual gathering of patient advocates, researchers, clinicians and partners.' },
  topics: [
    { id: 'ct1', title: 'AI-Assisted Cancer Diagnosis in Low-Resource Settings', votes: 42, proposer: 'Kai Tanaka', initiative: 'Genomic Profiling Access' },
    { id: 'ct2', title: 'Patient-Led Clinical Trial Design', votes: 38, proposer: 'Maria Santos', initiative: 'Clinical Trial Access for Rare Cancers' },
    { id: 'ct3', title: 'Palliative Care as a Human Right', votes: 35, proposer: 'Sophie van der Berg', initiative: 'Palliative Care Access' },
  ],
  sessions: [
    { id: 'cs1', title: 'Opening: The State of Patient Advocacy 2026', time: '09:00', speaker: 'Peter de Groot' },
    { id: 'cs2', title: 'Workshop: Building Effective Multi-Stakeholder Initiatives', time: '14:00', speaker: 'Sophie van der Berg' },
  ],
}

export const DEMO_RESOURCES = [
  { id: 'r1', title: 'Palliative Care Training Manual', type: 'document', language: 'en', version: '2.1', initiative: 'Palliative Care Access', uploaded_by: 'Sophie van der Berg', uploaded_at: '2026-01-12' },
  { id: 'r2', title: 'Biomarker Panel Validation Protocol', type: 'protocol', language: 'en', version: '1.0', initiative: 'Early Detection Biomarkers', uploaded_by: 'Kai Tanaka', uploaded_at: '2025-12-20' },
  { id: 'r3', title: 'Rare Cancer Trial Database Schema', type: 'data', language: 'en', version: '0.9', initiative: 'Clinical Trial Access', uploaded_by: 'Nadia Al-Rashid', uploaded_at: '2026-02-01' },
  { id: 'r4', title: 'Survivorship Care Plan Template', type: 'template', language: 'en', version: '1.2', initiative: 'Childhood Cancer Survivorship', uploaded_by: 'Maria Santos', uploaded_at: '2026-01-25' },
  { id: 'r5', title: 'Mobile Lab Setup Guide', type: 'guide', language: 'en', version: '1.0', initiative: 'Genomic Profiling Access', uploaded_by: 'Sophie van der Berg', uploaded_at: '2026-02-08' },
]

export const DEMO_PARTNERS = [
  { id: 'p1', partner: 'Roche Diagnostics', initiative: 'Early Detection Biomarkers', contribution: 'Biomarker assay kits + lab equipment', neutrality_status: 'declared', contact: 'Dr. Hans Mueller', since: '2025-10-01' },
  { id: 'p2', partner: 'WHO Africa Region', initiative: 'Palliative Care Access', contribution: 'Policy support + training coordination', neutrality_status: 'declared', contact: 'Amina Osei', since: '2025-09-15' },
]

export const DEMO_USERS = [
  { id: 'u1', name: 'Sophie van der Berg', email: 'sophie@inspire2live.org', role: 'HubCoordinator', country: 'NL', last_active: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'active', onboarding_completed: true },
  { id: 'u2', name: 'Maria Santos', email: 'maria@inspire2live.org', role: 'PatientAdvocate', country: 'PT', last_active: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'active', onboarding_completed: true },
  { id: 'u3', name: 'Kai Tanaka', email: 'kai@inspire2live.org', role: 'Researcher', country: 'JP', last_active: new Date(Date.now() - 3 * 86400000).toISOString(), status: 'active', onboarding_completed: true },
  { id: 'u4', name: 'Nadia Al-Rashid', email: 'nadia@inspire2live.org', role: 'Clinician', country: 'NL', last_active: new Date(Date.now() - 5 * 86400000).toISOString(), status: 'active', onboarding_completed: true },
  { id: 'u5', name: 'Peter de Groot', email: 'peter@inspire2live.org', role: 'BoardMember', country: 'NL', last_active: new Date(Date.now() - 7 * 86400000).toISOString(), status: 'active', onboarding_completed: true },
  { id: 'u6', name: 'Admin User', email: 'admin@inspire2live.org', role: 'PlatformAdmin', country: 'NL', last_active: new Date().toISOString(), status: 'active', onboarding_completed: true },
]

/** Helper: use DB data if available, otherwise demo fallback */
export function withFallback<T>(dbResult: T[] | null | undefined, demoData: T[]): T[] {
  return (dbResult ?? []).length > 0 ? dbResult! : demoData
}
