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

// ─── Canonical 5-stage vocabulary ────────────────────────────────────────────
export type InitiativeStage = 'idea' | 'planning' | 'execution' | 'public' | 'completed'

/** Normalize any DB phase value into one of the 5 canonical stages */
export function normalizeStage(phase: string | null | undefined): InitiativeStage {
  if (!phase) return 'planning'
  const p = phase.toLowerCase()
  if (p === 'idea') return 'idea'
  if (p === 'planning') return 'planning'
  if (p === 'research' || p === 'execution') return 'execution'
  if (p === 'public') return 'public'
  if (p === 'completed') return 'completed'
  return 'planning'
}

export const STAGE_META: Record<InitiativeStage, { label: string; color: string; description: string }> = {
  idea:      { label: 'Idea',      color: 'bg-violet-100 text-violet-700',  description: 'Concept stage — gathering support and defining scope' },
  planning:  { label: 'Planning',  color: 'bg-blue-100 text-blue-700',      description: 'Active planning — team forming, strategy being defined' },
  execution: { label: 'Execution', color: 'bg-orange-100 text-orange-700',  description: 'In progress — work is underway, milestones being achieved' },
  public:    { label: 'Public',    color: 'bg-emerald-100 text-emerald-700',description: 'Publicly active — results being shared with the community' },
  completed: { label: 'Completed', color: 'bg-neutral-200 text-neutral-600',description: 'Completed — objectives achieved, outcomes published' },
}

export const STAGE_ORDER: InitiativeStage[] = ['idea', 'planning', 'execution', 'public', 'completed']

// ─── Rich Team Members ────────────────────────────────────────────────────────
export const DEMO_TEAM_MEMBERS_RICH = [
  {
    user_id: 'u1',
    name: 'Sophie van der Berg',
    role: 'lead',
    platform_role: 'HubCoordinator',
    country: 'Netherlands',
    email: 'sophie.vandenberg@inspire2live.org',
    phone: '+31 6 1234 5678',
    bio: 'Sophie has 15 years of experience in global health programme management, with a focus on Sub-Saharan Africa. She coordinates Inspire2Live\'s Amsterdam hub and leads palliative care access programmes across three African countries.',
    responsibilities: ['Initiative strategy & leadership', 'Stakeholder relations with Ministries of Health', 'Team coordination and milestone oversight', 'Budget and resource management'],
    joined_at: '2025-09-15',
    last_active_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    organization: 'Inspire2Live Amsterdam Hub',
  },
  {
    user_id: 'u2',
    name: 'Maria Santos',
    role: 'contributor',
    platform_role: 'PatientAdvocate',
    country: 'Portugal',
    email: 'maria.santos@inspire2live.org',
    phone: '+351 91 987 6543',
    bio: 'Maria is a breast cancer survivor turned patient advocate. She brings lived experience to the team, ensuring patient perspectives drive every decision. Maria is also a trained social worker specialising in cancer psychosocial support.',
    responsibilities: ['Patient perspective integration', 'Community outreach in Ghana and Nigeria', 'Psychosocial support programme design', 'Patient stories and outcome documentation'],
    joined_at: '2025-10-01',
    last_active_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    organization: 'European Cancer Patient Coalition',
  },
  {
    user_id: 'u3',
    name: 'Kai Tanaka',
    role: 'contributor',
    platform_role: 'Researcher',
    country: 'Japan',
    email: 'kai.tanaka@inspire2live.org',
    phone: '+81 90 1234 5678',
    bio: 'Kai is a molecular oncologist and clinical researcher based in Tokyo. He leads multi-centre biomarker studies and has published over 60 peer-reviewed papers on cancer diagnostics. He contributes research design and data analysis expertise.',
    responsibilities: ['Research protocol design', 'Biomarker data analysis', 'Academic partner coordination (Japan, US, Australia)', 'Scientific publication oversight'],
    joined_at: '2025-10-10',
    last_active_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    organization: 'University of Tokyo Cancer Research Institute',
  },
  {
    user_id: 'u4',
    name: 'Nadia Al-Rashid',
    role: 'reviewer',
    platform_role: 'Clinician',
    country: 'Netherlands',
    email: 'nadia.alrashid@inspire2live.org',
    phone: '+31 20 765 4321',
    bio: 'Nadia is a medical oncologist at the Netherlands Cancer Institute (NKI). She reviews clinical feasibility of initiative plans and provides expert oversight on treatment protocols, ethics submissions, and clinical trial design.',
    responsibilities: ['Clinical protocol review and sign-off', 'Ethics committee submission support', 'Clinical partner introductions', 'Medical accuracy oversight'],
    joined_at: '2025-11-01',
    last_active_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    organization: 'Netherlands Cancer Institute (NKI)',
  },
  {
    user_id: 'u5',
    name: 'Peter de Groot',
    role: 'reviewer',
    platform_role: 'BoardMember',
    country: 'Netherlands',
    email: 'peter.degroot@inspire2live.org',
    phone: '+31 6 8765 4321',
    bio: 'Peter is a founding board member of Inspire2Live with a background in international healthcare consultancy and public health policy. He provides governance oversight, strategic guidance, and connects initiatives to funding opportunities.',
    responsibilities: ['Governance and board reporting', 'Funding and partnership introductions', 'Strategic alignment with Inspire2Live mission', 'Senior stakeholder engagement'],
    joined_at: '2025-11-15',
    last_active_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    organization: 'Inspire2Live Board of Directors',
  },
]

// ─── Rich Milestones Timeline ─────────────────────────────────────────────────
export const DEMO_MILESTONES_RICH = [
  {
    id: 'm0',
    title: 'Initiative formally approved by Inspire2Live Board',
    stage: 'planning' as InitiativeStage,
    status: 'completed',
    target_date: '2025-09-01',
    completed_date: '2025-08-28',
    evidence_required: false,
    description: 'Board reviewed the initiative proposal and granted formal approval to proceed with team formation and scoping activities.',
    outcome: 'Approval letter issued. Budget of €180,000 allocated for Year 1.',
  },
  {
    id: 'm1',
    title: 'Ethics approval obtained — all sites (GH, NG, KE)',
    stage: 'planning' as InitiativeStage,
    status: 'completed',
    target_date: '2025-12-01',
    completed_date: '2025-11-28',
    evidence_required: true,
    description: 'Ethics committee submissions were filed in Ghana (Ghana Health Service), Nigeria (NHREC), and Kenya (KEMSA). All three received approval within the target window.',
    outcome: 'Three ethics approval letters filed. IRB registration numbers recorded for all sites.',
  },
  {
    id: 'm2',
    title: 'Training curriculum finalized and pilot-tested',
    stage: 'execution' as InitiativeStage,
    status: 'completed',
    target_date: '2026-01-15',
    completed_date: '2026-01-12',
    evidence_required: true,
    description: 'A multi-disciplinary working group of palliative care specialists, patient advocates, and educators developed the 40-hour training curriculum. Pilot with 12 nurses at Korle Bu Teaching Hospital confirmed curriculum effectiveness.',
    outcome: 'Curriculum v2.1 published. Pilot feedback incorporated. NMC endorsement pending.',
  },
  {
    id: 'm3',
    title: 'First 50 healthcare workers trained (Cohort 1)',
    stage: 'execution' as InitiativeStage,
    status: 'in_progress',
    target_date: '2026-04-01',
    completed_date: null,
    evidence_required: true,
    description: 'Cohort 1 training sessions are running in Accra (Ghana) and Lagos (Nigeria). Each 5-day residential programme trains nurses, community health workers, and social workers in palliative care fundamentals.',
    outcome: null,
  },
  {
    id: 'm4',
    title: 'First palliative care unit operational (Accra)',
    stage: 'execution' as InitiativeStage,
    status: 'upcoming',
    target_date: '2026-06-01',
    completed_date: null,
    evidence_required: true,
    description: 'The Korle Bu Teaching Hospital palliative care unit will be formally commissioned following completion of infrastructure upgrades funded through the WHO Africa partnership.',
    outcome: null,
  },
  {
    id: 'm5',
    title: 'Country-specific policy recommendations drafted',
    stage: 'public' as InitiativeStage,
    status: 'upcoming',
    target_date: '2026-07-01',
    completed_date: null,
    evidence_required: false,
    description: 'Working with in-country policy teams to draft actionable palliative care policy recommendations for each of the three governments, drawing on training outcomes and unit operational data.',
    outcome: null,
  },
  {
    id: 'm6',
    title: 'Congress 2026 presentation — outcomes published',
    stage: 'public' as InitiativeStage,
    status: 'upcoming',
    target_date: '2026-11-14',
    completed_date: null,
    evidence_required: false,
    description: 'Full initiative results presented at the annual Inspire2Live Congress in Amsterdam. Interim research paper submitted to peer-reviewed journal (Palliative Medicine).',
    outcome: null,
  },
  {
    id: 'm7',
    title: 'Initiative formally closed — handover to local coordinators',
    stage: 'completed' as InitiativeStage,
    status: 'upcoming',
    target_date: '2027-02-01',
    completed_date: null,
    evidence_required: true,
    description: 'Following 200 trained workers and 5 operational palliative units, the initiative transitions to locally-led sustainability mode. Inspire2Live remains as advisory partner.',
    outcome: null,
  },
]

// ─── Rich Evidence Items ──────────────────────────────────────────────────────
export const DEMO_EVIDENCE_RICH = [
  {
    id: 'e1',
    title: 'Ethics Approval — Ghana Health Service',
    category: 'regulatory',
    status: 'published',
    linked_milestone: 'Ethics approval obtained — all sites',
    owner: 'Nadia Al-Rashid',
    version: '1.0',
    uploaded_at: '2025-11-28',
    file_type: 'pdf',
    description: 'Formal ethics approval letter from Ghana Health Service Ethics Review Committee for the palliative care training programme.',
  },
  {
    id: 'e2',
    title: 'Ethics Approval — NHREC Nigeria',
    category: 'regulatory',
    status: 'published',
    linked_milestone: 'Ethics approval obtained — all sites',
    owner: 'Nadia Al-Rashid',
    version: '1.0',
    uploaded_at: '2025-11-25',
    file_type: 'pdf',
    description: 'Ethics approval from Nigeria\'s National Health Research Ethics Committee.',
  },
  {
    id: 'e3',
    title: 'Training Curriculum v2.1 — Final',
    category: 'clinical',
    status: 'published',
    linked_milestone: 'Training curriculum finalized',
    owner: 'Maria Santos',
    version: '2.1',
    uploaded_at: '2026-01-12',
    file_type: 'docx',
    description: '40-hour palliative care training curriculum incorporating pilot feedback. Covers pain management, psychosocial support, family counselling, and end-of-life care.',
  },
  {
    id: 'e4',
    title: 'Pilot Training Report — Korle Bu Teaching Hospital',
    category: 'clinical',
    status: 'published',
    linked_milestone: 'Training curriculum finalized',
    owner: 'Sophie van der Berg',
    version: '1.0',
    uploaded_at: '2026-01-10',
    file_type: 'pdf',
    description: 'Evaluation report from the 12-nurse pilot training session at Korle Bu Teaching Hospital, Accra. Pre/post assessments show 78% knowledge improvement.',
  },
  {
    id: 'e5',
    title: 'Baseline Palliative Care Needs Assessment — Ghana',
    category: 'research',
    status: 'reviewed',
    linked_milestone: 'Initiative approved',
    owner: 'Kai Tanaka',
    version: '1.0',
    uploaded_at: '2025-10-15',
    file_type: 'xlsx',
    description: 'Quantitative needs assessment covering 8 hospitals and 24 community health centres in Greater Accra and Ashanti regions.',
  },
  {
    id: 'e6',
    title: 'Patient Story: Kofi\'s Journey — Ghana',
    category: 'patient_stories',
    status: 'published',
    linked_milestone: 'First 50 workers trained',
    owner: 'Maria Santos',
    version: '1.0',
    uploaded_at: '2026-02-01',
    file_type: 'mp4',
    description: 'Short documentary (8 min) following a palliative care patient and their family in Accra. Used in advocacy and training materials.',
  },
  {
    id: 'e7',
    title: 'WHO Africa Region MOU — Partnership Agreement',
    category: 'policy',
    status: 'published',
    linked_milestone: 'Initiative approved',
    owner: 'Peter de Groot',
    version: '1.0',
    uploaded_at: '2025-09-20',
    file_type: 'pdf',
    description: 'Signed Memorandum of Understanding with WHO Africa Region covering joint training delivery, co-funding, and policy advisory support.',
  },
  {
    id: 'e8',
    title: 'Cohort 1 Progress Report (Draft)',
    category: 'operational',
    status: 'draft',
    linked_milestone: 'First 50 workers trained',
    owner: 'Sophie van der Berg',
    version: '0.3',
    uploaded_at: '2026-02-15',
    file_type: 'docx',
    description: 'Draft progress report covering the first 6 weeks of Cohort 1 training across Ghana and Nigeria. Pending final attendance data.',
  },
]

// ─── Communication: Email Threads ─────────────────────────────────────────────
export const DEMO_EMAIL_THREADS = [
  {
    id: 'em1',
    subject: 'Ethics approval update — Kenya site delay',
    thread_type: 'update',
    from: { name: 'Nadia Al-Rashid', email: 'nadia.alrashid@inspire2live.org' },
    to: [
      { name: 'Sophie van der Berg', email: 'sophie.vandenberg@inspire2live.org' },
      { name: 'Peter de Groot', email: 'peter.degroot@inspire2live.org' },
    ],
    date: '2025-11-10T09:32:00Z',
    preview: 'Update on the KEMSA submission — we\'ve received a request for additional documentation...',
    body: 'Dear Sophie and Peter,\n\nI wanted to flag that the Kenyan ethics committee (KEMSA) has requested additional documentation regarding our local PI credentials. They need certified copies of Dr. Mwangi\'s registration. I\'ve already reached out to Dr. Mwangi\'s office — expecting a response by end of week.\n\nThis puts us approximately 2 weeks behind schedule for the Kenya site. Ghana and Nigeria remain on track.\n\nBest,\nNadia',
    reply_count: 3,
    unread: false,
    labels: ['ethics', 'kenya'],
  },
  {
    id: 'em2',
    subject: 'Re: WHO Africa partnership — Q1 reporting deadline',
    thread_type: 'action_required',
    from: { name: 'Amina Osei (WHO)', email: 'a.osei@who.int' },
    to: [
      { name: 'Sophie van der Berg', email: 'sophie.vandenberg@inspire2live.org' },
    ],
    date: '2026-01-28T14:15:00Z',
    preview: 'Hi Sophie, just a reminder that Q1 progress reports are due to WHO Africa by 15 February...',
    body: 'Hi Sophie,\n\nThis is a reminder that Q1 progress reports for all WHO Africa-partnered programmes are due by 15 February 2026. Please submit via the WHO partner portal (link below).\n\nRequired sections:\n- Training numbers (target vs actual)\n- Site readiness update\n- Budget utilisation vs plan\n- Risks and mitigations\n\nLet me know if you have any questions.\n\nBest regards,\nAmina Osei\nWHO Africa Region Programme Officer',
    reply_count: 1,
    unread: true,
    labels: ['reporting', 'who', 'deadline'],
  },
  {
    id: 'em3',
    subject: 'Training feedback from Lagos cohort',
    thread_type: 'update',
    from: { name: 'Maria Santos', email: 'maria.santos@inspire2live.org' },
    to: [
      { name: 'Sophie van der Berg', email: 'sophie.vandenberg@inspire2live.org' },
      { name: 'Kai Tanaka', email: 'kai.tanaka@inspire2live.org' },
    ],
    date: '2026-02-12T11:00:00Z',
    preview: 'Just back from Lagos — incredibly positive response from the nurses in Cohort 1...',
    body: 'Hi team,\n\nJust returned from Lagos. The energy in the Cohort 1 training was remarkable. Key feedback from participants:\n\n1. Pain assessment module rated most valuable (avg 4.8/5)\n2. Request for more case studies specific to Nigerian cancer types\n3. Suggestion to add a session on family communication (currently not in curriculum)\n4. Several nurses asked about certification options\n\nI\'ve summarized the full feedback in a document I\'ll upload to the evidence hub this week. Kai — the needs assessment data you shared was extremely well received by the clinical leads.\n\nMaria',
    reply_count: 4,
    unread: false,
    labels: ['training', 'nigeria', 'feedback'],
  },
  {
    id: 'em4',
    subject: 'Budget reallocation request — Q2',
    thread_type: 'decision',
    from: { name: 'Sophie van der Berg', email: 'sophie.vandenberg@inspire2live.org' },
    to: [
      { name: 'Peter de Groot', email: 'peter.degroot@inspire2live.org' },
    ],
    date: '2026-02-17T08:45:00Z',
    preview: 'Peter, I need board sign-off on a €12,000 reallocation from the travel budget to training materials...',
    body: 'Dear Peter,\n\nFollowing the Kenya delay and the feedback from Lagos, I\'d like to request board approval for a budget reallocation:\n\n- Transfer €12,000 from travel budget line (we\'re under-spending due to fewer site visits needed than planned)\n- Allocate to: €8,000 for curriculum translation into Swahili/Hausa, €4,000 for additional printed materials for Cohort 2\n\nThis has been discussed with the team and we\'re all aligned. Can you confirm approval at your earliest convenience so we can proceed with the translation firm before end of month?\n\nThank you,\nSophie',
    reply_count: 1,
    unread: true,
    labels: ['budget', 'decision'],
  },
]

// ─── Newsfeed (external context) ─────────────────────────────────────────────
export const DEMO_NEWSFEED = [
  { id: 'nf1', category: 'medical',   headline: 'WHO updates global cancer control plan: new focus on equity in access to immunotherapy', source: 'World Health Organization', region: 'Global',  published: '2026-02-18', summary: 'The WHO released a revised cancer control framework emphasising equitable access to immunotherapy in low- and middle-income countries, with implementation guidance for national health ministries.' },
  { id: 'nf2', category: 'policy',    headline: 'EU Cancer Mission: €1.4 billion committed to cancer research, patient advocacy role strengthened', source: 'European Commission', region: 'Europe', published: '2026-02-15', summary: 'The European Cancer Mission confirmed its second-wave investment allocation, with patient advocacy organisations formally embedded in the governance structure for the first time.' },
  { id: 'nf3', category: 'advocacy',  headline: 'ECCO and ESMO joint statement calls for mandatory patient representation in clinical trial design', source: 'ECCO / ESMO', region: 'Europe',  published: '2026-02-12', summary: 'A joint statement from leading oncology societies argues that clinical trials without meaningful patient co-design fail to capture real-world relevance. Inspire2Live cited as a model platform.' },
  { id: 'nf4', category: 'medical',   headline: 'Liquid biopsy gains regulatory approval in Japan for early multi-cancer detection', source: 'Japan PMDA', region: 'Asia',    published: '2026-02-10', summary: 'Japan\'s PMDA approved a blood-based multi-cancer early detection test, marking a major milestone for liquid biopsy technology. Relevant to the ongoing Early Detection Biomarkers initiative.' },
  { id: 'nf5', category: 'policy',    headline: 'African Union Health Agenda 2026: palliative care access named as priority', source: 'African Union', region: 'Africa',  published: '2026-02-08', summary: 'The AU formally listed palliative care access as a health priority in 2026, creating a policy window for Inspire2Go programmes in Ghana, Nigeria and Kenya.' },
  { id: 'nf6', category: 'advocacy',  headline: 'Global patient advocacy roundtable convenes: consensus statement on data rights in cancer research', source: 'IAPO', region: 'Global',  published: '2026-02-05', summary: 'Over 200 patient organisations endorsed a common position on patient data rights in cancer research databases, demanding transparency and opt-in consent standards.' },
]

// ─── Network: Internal Members ────────────────────────────────────────────────
export const DEMO_NETWORK_INTERNAL = [
  { user_id: 'u1', name: 'Sophie van der Berg', role: 'HubCoordinator', organization: 'Inspire2Live Amsterdam Hub', country: 'Netherlands', initiatives: ['Palliative Care Access', 'Genomic Profiling Access'], last_active_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { user_id: 'u2', name: 'Maria Santos',         role: 'PatientAdvocate', organization: 'European Cancer Patient Coalition', country: 'Portugal', initiatives: ['Palliative Care Access', 'Childhood Cancer Survivorship'], last_active_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { user_id: 'u3', name: 'Kai Tanaka',           role: 'Researcher',      organization: 'University of Tokyo Cancer Research Institute', country: 'Japan', initiatives: ['Early Detection Biomarkers', 'Immunotherapy Response'], last_active_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { user_id: 'u4', name: 'Nadia Al-Rashid',      role: 'Clinician',       organization: 'Netherlands Cancer Institute (NKI)', country: 'Netherlands', initiatives: ['Clinical Trial Access', 'Palliative Care Access'], last_active_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { user_id: 'u5', name: 'Peter de Groot',        role: 'BoardMember',     organization: 'Inspire2Live Board', country: 'Netherlands', initiatives: [], last_active_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { user_id: 'u7', name: 'Amara Diallo',          role: 'PatientAdvocate', organization: 'Ghana Cancer Foundation', country: 'Ghana', initiatives: ['Palliative Care Access'], last_active_at: new Date(Date.now() - 4 * 86400000).toISOString() },
  { user_id: 'u8', name: 'Elena Rodrigues',       role: 'Researcher',      organization: 'Lisbon Institute of Oncology', country: 'Portugal', initiatives: ['Early Detection Biomarkers'], last_active_at: new Date(Date.now() - 9 * 86400000).toISOString() },
  { user_id: 'u9', name: 'Yuki Hashimoto',        role: 'Clinician',       organization: 'Osaka University Hospital', country: 'Japan', initiatives: ['Immunotherapy Response'], last_active_at: new Date(Date.now() - 12 * 86400000).toISOString() },
]

// ─── Network: External Partners ───────────────────────────────────────────────
export const DEMO_NETWORK_EXTERNAL = [
  { id: 'ep1', name: 'World Health Organization — Africa Region', type: 'policy',    contact: 'Amina Osei',       focus: 'Palliative care policy, training coordination', relationship: 'active_partner', linked_initiatives: ['Palliative Care Access'] },
  { id: 'ep2', name: 'Roche Diagnostics',                          type: 'industry',  contact: 'Dr. Hans Mueller', focus: 'Biomarker assay kits, diagnostics research',  relationship: 'active_partner', linked_initiatives: ['Early Detection Biomarkers'] },
  { id: 'ep3', name: 'Ghana Health Service',                       type: 'hospital',  contact: 'Dr. Kwame Asante', focus: 'Clinical site coordination, ethics oversight',  relationship: 'active_partner', linked_initiatives: ['Palliative Care Access'] },
  { id: 'ep4', name: 'ESMO — European Society for Medical Oncology', type: 'academic', contact: 'Prof. R. Dittrich', focus: 'Clinical guidelines, trial design standards',  relationship: 'engaged',        linked_initiatives: ['Clinical Trial Access'] },
  { id: 'ep5', name: 'African Union Health Directorate',            type: 'policy',   contact: 'Dr. B. Kamara',   focus: 'Continental health policy, genomics access',  relationship: 'exploring',      linked_initiatives: ['Genomic Profiling Access'] },
  { id: 'ep6', name: 'Korle Bu Teaching Hospital',                  type: 'hospital', contact: 'Dr. Akosua Mensah', focus: 'Clinical training host, palliative unit commissioning', relationship: 'active_partner', linked_initiatives: ['Palliative Care Access'] },
]

// ─── Board: Activity Stream ───────────────────────────────────────────────────
export const DEMO_BOARD_ACTIVITY = [
  { id: 'ba1', type: 'milestone',    title: 'Training curriculum finalized and pilot-tested', detail: 'Palliative Care Access initiative', date: '2026-01-12', initiative: 'Palliative Care Access' },
  { id: 'ba2', type: 'initiative',   title: 'New initiative registered: Genomic Profiling Access Program', detail: 'Lead: Sophie van der Berg · Planning stage', date: '2025-12-10', initiative: 'Genomic Profiling Access' },
  { id: 'ba3', type: 'member',       title: 'Amara Diallo joined as Patient Advocate', detail: 'Ghana Cancer Foundation · Palliative Care initiative', date: '2026-01-20', initiative: 'Palliative Care Access' },
  { id: 'ba4', type: 'ethics',       title: 'Ethics approval confirmed — all 3 sites (GH, NG, KE)', detail: 'Palliative Care Access initiative', date: '2025-11-28', initiative: 'Palliative Care Access' },
  { id: 'ba5', type: 'partner',      title: 'WHO Africa partnership agreement signed', detail: '€180,000 co-funding committed', date: '2025-09-20', initiative: 'Palliative Care Access' },
  { id: 'ba6', type: 'milestone',    title: 'Ethics approval: Ghana Health Service', detail: 'Early Detection Biomarkers initiative', date: '2025-12-15', initiative: 'Early Detection Biomarkers' },
  { id: 'ba7', type: 'reporting',    title: 'WHO Africa Q1 report due 15 February 2026', detail: 'Action required from Sophie van der Berg', date: '2026-02-15', initiative: 'Palliative Care Access' },
]

// ─── Communication: Team Chat ─────────────────────────────────────────────────
export const DEMO_TEAM_CHAT = [
  {
    id: 'chat1',
    author: 'Sophie van der Berg',
    avatar_initials: 'SvdB',
    timestamp: '2026-02-19T09:05:00Z',
    message: 'Good morning team! Quick reminder — WHO Q1 report is due 15 Feb. @Nadia can you send me the clinical sections by Friday?',
    reactions: [{ emoji: '👍', count: 3 }],
  },
  {
    id: 'chat2',
    author: 'Nadia Al-Rashid',
    avatar_initials: 'NA',
    timestamp: '2026-02-19T09:22:00Z',
    message: 'On it! I\'ll have the clinical section ready by Thursday. Also good news — KEMSA finally sent written confirmation. Kenya ethics is approved! 🎉',
    reactions: [{ emoji: '🎉', count: 5 }, { emoji: '✅', count: 2 }],
  },
  {
    id: 'chat3',
    author: 'Maria Santos',
    avatar_initials: 'MS',
    timestamp: '2026-02-19T09:35:00Z',
    message: 'Amazing news Nadia! The Lagos team will be thrilled. Also uploading the training feedback doc to evidence hub today. Sophie, I think we should add the Nigerian case studies suggestion to the curriculum backlog.',
    reactions: [{ emoji: '👍', count: 2 }],
  },
  {
    id: 'chat4',
    author: 'Kai Tanaka',
    avatar_initials: 'KT',
    timestamp: '2026-02-19T10:01:00Z',
    message: 'Agreed on case studies. I can help draft a set based on our needs assessment data. Maria — could you connect me with one of the Lagos clinical leads? I\'d like specific cancer type breakdowns for Cohort 2 content.',
    reactions: [],
  },
  {
    id: 'chat5',
    author: 'Peter de Groot',
    avatar_initials: 'PdG',
    timestamp: '2026-02-19T10:45:00Z',
    message: 'Great progress everyone. Sophie — budget reallocation approved on my end. Will confirm formally via email. The board is very pleased with how Cohort 1 is going.',
    reactions: [{ emoji: '🙏', count: 3 }, { emoji: '👍', count: 2 }],
  },
  {
    id: 'chat6',
    author: 'Sophie van der Berg',
    avatar_initials: 'SvdB',
    timestamp: '2026-02-19T11:00:00Z',
    message: 'Thank you Peter! That\'s a big relief. Team — let\'s do a quick video call tomorrow at 14:00 CET to align on Cohort 2 planning and the WHO report. I\'ll send a calendar invite.',
    reactions: [{ emoji: '✅', count: 4 }],
  },
]
