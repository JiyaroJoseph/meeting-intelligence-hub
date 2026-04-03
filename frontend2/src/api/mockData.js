export const mockMeetings = [
  {
    id: '1',
    name: 'Q1 Product Strategy Review',
    filename: 'q1-strategy.txt',
    uploaded_at: '2025-04-02T14:30:00Z',
    speakers: ['Sarah Chen', 'James Wilson', 'Maria Rodriguez'],
    word_count: 8764,
    format: 'txt',
    status: 'ready',
    action_items_count: 7,
    decisions_count: 4,
    segments: [
      { time: '00:00:12.000', speaker: 'Sarah Chen', text: 'Let us prioritize mobile retention because acquisition costs are rising.' },
      { time: '00:02:03.000', speaker: 'James Wilson', text: 'API latency spikes are hurting enterprise trust; this has to be fixed this quarter.' },
      { time: '00:05:44.000', speaker: 'Maria Rodriguez', text: 'Given capacity constraints, we should delay advanced analytics until Q3.' },
      { time: '00:08:21.000', speaker: 'Sarah Chen', text: 'Decision: shift roadmap to mobile-first and resource API performance immediately.' },
    ],
    intel: {
      decisions: [
        { id: 1, decision: 'Accelerate mobile-first redesign to Q2', context: 'User retention metrics show 40% usage via mobile', rationale: 'Mobile growth outpaced desktop and retention dropped for app users.', confidence: 'High', stakeholders: ['Sarah Chen', 'James Wilson'], dissenters: [] },
        { id: 2, decision: 'Allocate 3 engineers to API performance optimization', context: 'Latency increased 200ms YoY; critical path for enterprise clients', rationale: 'Slow API response threatens expansion commitments for enterprise contracts.', confidence: 'High', stakeholders: ['James Wilson', 'Maria Rodriguez'], dissenters: [] },
        { id: 3, decision: 'Delay advanced analytics dashboard to Q3', context: 'Resource constraints; prioritize core functionality', rationale: 'Team capacity is finite and must focus on immediate reliability gaps.', confidence: 'Medium', stakeholders: ['Sarah Chen'], dissenters: ['Maria Rodriguez'] },
        { id: 4, decision: 'Adopt new UI framework for consistency', context: 'Current stack fragmented across teams', rationale: 'Unified UI stack reduces maintenance load and inconsistent UX patterns.', confidence: 'Medium', stakeholders: ['Maria Rodriguez', 'Sarah Chen'], dissenters: [] },
      ],
      action_items: [
        { id: 1, task: 'Complete mobile UX audit', owner: 'Sarah Chen', deadline: '2025-04-15', priority: 'High' },
        { id: 2, task: 'Profile API bottlenecks', owner: 'James Wilson', deadline: '2025-04-10', priority: 'High' },
        { id: 3, task: 'Draft framework migration plan', owner: 'Maria Rodriguez', deadline: '2025-04-20', priority: 'Medium' },
        { id: 4, task: 'Coordinate with Sales on enterprise roadmap', owner: 'Sarah Chen', deadline: '2025-04-25', priority: 'Medium' },
        { id: 5, task: 'Schedule async workshop on new patterns', owner: 'Maria Rodriguez', deadline: '2025-04-12', priority: 'Low' },
        { id: 6, task: 'Document decision rationale', owner: 'James Wilson', deadline: '2025-04-18', priority: 'Low' },
        { id: 7, task: 'Review Q2 budget implications', owner: 'Sarah Chen', deadline: '2025-04-22', priority: 'Medium' },
      ],
    },
  },
  {
    id: '2',
    name: 'Engineering All-Hands April',
    filename: 'eng-allhands-apr.vtt',
    uploaded_at: '2025-04-01T10:00:00Z',
    speakers: ['Alex Kumar', 'Jamie Lee', 'Chris Park', 'Sophie Müller'],
    word_count: 12340,
    format: 'vtt',
    status: 'ready',
    action_items_count: 5,
    decisions_count: 3,
    segments: [
      { time: '00:01:10.000', speaker: 'Alex Kumar', text: 'On-call must be formalized before we burn out the same few engineers.' },
      { time: '00:03:38.000', speaker: 'Sophie Muller', text: 'Security training should be mandatory, especially after the recent incident.' },
      { time: '00:07:11.000', speaker: 'Jamie Lee', text: 'We should deprecate the legacy payment service this year.' },
    ],
    intel: {
      decisions: [
        { id: 1, decision: 'Implement on-call rotation starting May 1st', context: 'Current system unsustainable; burnout risk identified', rationale: 'Incident volume is increasing and uneven support burden creates reliability risk.', confidence: 'High', stakeholders: ['Alex Kumar', 'Jamie Lee'], dissenters: [] },
        { id: 2, decision: 'Mandatory security training for all engineers', context: 'Recent incident revealed gaps in vulnerability awareness', rationale: 'Prevent repeat vulnerabilities by standardizing baseline security knowledge.', confidence: 'High', stakeholders: ['Chris Park', 'Sophie Müller'], dissenters: [] },
        { id: 3, decision: 'Deprecate legacy payment service by EOY', context: 'Maintenance burden exceeds benefits; replacement complete', rationale: 'Legacy surface area creates avoidable defects and slows release cycle.', confidence: 'Medium', stakeholders: ['Jamie Lee', 'Chris Park'], dissenters: [] },
      ],
      action_items: [
        { id: 1, task: 'Design on-call escalation policies', owner: 'Alex Kumar', deadline: '2025-04-20', priority: 'High' },
        { id: 2, task: 'Procure security training platform', owner: 'Sophie Müller', deadline: '2025-04-15', priority: 'High' },
        { id: 3, task: 'Plan legacy service migration', owner: 'Chris Park', deadline: '2025-05-01', priority: 'Medium' },
        { id: 4, task: 'Set up monitoring for new on-call system', owner: 'Jamie Lee', deadline: '2025-04-25', priority: 'Medium' },
        { id: 5, task: 'Communicate timeline to stakeholders', owner: 'Alex Kumar', deadline: '2025-04-10', priority: 'Low' },
      ],
    },
  },
  {
    id: '3',
    name: 'Client Success: Acme Corp Debrief',
    filename: 'acme-debrief.txt',
    uploaded_at: '2025-03-31T16:45:00Z',
    speakers: ['Nina Thompson', 'Robert Chang', 'Emma Walsh'],
    word_count: 5230,
    format: 'txt',
    status: 'processing',
    action_items_count: 0,
    decisions_count: 0,
    segments: [
      { time: null, speaker: 'Nina Thompson', text: 'Client wants tighter SLA commitments before expansion.' },
      { time: null, speaker: 'Robert Chang', text: 'Budget approval depends on clear risk mitigation plan.' },
    ],
    intel: null,
  },
]

export const mockConflicts = [
  {
    topic: 'api, launch, delay',
    severity: 'High',
    current_meeting: 'Q1 Product Strategy Review',
    current_decision: 'Delay advanced analytics dashboard to Q3',
    previous_meeting: 'Engineering All-Hands April',
    previous_decision: 'Implement on-call rotation starting May 1st and accelerate platform hardening',
  }
]

export const mockBrief = {
  classification: 'UNCLASSIFIED',
  threat_level: 'YELLOW',
  threat_reason: 'Multiple medium-priority action items with overlapping deadlines pose execution risk.',
  headline: 'Q1 Product Pivot: Mobile-First & Performance Optimization',
  situation: 'Organization is shifting focus to mobile user experience and backend API performance. Key constraint: limited engineering capacity requires prioritization and phased rollout.',
  key_intel: [
    'Mobile usage now 40% of total; retention differential suggests untapped growth',
    'API latency increased 200ms YoY; impacting enterprise customer satisfaction',
    'UI framework fragmentation across teams is technical debt risk',
    '3 critical decisions made; 7 action items assigned with high confidence',
  ],
  orders: [
    'Execute mobile UX audit by April 15 — gates design sprint',
    'Complete API profiling by April 10 — informs optimization roadmap',
    'Socialize framework migration plan with team leads by April 20',
    'Allocate 3 FTEs to performance track through Q2',
  ],
  risk_flags: [
    'Sarah Chen overloaded: 3 critical assignments; mitigate with async ownership',
    'Q3 analytics feature deprioritization may conflict with sales commitments',
    'Mobile redesign scope unclear; recommend design kickoff within 48h',
  ],
}
