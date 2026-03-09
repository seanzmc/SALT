import { DocumentCategory, MessageThreadCategory, OpeningPriority, PaymentStatus, Priority, Role, TaskStatus, TimelinePhaseStatus } from "@prisma/client";

export const projectAnchorDate = new Date("2026-04-01T09:00:00.000Z");

type PhaseSeed = {
  slug: string;
  title: string;
  description: string;
  status: TimelinePhaseStatus;
  startOffsetDays: number;
  endOffsetDays: number;
  notes?: string;
  blockers?: string;
  milestones: string[];
};

export const sectionSeeds = [
  {
    slug: "space-planning-layout",
    title: "Space Planning & Layout",
    description:
      "Room program, layout, traffic flow, privacy, and operational zoning for a 1,600 sq ft Lakeland clinic."
  },
  {
    slug: "construction-buildout",
    title: "Construction & Build-Out",
    description:
      "Tenant improvement scope covering framing, plumbing, electrical, HVAC, acoustics, storefront, and ADA coordination."
  },
  {
    slug: "furniture-fixtures-equipment",
    title: "Furniture, Fixtures & Equipment",
    description:
      "Reception, treatment, laundry, office, and janitorial FF&E required to operate the clinic."
  },
  {
    slug: "laser-aesthetic-equipment",
    title: "Laser Hair Removal & Aesthetic Equipment",
    description:
      "Primary devices, accessories, safety equipment, service coverage, and training readiness."
  },
  {
    slug: "supplies-consumables",
    title: "Supplies & Consumables",
    description:
      "Treatment supplies, infection-control stock, laundry supplies, and opening inventory strategy."
  },
  {
    slug: "technology-software",
    title: "Technology & Software",
    description:
      "Practice management, payments, phones, Wi-Fi, cybersecurity, and office technology."
  },
  {
    slug: "licensing-compliance-business-setup",
    title: "Licensing, Compliance & Business Setup",
    description:
      "Florida and local readiness items that must be verified with professionals and authorities."
  },
  {
    slug: "staffing-operations-setup",
    title: "Staffing & Operations Setup",
    description:
      "Opening roles, onboarding, SOPs, and day-to-day operating procedures."
  },
  {
    slug: "marketing-client-experience-setup",
    title: "Marketing & Client Experience Setup",
    description:
      "In-clinic brand execution, service presentation, comfort details, reviews, and launch planning."
  },
  {
    slug: "budget-framework",
    title: "Budget Framework",
    description:
      "Budget map anchored to the planning guide categories and line-item structure."
  },
  {
    slug: "opening-timeline",
    title: "Opening Timeline",
    description:
      "Ten build-out phases from secured space through grand opening and the first 30 days."
  },
  {
    slug: "phase-1-vs-phase-2-buildout",
    title: "Phase 1 vs Phase 2 Build-Out",
    description:
      "Lean-opening scope, future-proofing items, and phase-two expansion paths."
  },
  {
    slug: "room-by-room-procurement-checklist",
    title: "Room-by-Room Procurement Checklist",
    description:
      "Procurement tasks organized by reception, consult, treatment, workroom, utility, break, and restroom zones."
  },
  {
    slug: "master-opening-checklist",
    title: "Master Opening Checklist",
    description:
      "Critical cross-functional tasks that must be closed before launch."
  },
  {
    slug: "missing-items-risk-list",
    title: "Missing-Items Risk List",
    description:
      "Commonly overlooked issues in med spa and laser clinic build-outs."
  },
  {
    slug: "florida-lakeland-verification-notes",
    title: "Florida / Lakeland Verification Notes",
    description:
      "Location-specific reminders for use approval, permitting, occupancy, laser rules, and biomedical waste."
  }
] as const;

export const phaseSeeds: PhaseSeed[] = [
  {
    slug: "pre-lease-immediately-after-securing-space",
    title: "Pre-lease / immediately after securing space",
    description:
      "Confirm zoning/use, outline the layout, model the budget, secure funding, review the work letter, and shortlist design-build partners.",
    status: TimelinePhaseStatus.IN_PROGRESS,
    startOffsetDays: 0,
    endOffsetDays: 21,
    notes:
      "Lease is assumed executed in this seed scenario. Final device specs remain intentionally flexible until the site constraints are confirmed.",
    blockers: "",
    milestones: [
      "Confirm permitted use with City of Lakeland and landlord",
      "Approve preliminary room program",
      "Finalize funding assumptions and contingency target"
    ]
  },
  {
    slug: "design-and-due-diligence",
    title: "Design and due diligence",
    description:
      "Measure the space, review code and ADA impacts, define sink strategy, gather equipment cut sheets, and finalize finish intent.",
    status: TimelinePhaseStatus.IN_PROGRESS,
    startOffsetDays: 14,
    endOffsetDays: 42,
    notes:
      "Electrical loads, plumbing points, signage constraints, and equipment clearances should be locked before permit submission.",
    blockers: "",
    milestones: [
      "Complete measured plan and reflected ceiling coordination",
      "Confirm sink strategy and plumbing points",
      "Collect device cut sheets and power requirements"
    ]
  },
  {
    slug: "permitting-and-bidding",
    title: "Permitting and bidding",
    description:
      "Submit plans, refine GC scope, compare bids, and place long-lead orders once the scope is stable.",
    status: TimelinePhaseStatus.NOT_STARTED,
    startOffsetDays: 35,
    endOffsetDays: 63,
    notes:
      "Long-lead doors, glass, cabinetry, and signage should only be ordered after the scope is stable enough to avoid change-order churn.",
    blockers: "Awaiting final electrical cut sheet from primary device vendor.",
    milestones: [
      "Permit package submitted",
      "GC bids normalized and reviewed",
      "Long-lead procurement list approved"
    ]
  },
  {
    slug: "construction-rough-in",
    title: "Construction rough-in",
    description:
      "Handle demolition, framing, plumbing, electrical, HVAC, data, and access-control rough-in.",
    status: TimelinePhaseStatus.NOT_STARTED,
    startOffsetDays: 64,
    endOffsetDays: 95,
    milestones: [
      "Framing inspection passed",
      "Electrical rough-in complete with extra low-voltage runs",
      "HVAC and plumbing rough-in signed off"
    ]
  },
  {
    slug: "finishes-and-fixture-install",
    title: "Finishes and fixture install",
    description:
      "Install drywall finish, paint, flooring, ceilings, lighting, cabinetry, mirrors, storefront elements, and signage.",
    status: TimelinePhaseStatus.NOT_STARTED,
    startOffsetDays: 96,
    endOffsetDays: 122,
    milestones: [
      "Flooring and paint complete",
      "Cabinetry and mirrors installed",
      "Storefront signage installed per landlord and permit rules"
    ]
  },
  {
    slug: "equipment-it-software-setup",
    title: "Equipment, IT, and software setup",
    description:
      "Coordinate device delivery/install, networking, phones, security, software buildout, digital forms, and photo workflow.",
    status: TimelinePhaseStatus.NOT_STARTED,
    startOffsetDays: 116,
    endOffsetDays: 138,
    milestones: [
      "Internet, phones, Wi-Fi, cameras, and alarm active",
      "EMR/POS/forms configured",
      "Primary device installed and tested"
    ]
  },
  {
    slug: "compliance-and-staffing",
    title: "Compliance and staffing",
    description:
      "Activate insurance, verify licensure, complete policies/manuals, hire, train, and drill in the actual rooms.",
    status: TimelinePhaseStatus.NOT_STARTED,
    startOffsetDays: 125,
    endOffsetDays: 147,
    milestones: [
      "Insurance bound for opening",
      "Licensure and supervision model verified",
      "Staff competency sign-offs complete"
    ]
  },
  {
    slug: "final-inspections-and-punch-list",
    title: "Final inspections and punch list",
    description:
      "Close municipal finals, occupancy approval, landlord punch, deep cleaning, and merchandising.",
    status: TimelinePhaseStatus.NOT_STARTED,
    startOffsetDays: 145,
    endOffsetDays: 156,
    milestones: [
      "Final inspections completed",
      "CO or equivalent occupancy approval received",
      "Punch list closed"
    ]
  },
  {
    slug: "soft-opening",
    title: "Soft opening",
    description:
      "Run limited traffic to test workflows, scripts, room reset, and supply assumptions before the public launch.",
    status: TimelinePhaseStatus.NOT_STARTED,
    startOffsetDays: 157,
    endOffsetDays: 164,
    milestones: [
      "Soft opening calendar published",
      "Workflow issues logged and corrected",
      "Review-request flow tested"
    ]
  },
  {
    slug: "grand-opening-first-30-days",
    title: "Grand opening and first 30 days",
    description:
      "Launch with offers, referrals, content capture, and tight KPI tracking on rebooks, cancellations, retail, and supply burn.",
    status: TimelinePhaseStatus.NOT_STARTED,
    startOffsetDays: 165,
    endOffsetDays: 195,
    milestones: [
      "Grand opening assets ready",
      "Thirty-day KPI dashboard reviewed weekly",
      "Reorder and staffing assumptions tuned from live demand"
    ]
  }
] as const;

export const budgetCategorySeeds = [
  {
    slug: "build-out",
    title: "Build-out",
    description:
      "Architect/design, permitting, GC labor, framing, drywall, electrical, plumbing, HVAC, paint, flooring, doors, millwork, and signage."
  },
  {
    slug: "furniture-fixtures",
    title: "Furniture & fixtures",
    description:
      "Reception desk, seating, mirrors, carts, shelving, stools, storage, and break room items."
  },
  {
    slug: "clinical-equipment",
    title: "Clinical equipment",
    description:
      "Treatment beds/chairs, lighting, sanitation equipment, photography setup, and laundry."
  },
  {
    slug: "laser-device-equipment",
    title: "Laser & device equipment",
    description:
      "Primary platform, handpieces, cooling, service plan, and shipping/install."
  },
  {
    slug: "software-tech",
    title: "Software & tech",
    description:
      "EMR/scheduling, POS, phones, website, computers, network, cameras, and printer."
  },
  {
    slug: "compliance-insurance",
    title: "Compliance & insurance",
    description:
      "Licenses, permits, professional fees, policy drafting, and insurance premiums."
  },
  {
    slug: "supplies-opening-inventory",
    title: "Supplies & opening inventory",
    description:
      "Consumables, linens, retail opening stock, office supplies, and housekeeping."
  },
  {
    slug: "marketing",
    title: "Marketing",
    description:
      "Branding, print materials, launch campaign, signage, and content/photo setup."
  },
  {
    slug: "working-capital",
    title: "Working capital",
    description:
      "Payroll buffer, rent, utilities, financing obligations, ad spend, and contingencies."
  },
  {
    slug: "optional-upgrades",
    title: "Optional upgrades",
    description:
      "Additional device, upgraded finishes, digital menu boards, premium decor, and future room build-out."
  }
] as const;

type TaskSeed = {
  key: string;
  sectionSlug: (typeof sectionSeeds)[number]["slug"];
  title: string;
  description: string;
  priority: Priority;
  status?: TaskStatus;
  openingPriority: OpeningPriority;
  dueOffsetDays: number;
  phaseSlug?: (typeof phaseSeeds)[number]["slug"];
  assigneeRole?: Role;
  notes?: string;
  blockedReason?: string;
  roomName?: string;
  tags?: string[];
  dependsOn?: string[];
  subtasks?: string[];
  isRiskItem?: boolean;
  isVerificationNote?: boolean;
  isMasterOpeningItem?: boolean;
  isRoomProcurement?: boolean;
};

export const taskSeeds: TaskSeed[] = [
  {
    key: "room-program-confirmed",
    sectionSlug: "space-planning-layout",
    title: "Confirm recommended room program for the 1,600 sq ft clinic",
    description:
      "Plan for reception/waiting, one consultation room, three to four treatment rooms, a provider workroom, laundry/utility, break nook, ADA restroom, and back-of-house storage while preserving corridor and mechanical space.",
    priority: Priority.CRITICAL,
    status: TaskStatus.COMPLETE,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 4,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["layout", "programming"],
    subtasks: [
      "Validate treatment/consultation revenue space against the 55%-65% planning target",
      "Reserve 15%-20% for reception/client circulation",
      "Preserve 20%-25% for back-of-house and support"
    ]
  },
  {
    key: "lean-opening-layout",
    sectionSlug: "space-planning-layout",
    title: "Map lean-opening layout and shell-ready future room capacity",
    description:
      "Support a lean opening with front desk, waiting, consult room, two treatment rooms, shared provider/workroom, laundry/storage, restroom, and shell-ready capacity for one to two future treatment rooms.",
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 8,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["phase-planning", "layout"]
  },
  {
    key: "hipaa-speech-privacy",
    sectionSlug: "space-planning-layout",
    title: "Review HIPAA-adjacent speech and screen privacy in reception and consult areas",
    description:
      "Avoid overheard conversations and visible protected information by adjusting consult room privacy, monitor placement, and front-desk acoustics.",
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 12,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.COLLABORATOR,
    tags: ["privacy", "layout", "hipaa"]
  },
  {
    key: "sink-strategy",
    sectionSlug: "space-planning-layout",
    title: "Decide treatment-room sink strategy before permit drawings are finalized",
    description:
      "Determine whether each treatment room needs a sink or whether a shared sink strategy is operationally and legally acceptable.",
    priority: Priority.CRITICAL,
    status: TaskStatus.BLOCKED,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 16,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["plumbing", "treatment-room"],
    blockedReason: "Awaiting service-scope and supervision-model confirmation to finalize room sink requirements."
  },
  {
    key: "photo-location",
    sectionSlug: "space-planning-layout",
    title: "Assign a private photography location with backdrop and controlled lighting",
    description:
      "Reserve a consistent private location for before-and-after photography with neutral backdrop, controlled light, and consent workflow support.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 28,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.COLLABORATOR,
    tags: ["photography", "client-experience"]
  },
  {
    key: "framing-backing-coordination",
    sectionSlug: "construction-buildout",
    title: "Confirm framing plan and wall backing before build starts",
    description:
      "Verify wall locations against furniture and equipment plans and add backing for TVs, shelves, mirrors, dispensers, and future accessories.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 41,
    phaseSlug: "permitting-and-bidding",
    assigneeRole: Role.OWNER_ADMIN,
    dependsOn: ["room-program-confirmed", "sink-strategy"],
    tags: ["construction", "coordination"]
  },
  {
    key: "acoustic-insulation-spec",
    sectionSlug: "construction-buildout",
    title: "Specify acoustic insulation and solid-core doors for consult and treatment privacy",
    description:
      "Improve acoustic privacy at treatment and consultation rooms, especially near waiting areas or demising walls.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 45,
    phaseSlug: "permitting-and-bidding",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["privacy", "construction"]
  },
  {
    key: "electrical-device-specs",
    sectionSlug: "construction-buildout",
    title: "Lock electrical rough-in to device amperage, voltage, and dedicated circuit needs",
    description:
      "Collect the actual electrical specs for each major device before electrical rough-in so the clinic does not rely on extensions or late rework.",
    priority: Priority.CRITICAL,
    status: TaskStatus.BLOCKED,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 50,
    phaseSlug: "permitting-and-bidding",
    assigneeRole: Role.OWNER_ADMIN,
    blockedReason: "Primary hair-removal platform selection is pending final quote and service coverage comparison.",
    tags: ["electrical", "devices"],
    dependsOn: ["device-selection"]
  },
  {
    key: "low-voltage-prewire",
    sectionSlug: "construction-buildout",
    title: "Pre-wire cameras, speakers, access control, and extra data drops while walls are open",
    description:
      "Hardwire front desk, security, phones, printers, access control, and stationary work areas with spare data runs during rough-in.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 76,
    phaseSlug: "construction-rough-in",
    assigneeRole: Role.COLLABORATOR,
    tags: ["it", "security", "construction"]
  },
  {
    key: "lighting-control-zones",
    sectionSlug: "construction-buildout",
    title: "Coordinate zone lighting and controls for reception, consult, treatment, and back-of-house",
    description:
      "Reception should feel flattering and branded, consult rooms color-accurate, treatment rooms controllable, and back-of-house bright and functional.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 96,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.COLLABORATOR,
    tags: ["lighting", "design"]
  },
  {
    key: "ada-storefront-fire-review",
    sectionSlug: "construction-buildout",
    title: "Finish ADA, storefront signage, and fire-safety coordination with licensed professionals",
    description:
      "Verify routes, door clearances, thresholds, restroom accessibility, signage rules, extinguisher locations, exit signage, and any sprinkler or alarm changes.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 112,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["ada", "fire-safety", "signage"]
  },
  {
    key: "reception-millwork",
    sectionSlug: "furniture-fixtures-equipment",
    title: "Procure front desk millwork, transaction counter, and concealed cable management",
    description:
      "Reception requires a functional check-in counter with locking drawers, equipment storage, and clean cable routing for POS, monitors, printer, and phones.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 87,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["reception", "ff&e"]
  },
  {
    key: "waiting-retail-fixtures",
    sectionSlug: "furniture-fixtures-equipment",
    title: "Order waiting seating, retail fixtures, and refreshment station pieces",
    description:
      "Select commercial-grade seating, side tables, retail shelving, lighting, and refreshment elements that preserve privacy and accessibility.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 103,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.COLLABORATOR,
    tags: ["reception", "retail"]
  },
  {
    key: "treatment-room-support-furniture",
    sectionSlug: "furniture-fixtures-equipment",
    title: "Standardize treatment-room support furniture and sanitation stations",
    description:
      "Each treatment room needs an adjustable bed or chair, stool, rolling cart, storage, hamper, tissue holder, concealed waste, and clean/dirty zoning.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 118,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    tags: ["treatment-room", "ff&e"]
  },
  {
    key: "utility-break-janitorial",
    sectionSlug: "furniture-fixtures-equipment",
    title: "Equip laundry, break nook, office, and janitorial support areas",
    description:
      "Install washer/dryer, bins, shelving, fridge, microwave, office admin station, shred bin, and wall-mounted cleaning organization.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 123,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    tags: ["back-of-house", "operations"]
  },
  {
    key: "device-selection",
    sectionSlug: "laser-aesthetic-equipment",
    title: "Select primary hair-removal platform for launch volume, skin-type mix, and staffing model",
    description:
      "Choose the launch device based on expected treatment volume, target skin types, speed goals, service mix, supervision model, and budget.",
    priority: Priority.CRITICAL,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 36,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["device", "vendor"]
  },
  {
    key: "secondary-service-scope",
    sectionSlug: "laser-aesthetic-equipment",
    title: "Decide whether launch includes only hair removal or adjacent aesthetic services",
    description:
      "Clarify whether the opening phase includes adjacent services such as photofacial, pigment, vascular, skin rejuvenation, or tightening where lawful and clinically appropriate.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 30,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["service-line", "phase-planning"]
  },
  {
    key: "device-accessories-safety",
    sectionSlug: "laser-aesthetic-equipment",
    title: "Procure handpieces, cooling, eye protection, and documentation accessories",
    description:
      "Include extra tips, gauges, cooling aids, patient/provider eyewear, photo gear, and manufacturer-recommended replacement parts.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 122,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    tags: ["device", "safety", "procurement"]
  },
  {
    key: "device-service-and-training",
    sectionSlug: "laser-aesthetic-equipment",
    title: "Finalize device warranty, downtime plan, maintenance logs, and training sign-offs",
    description:
      "Compare service coverage, document preventive maintenance, define downtime workflows, and record manufacturer training before live treatment.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 135,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["device", "training", "uptime"],
    dependsOn: ["device-selection"]
  },
  {
    key: "treatment-consumables",
    sectionSlug: "supplies-consumables",
    title: "Order core treatment consumables and comfort supplies",
    description:
      "Stock gloves, gauze, razors, marking pencils, gel if applicable, post-care products, cooling items, disposable covers, tissues, cotton rounds, robes, and blankets.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 128,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    tags: ["inventory", "treatment"]
  },
  {
    key: "infection-control-stock",
    sectionSlug: "supplies-consumables",
    title: "Stock disinfectants, hand hygiene, waste supplies, and laundry supplies",
    description:
      "Purchase disinfectants compatible with equipment, sanitizer, soap, towels, liners, sharps supplies if needed, detergent, signage, and spare linen sets.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 130,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    tags: ["infection-control", "inventory"]
  },
  {
    key: "opening-order-strategy",
    sectionSlug: "supplies-consumables",
    title: "Split initial purchasing into launch stock, 30-day replenishment, and reserve stock",
    description:
      "Avoid trapping cash in excess inventory by separating launch stock from replenishment and reserve purchases.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 134,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["cash-flow", "inventory"]
  },
  {
    key: "practice-management-stack",
    sectionSlug: "technology-software",
    title: "Configure practice management, charting, reminders, memberships, and reporting",
    description:
      "Scheduling, charting, intake, treatment notes, photography links, packages, reminders, deposits, and reporting should live in a system the team will use consistently.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 120,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["software", "operations"]
  },
  {
    key: "payments-booking-forms",
    sectionSlug: "technology-software",
    title: "Enable POS, online booking, and digitized forms with the right guardrails",
    description:
      "Support payments, card-on-file, financing flows, booking rules, no-show settings, and digital intake, consent, privacy, and aftercare forms.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 124,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    tags: ["booking", "payments", "forms"],
    dependsOn: ["practice-management-stack"]
  },
  {
    key: "phones-wifi-cybersecurity",
    sectionSlug: "technology-software",
    title: "Stand up business phones, segmented Wi-Fi, MFA, firewall, backups, and office tech",
    description:
      "Activate business lines, staff and guest Wi-Fi, role-based access, printer/scanner, shredder, router management, and cloud backup permissions.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 126,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    tags: ["security", "network"]
  },
  {
    key: "website-domain-booking-link",
    sectionSlug: "technology-software",
    title: "Finalize domain, branded email, website essentials, and booking-link strategy",
    description:
      "Set up a branded website, domain, email addresses, service pages, forms, FAQ, pricing logic, and the online booking link path.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 140,
    phaseSlug: "grand-opening-first-30-days",
    assigneeRole: Role.COLLABORATOR,
    tags: ["marketing", "website"]
  },
  {
    key: "entity-tax-banking",
    sectionSlug: "licensing-compliance-business-setup",
    title: "Complete business entity, EIN, banking, merchant processing, and bookkeeping setup",
    description:
      "Confirm entity formation, tax setup, merchant accounts, and bookkeeping workflows before the clinic begins transacting.",
    priority: Priority.CRITICAL,
    status: TaskStatus.COMPLETE,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 10,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["business-setup", "finance"]
  },
  {
    key: "zoning-use-confirmation",
    sectionSlug: "licensing-compliance-business-setup",
    title: "Verify zoning, permitted use, and any landlord or plaza restrictions at the Lakeland address",
    description:
      "Confirm the intended use is allowed before investing in plans, improvements, or equipment.",
    priority: Priority.CRITICAL,
    status: TaskStatus.COMPLETE,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 2,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["lakeland", "zoning"]
  },
  {
    key: "permits-and-occupancy-path",
    sectionSlug: "licensing-compliance-business-setup",
    title: "Confirm permit, inspection, and occupancy approval pathway before buildout spending accelerates",
    description:
      "Tenant improvements usually require permit review, inspections, and final approvals before lawful occupancy and opening.",
    priority: Priority.CRITICAL,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 22,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["permit", "occupancy"]
  },
  {
    key: "licensure-supervision-laser-rules",
    sectionSlug: "licensing-compliance-business-setup",
    title: "Verify provider licensure, physician supervision, and Florida laser/light-based requirements",
    description:
      "Confirm the licensure, supervision structure, protocols, and any electrology or facility requirements that apply to each provider and service.",
    priority: Priority.CRITICAL,
    status: TaskStatus.BLOCKED,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 26,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["florida", "laser", "compliance"],
    blockedReason: "Awaiting counsel and Florida Department of Health guidance confirmation for the final service mix."
  },
  {
    key: "osha-hipaa-biomedical-policies",
    sectionSlug: "licensing-compliance-business-setup",
    title: "Prepare OSHA, privacy, waste, incident, maintenance, and policy-manual documentation",
    description:
      "Build the operational document set covering hazard communication, confidentiality, incident handling, logs, cleaning, maintenance, and waste workflows.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 132,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    tags: ["policies", "osha", "hipaa"]
  },
  {
    key: "insurance-bind",
    sectionSlug: "licensing-compliance-business-setup",
    title: "Bind general, professional, property, workers comp, cyber, and equipment coverage for opening",
    description:
      "Work with the broker to secure the clinic’s operating coverage before launch and device installation.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 136,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["insurance", "opening"]
  },
  {
    key: "opening-role-plan",
    sectionSlug: "staffing-operations-setup",
    title: "Confirm opening staffing plan for owner, providers, front desk, and part-time support",
    description:
      "Set the opening staffing mix without overloading payroll before demand is proven.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 90,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["staffing", "payroll"]
  },
  {
    key: "sop-library",
    sectionSlug: "staffing-operations-setup",
    title: "Create written SOPs for consults, treatment, no-shows, inventory, maintenance, opening, and closing",
    description:
      "Document the repeatable operating system so staff do not invent their own version under launch pressure.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 138,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    tags: ["sop", "training"]
  },
  {
    key: "core-training-and-signoffs",
    sectionSlug: "staffing-operations-setup",
    title: "Run core training and competency sign-offs in the actual rooms with the actual tools",
    description:
      "Train on software, intake, room reset, contraindications, photography, safety, emergency response, and customer service before live treatment.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 145,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["training", "competency"],
    dependsOn: ["practice-management-stack", "device-service-and-training", "sop-library"]
  },
  {
    key: "daily-opening-closing-cleaning",
    sectionSlug: "staffing-operations-setup",
    title: "Post opening, closing, cleaning, and inventory-count procedures with ownership assigned",
    description:
      "Cover alarm, lighting, room setup, cashout, chart completion, laundry, waste, charging, par levels, reorder points, and monthly counts.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 147,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    tags: ["daily-ops", "inventory"]
  },
  {
    key: "brand-assets-in-space",
    sectionSlug: "marketing-client-experience-setup",
    title: "Deploy logo files, print signage, treatment menus, digital displays, and in-space brand standards",
    description:
      "Carry the clinic brand consistently through every physical touchpoint, not just the storefront.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 120,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.COLLABORATOR,
    tags: ["brand", "signage"]
  },
  {
    key: "client-experience-details",
    sectionSlug: "marketing-client-experience-setup",
    title: "Set comfort details, review workflow, retail talking points, and grand-opening plan",
    description:
      "Finalize beverage, charging, robes/drapes, music, restroom amenities, review requests, retail education, referral cards, and launch-day operations.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 152,
    phaseSlug: "soft-opening",
    assigneeRole: Role.COLLABORATOR,
    tags: ["client-experience", "launch"]
  },
  {
    key: "budget-tracker-ready",
    sectionSlug: "budget-framework",
    title: "Use must-have, can-phase-in, and optional-upgrade labels across every budget line",
    description:
      "Track vendor quotes, deposits due, lead times, and responsibility while carrying a meaningful TI and launch contingency.",
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 18,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["budget", "contingency"]
  },
  {
    key: "timeline-baseline",
    sectionSlug: "opening-timeline",
    title: "Baseline the 10-phase opening timeline and link dependencies before announcing dates",
    description:
      "Do not lock a hard opening date until approval path, punch-list status, equipment delivery, and staffing readiness are grounded in reality.",
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 14,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["timeline", "launch"]
  },
  {
    key: "phase-1-must-have",
    sectionSlug: "phase-1-vs-phase-2-buildout",
    title: "Define Phase 1 must-have opening scope",
    description:
      "Phase 1 should include reception, waiting, consult room, two treatment rooms, ADA restroom, compact workroom/laundry, core software, primary device, essential furniture, inventory, and compliance setup.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 20,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["phase-1", "cash-protection"]
  },
  {
    key: "phase-1-future-proofing",
    sectionSlug: "phase-1-vs-phase-2-buildout",
    title: "Build in Phase 2 future-proofing during Phase 1 construction",
    description:
      "Rough-in extra power/data, pre-plan future cabinetry, reserve a shell-ready room or flex room, and keep finishes scalable for later expansion.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 72,
    phaseSlug: "construction-rough-in",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["phase-2", "future-proofing"],
    dependsOn: ["phase-1-must-have"]
  },
  {
    key: "phase-2-options",
    sectionSlug: "phase-1-vs-phase-2-buildout",
    title: "Document Phase 2 activation list for extra rooms, devices, decor, and staffing",
    description:
      "Define what gets activated later: third/fourth treatment room, secondary device, upgraded retail, premium millwork, photo wall, and larger team.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.OPTIONAL_UPGRADE,
    dueOffsetDays: 160,
    phaseSlug: "soft-opening",
    assigneeRole: Role.COLLABORATOR,
    tags: ["phase-2", "roadmap"]
  },
  {
    key: "procure-reception",
    sectionSlug: "room-by-room-procurement-checklist",
    title: "Procure reception and waiting-room opening package",
    description:
      "Front desk, guest seats, side tables, retail shelving, POS/computer/phone/printer, brand signage, mirror, charging, and refreshment items.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 110,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.COLLABORATOR,
    roomName: "Reception / Waiting",
    tags: ["procurement", "reception"],
    isRoomProcurement: true
  },
  {
    key: "procure-consultation-room",
    sectionSlug: "room-by-room-procurement-checklist",
    title: "Procure consultation-room furniture and consent/photo support items",
    description:
      "Desk or consult table, guest chairs, provider chair, monitor/tablet stand, mirror, task lighting, secure storage, and photo/consent items.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 112,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.COLLABORATOR,
    roomName: "Consultation Room",
    tags: ["procurement", "consult"],
    isRoomProcurement: true
  },
  {
    key: "procure-treatment-room",
    sectionSlug: "room-by-room-procurement-checklist",
    title: "Procure treatment-room package for each active launch room",
    description:
      "Treatment bed/chair, stool, rolling cart, mirror, hamper, trash, sharps where applicable, disinfectant setup, eye protection, linens, and small supplies stock.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 118,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    roomName: "Treatment Room",
    tags: ["procurement", "treatment-room"],
    isRoomProcurement: true
  },
  {
    key: "procure-provider-workroom",
    sectionSlug: "room-by-room-procurement-checklist",
    title: "Procure provider workroom storage, charging, and label-print station",
    description:
      "Shelving, locked cabinet, charging station, printer, label printer, stock bins, and binder/manual station.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 119,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    roomName: "Provider Workroom",
    tags: ["procurement", "back-of-house"],
    isRoomProcurement: true
  },
  {
    key: "procure-laundry-utility",
    sectionSlug: "room-by-room-procurement-checklist",
    title: "Procure laundry and utility-room operating package",
    description:
      "Washer/dryer, hampers, shelves, detergent storage, folding surface, and utility sink accessories if included.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 120,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    roomName: "Laundry / Utility",
    tags: ["procurement", "laundry"],
    isRoomProcurement: true
  },
  {
    key: "procure-break-nook",
    sectionSlug: "room-by-room-procurement-checklist",
    title: "Procure break nook appliances, storage, and staff cubbies",
    description:
      "Mini fridge, microwave, shelving, seating counter, trash/recycling, and staff cubbies or lockers.",
    priority: Priority.LOW,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 126,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    roomName: "Break Nook",
    tags: ["procurement", "staff"],
    isRoomProcurement: true
  },
  {
    key: "procure-restroom",
    sectionSlug: "room-by-room-procurement-checklist",
    title: "Procure restroom accessories and cleaning-checklist station",
    description:
      "Soap dispenser, hand-dry solution, toilet paper storage, trash can, mirror, amenity basket, and posted cleaning checklist holder.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 127,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    roomName: "Restroom",
    tags: ["procurement", "restroom"],
    isRoomProcurement: true
  },
  {
    key: "master-lease-use",
    sectionSlug: "master-opening-checklist",
    title: "Lease fully executed and permitted use confirmed",
    description:
      "Lease status and permitted-use confirmation must be closed before downstream spending escalates.",
    priority: Priority.CRITICAL,
    status: TaskStatus.COMPLETE,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 1,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true
  },
  {
    key: "master-room-plan",
    sectionSlug: "master-opening-checklist",
    title: "Final room plan approved by owner, designer, and contractor",
    description:
      "The approved room plan should reflect layout, device needs, storage, and privacy priorities before hard construction decisions are locked.",
    priority: Priority.CRITICAL,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 20,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true
  },
  {
    key: "master-device-requirements",
    sectionSlug: "master-opening-checklist",
    title: "Device electrical, plumbing, HVAC, and room requirements incorporated into drawings",
    description:
      "Coordinate device infrastructure before final permit submission and rough-in.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 38,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true,
    dependsOn: ["device-selection", "sink-strategy"]
  },
  {
    key: "master-permit-submission",
    sectionSlug: "master-opening-checklist",
    title: "Permit applications submitted and tracked",
    description:
      "Submit and actively track permit packages so review delays are visible early.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 42,
    phaseSlug: "permitting-and-bidding",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true,
    dependsOn: ["master-room-plan"]
  },
  {
    key: "master-long-lead-orders",
    sectionSlug: "master-opening-checklist",
    title: "Long-lead items ordered",
    description:
      "Place doors, glass, cabinetry, signage, and other long-lead orders once scope is stable enough.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 48,
    phaseSlug: "permitting-and-bidding",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true
  },
  {
    key: "master-insurance-bound",
    sectionSlug: "master-opening-checklist",
    title: "Insurance broker engaged and opening coverage bound",
    description:
      "Coverage should be active in time for installation, occupancy, and opening exposures.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 136,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true,
    dependsOn: ["insurance-bind"]
  },
  {
    key: "master-business-ops-live",
    sectionSlug: "master-opening-checklist",
    title: "Business entity, banking, merchant processing, and bookkeeping are live",
    description:
      "The clinic must be ready to receive payments, reconcile activity, and manage vendor cash flow.",
    priority: Priority.CRITICAL,
    status: TaskStatus.COMPLETE,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 12,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true
  },
  {
    key: "master-licensure-verified",
    sectionSlug: "master-opening-checklist",
    title: "Professional licensure, supervision, and protocols verified for every service and provider",
    description:
      "Every offered service needs an explicit licensure and oversight path confirmed before launch.",
    priority: Priority.CRITICAL,
    status: TaskStatus.BLOCKED,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 138,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true,
    blockedReason: "Pending final legal/compliance confirmation for the Florida laser supervision model."
  },
  {
    key: "master-policies-complete",
    sectionSlug: "master-opening-checklist",
    title: "Policies, manuals, logs, forms, and consent packets completed",
    description:
      "The operational document set should be complete before soft opening begins.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 140,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true,
    dependsOn: ["sop-library", "osha-hipaa-biomedical-policies"]
  },
  {
    key: "master-software-configured",
    sectionSlug: "master-opening-checklist",
    title: "Scheduling, charting, payments, forms, reminders, and package logic configured",
    description:
      "Core software should be fully configured and tested before launch traffic hits.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 132,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true,
    dependsOn: ["practice-management-stack", "payments-booking-forms"]
  },
  {
    key: "master-it-security-installed",
    sectionSlug: "master-opening-checklist",
    title: "Internet, phones, Wi-Fi, cameras, alarm, and access control installed",
    description:
      "The clinic should be fully connected and secured before opening.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 134,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true,
    dependsOn: ["low-voltage-prewire", "phones-wifi-cybersecurity"]
  },
  {
    key: "master-furniture-installed",
    sectionSlug: "master-opening-checklist",
    title: "Front desk and treatment room furniture installed",
    description:
      "Critical revenue and check-in furniture should be installed ahead of training and inspections.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 136,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true,
    dependsOn: ["reception-millwork", "treatment-room-support-furniture"]
  },
  {
    key: "master-devices-live",
    sectionSlug: "master-opening-checklist",
    title: "Laser/device platforms delivered, installed, tested, and staff-trained",
    description:
      "The launch device needs installation, testing, documentation, and trained staff before live treatment.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 138,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true,
    dependsOn: ["device-service-and-training"]
  },
  {
    key: "master-opening-inventory-stocked",
    sectionSlug: "master-opening-checklist",
    title: "Opening inventory and consumables received, labeled, and stocked",
    description:
      "Opening stock should be in-room and labeled before soft opening exposes gaps.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 142,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true,
    dependsOn: ["treatment-consumables", "infection-control-stock"]
  },
  {
    key: "master-laundry-waste-live",
    sectionSlug: "master-opening-checklist",
    title: "Laundry, janitorial, and waste processes operational",
    description:
      "Support services must be operating, not just purchased, before clients arrive.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 142,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true
  },
  {
    key: "master-restroom-accessible",
    sectionSlug: "master-opening-checklist",
    title: "Restroom stocked and accessible",
    description:
      "The restroom should be client-ready and compliant before launch.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 143,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true
  },
  {
    key: "master-retail-merchandising",
    sectionSlug: "master-opening-checklist",
    title: "Retail pricing and merchandising complete",
    description:
      "Retail should be intentionally presented and priced before the clinic opens to full traffic.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 150,
    phaseSlug: "soft-opening",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true
  },
  {
    key: "master-photo-setup-tested",
    sectionSlug: "master-opening-checklist",
    title: "Before-and-after photo workflow tested",
    description:
      "Validate camera, lighting, backdrop, angles, consent support, and storage workflow before live patients.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 146,
    phaseSlug: "soft-opening",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true,
    dependsOn: ["photo-location"]
  },
  {
    key: "master-checklists-posted",
    sectionSlug: "master-opening-checklist",
    title: "Cleaning, opening, and closing checklists posted and assigned",
    description:
      "Visible accountability reduces launch drift and missed resets.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 146,
    phaseSlug: "soft-opening",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true,
    dependsOn: ["daily-opening-closing-cleaning"]
  },
  {
    key: "master-finals-complete",
    sectionSlug: "master-opening-checklist",
    title: "Final inspections complete and occupancy approval received",
    description:
      "Do not announce the hard opening until the final approval path is closed.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 156,
    phaseSlug: "final-inspections-and-punch-list",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true
  },
  {
    key: "master-soft-opening-complete",
    sectionSlug: "master-opening-checklist",
    title: "Soft opening completed and workflow issues corrected",
    description:
      "Use the soft opening to surface missing supplies, scripting gaps, reset problems, and software holes before full launch.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 164,
    phaseSlug: "soft-opening",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true
  },
  {
    key: "master-grand-opening-assets",
    sectionSlug: "master-opening-checklist",
    title: "Grand opening assets are ready: signage, offers, QR codes, reviews, and content capture",
    description:
      "Marketing and on-site operating details should be finalized before the public launch.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 166,
    phaseSlug: "grand-opening-first-30-days",
    assigneeRole: Role.COLLABORATOR,
    isMasterOpeningItem: true
  },
  {
    key: "master-working-capital",
    sectionSlug: "master-opening-checklist",
    title: "Thirty-day working capital reserve is available",
    description:
      "Opening day is the start of carrying payroll, rent, utilities, and marketing while demand ramps.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 165,
    phaseSlug: "grand-opening-first-30-days",
    assigneeRole: Role.OWNER_ADMIN,
    isMasterOpeningItem: true
  },
  {
    key: "risk-device-specs-late",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: device electrical specs obtained too late",
    description:
      "Late electrical specs can force expensive rework or unsafe improvised device setups.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 30,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    isRiskItem: true,
    tags: ["risk", "electrical"]
  },
  {
    key: "risk-storage-shortfall",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: insufficient storage in the design",
    description:
      "Clinics often regret skipping storage during design and then struggle with overflow once operations begin.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 18,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.COLLABORATOR,
    isRiskItem: true,
    tags: ["risk", "storage"]
  },
  {
    key: "risk-acoustic-privacy",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: poor acoustic privacy",
    description:
      "Clients notice overheard conversations more than finish details, so privacy risk needs an explicit mitigation plan.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 34,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.COLLABORATOR,
    isRiskItem: true,
    tags: ["risk", "privacy"]
  },
  {
    key: "risk-photo-workflow",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: no standardized photo workflow",
    description:
      "Inconsistent photography weakens marketing, treatment comparisons, and client expectation management.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 120,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    isRiskItem: true,
    tags: ["risk", "photography"]
  },
  {
    key: "risk-laundry-volume",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: underestimating laundry and linen volume",
    description:
      "Aesthetic clinics create more textile turnover than early planning assumptions usually capture.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 110,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.COLLABORATOR,
    isRiskItem: true,
    tags: ["risk", "laundry"]
  },
  {
    key: "risk-front-desk-cabling",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: weak front-desk cable management",
    description:
      "A polished front desk quickly turns into visible cable clutter without dedicated routing and storage.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 112,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.COLLABORATOR,
    isRiskItem: true,
    tags: ["risk", "reception"]
  },
  {
    key: "risk-no-contingency",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: no contingency budget",
    description:
      "Construction and launch phases routinely expose cost surprises, so a contingency plan cannot be optional.",
    priority: Priority.CRITICAL,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 14,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    isRiskItem: true,
    tags: ["risk", "budget"]
  },
  {
    key: "risk-device-downtime",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: no backup plan for device downtime",
    description:
      "Lost treatment days can cascade into cancellations, refunds, and review damage without a response plan.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 132,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.OWNER_ADMIN,
    isRiskItem: true,
    tags: ["risk", "uptime"]
  },
  {
    key: "risk-incomplete-sops",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: incomplete SOPs and treatment protocols",
    description:
      "Staff will improvise if the clinic’s operating system is not written down.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 138,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    isRiskItem: true,
    tags: ["risk", "sop"]
  },
  {
    key: "risk-software-not-ready",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: opening before software and forms are truly ready",
    description:
      "Check-in chaos travels through treatment and checkout when systems are not fully tested.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 140,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    isRiskItem: true,
    tags: ["risk", "software"]
  },
  {
    key: "risk-signage-delay",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: late signage and landlord-rule coordination",
    description:
      "Storefront visibility and permit timing can delay launch or force redesign if they are ignored until late.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 74,
    phaseSlug: "construction-rough-in",
    assigneeRole: Role.OWNER_ADMIN,
    isRiskItem: true,
    tags: ["risk", "signage"]
  },
  {
    key: "risk-working-capital-shortfall",
    sectionSlug: "missing-items-risk-list",
    title: "Mitigate risk: too little working capital after opening",
    description:
      "Opening is the beginning of carrying payroll, rent, and marketing while demand ramps.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 165,
    phaseSlug: "grand-opening-first-30-days",
    assigneeRole: Role.OWNER_ADMIN,
    isRiskItem: true,
    tags: ["risk", "working-capital"]
  },
  {
    key: "verify-lakeland-use-tax",
    sectionSlug: "florida-lakeland-verification-notes",
    title: "Lakeland verification: allowed use, planning/zoning compatibility, and local business tax",
    description:
      "Confirm allowed use, zoning compatibility, and local business tax expectations with the City of Lakeland before relying on site-plan assumptions.",
    priority: Priority.CRITICAL,
    status: TaskStatus.COMPLETE,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 2,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    isVerificationNote: true,
    tags: ["lakeland", "verification"]
  },
  {
    key: "verify-building-authority",
    sectionSlug: "florida-lakeland-verification-notes",
    title: "Lakeland verification: permit pathway, inspections, and occupancy/final approval requirements",
    description:
      "Confirm the local building-authority pathway and inspection sequence with the contractor and design team.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 18,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    isVerificationNote: true,
    tags: ["lakeland", "permit", "verification"]
  },
  {
    key: "verify-florida-laser-rules",
    sectionSlug: "florida-lakeland-verification-notes",
    title: "Florida verification: current laser/light-based hair removal licensure, supervision, and protocol requirements",
    description:
      "Confirm current Florida requirements directly with the appropriate Department of Health / Medical Quality Assurance resources for the service model.",
    priority: Priority.CRITICAL,
    status: TaskStatus.BLOCKED,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 24,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    isVerificationNote: true,
    blockedReason: "Waiting on final confirmation from Florida-specific regulatory resources and retained advisors.",
    tags: ["florida", "laser", "verification"]
  },
  {
    key: "verify-biomedical-waste",
    sectionSlug: "florida-lakeland-verification-notes",
    title: "Florida verification: biomedical waste permitting and handling requirements if sharps/waste apply",
    description:
      "If services generate sharps or biomedical waste, confirm Florida and county handling requirements before opening.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 128,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    isVerificationNote: true,
    tags: ["florida", "waste", "verification"]
  }
];

export const budgetItemSeeds = [
  {
    categorySlug: "build-out",
    lineItem: "Architect/design and permit-set coordination",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    estimate: 12000,
    vendor: "Placeholder - select architect/designer",
    leadTimeDays: 21,
    depositOffsetDays: 7,
    notes: "Placeholder estimate because the planning guide defines scope but not pricing. Replace with local quotes.",
    isPdfPlaceholder: true
  },
  {
    categorySlug: "build-out",
    lineItem: "GC labor, framing, drywall, electrical, plumbing, HVAC, paint, flooring, doors, millwork, signage",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    estimate: 140000,
    vendor: "Placeholder - select GC",
    leadTimeDays: 45,
    depositOffsetDays: 42,
    notes: "Budget placeholder carrying the PDF build-out scope and contingency mindset.",
    isPdfPlaceholder: true
  },
  {
    categorySlug: "furniture-fixtures",
    lineItem: "Reception desk, waiting seating, mirrors, shelving, stools, storage, break-room items",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    estimate: 18500,
    vendor: "Placeholder - FF&E mix",
    leadTimeDays: 30,
    depositOffsetDays: 80,
    notes: "Derived from the planning-guide FF&E list. Replace with product-level quotes.",
    isPdfPlaceholder: true
  },
  {
    categorySlug: "clinical-equipment",
    lineItem: "Treatment beds/chairs, sanitation equipment, photography setup, laundry package",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    estimate: 22000,
    vendor: "Placeholder - clinical equipment vendors",
    leadTimeDays: 25,
    depositOffsetDays: 95,
    notes: "Placeholder estimate. Scope is guide-derived; pricing is not.",
    isPdfPlaceholder: true
  },
  {
    categorySlug: "laser-device-equipment",
    lineItem: "Primary laser platform, handpieces, cooling, service plan, shipping/install",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    estimate: 95000,
    vendor: "Pending primary platform selection",
    leadTimeDays: 35,
    depositOffsetDays: 55,
    notes: "Guide-derived line item with placeholder pricing pending vendor selection.",
    isPdfPlaceholder: true
  },
  {
    categorySlug: "software-tech",
    lineItem: "EMR/scheduling, POS, phones, website, computers, network, cameras, printer",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    estimate: 14000,
    vendor: "Placeholder - software and IT stack",
    leadTimeDays: 14,
    depositOffsetDays: 100,
    notes: "Includes recurring and one-time setup assumptions as placeholders.",
    isPdfPlaceholder: true
  },
  {
    categorySlug: "compliance-insurance",
    lineItem: "Licenses, permits, professional fees, policy drafting, insurance premiums",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    estimate: 18000,
    vendor: "Placeholder - advisor and broker stack",
    leadTimeDays: 10,
    depositOffsetDays: 120,
    notes: "Guide-derived category. Replace placeholder estimate with actual professional and insurance quotes.",
    isPdfPlaceholder: true
  },
  {
    categorySlug: "supplies-opening-inventory",
    lineItem: "Consumables, linens, retail opening stock, office supplies, housekeeping",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    estimate: 9000,
    vendor: "Placeholder - mixed supply vendors",
    leadTimeDays: 10,
    depositOffsetDays: 122,
    notes: "Opening inventory placeholder sized for launch stock, replenishment, and reserve planning.",
    isPdfPlaceholder: true
  },
  {
    categorySlug: "marketing",
    lineItem: "Branding, print materials, launch campaign, signage support, content/photo setup",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    estimate: 8500,
    vendor: "Placeholder - marketing vendors",
    leadTimeDays: 12,
    depositOffsetDays: 145,
    notes: "Category taken from the planning guide. Pricing requires local creative and signage quotes.",
    isPdfPlaceholder: true
  },
  {
    categorySlug: "working-capital",
    lineItem: "Payroll buffer, rent, utilities, debt service, ad spend, contingency reserve",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    estimate: 65000,
    vendor: "Internal reserve",
    leadTimeDays: 0,
    depositOffsetDays: 150,
    notes: "Placeholder reserve target reflecting the guide’s month-one working-capital warning.",
    isPdfPlaceholder: true
  },
  {
    categorySlug: "optional-upgrades",
    lineItem: "Secondary device, upgraded finishes, digital menu boards, premium decor, extra room build-out",
    priority: Priority.LOW,
    openingPriority: OpeningPriority.OPTIONAL_UPGRADE,
    estimate: 45000,
    vendor: "Future phase vendors",
    leadTimeDays: 30,
    depositOffsetDays: 170,
    notes: "Optional upgrade bucket from the Phase 2 and budget sections of the guide.",
    isPdfPlaceholder: true
  }
] as const;

export const tagSeeds = [
  { name: "layout", color: "#1d4ed8" },
  { name: "programming", color: "#1d4ed8" },
  { name: "phase-planning", color: "#4338ca" },
  { name: "privacy", color: "#0f766e" },
  { name: "hipaa", color: "#0f766e" },
  { name: "plumbing", color: "#0f766e" },
  { name: "photography", color: "#a16207" },
  { name: "lighting", color: "#a16207" },
  { name: "client-experience", color: "#a16207" },
  { name: "construction", color: "#7c3aed" },
  { name: "coordination", color: "#7c3aed" },
  { name: "electrical", color: "#b91c1c" },
  { name: "devices", color: "#b91c1c" },
  { name: "it", color: "#334155" },
  { name: "security", color: "#334155" },
  { name: "network", color: "#334155" },
  { name: "design", color: "#0f766e" },
  { name: "ada", color: "#7c3aed" },
  { name: "fire-safety", color: "#7c3aed" },
  { name: "signage", color: "#7c3aed" },
  { name: "reception", color: "#8b5cf6" },
  { name: "ff&e", color: "#8b5cf6" },
  { name: "retail", color: "#8b5cf6" },
  { name: "treatment-room", color: "#8b5cf6" },
  { name: "consult", color: "#8b5cf6" },
  { name: "back-of-house", color: "#8b5cf6" },
  { name: "laundry", color: "#8b5cf6" },
  { name: "staff", color: "#8b5cf6" },
  { name: "device", color: "#dc2626" },
  { name: "vendor", color: "#dc2626" },
  { name: "service-line", color: "#dc2626" },
  { name: "safety", color: "#dc2626" },
  { name: "uptime", color: "#dc2626" },
  { name: "inventory", color: "#15803d" },
  { name: "treatment", color: "#15803d" },
  { name: "infection-control", color: "#15803d" },
  { name: "storage", color: "#15803d" },
  { name: "waste", color: "#15803d" },
  { name: "cash-flow", color: "#15803d" },
  { name: "software", color: "#0ea5e9" },
  { name: "operations", color: "#0ea5e9" },
  { name: "booking", color: "#0ea5e9" },
  { name: "payments", color: "#0ea5e9" },
  { name: "forms", color: "#0ea5e9" },
  { name: "website", color: "#0ea5e9" },
  { name: "marketing", color: "#0ea5e9" },
  { name: "florida", color: "#ea580c" },
  { name: "lakeland", color: "#ea580c" },
  { name: "business-setup", color: "#ea580c" },
  { name: "finance", color: "#ea580c" },
  { name: "permit", color: "#ea580c" },
  { name: "occupancy", color: "#ea580c" },
  { name: "zoning", color: "#ea580c" },
  { name: "laser", color: "#ea580c" },
  { name: "compliance", color: "#ea580c" },
  { name: "policies", color: "#ea580c" },
  { name: "osha", color: "#ea580c" },
  { name: "insurance", color: "#ea580c" },
  { name: "opening", color: "#ea580c" },
  { name: "staffing", color: "#0f766e" },
  { name: "payroll", color: "#0f766e" },
  { name: "sop", color: "#0f766e" },
  { name: "training", color: "#0f766e" },
  { name: "competency", color: "#0f766e" },
  { name: "daily-ops", color: "#0f766e" },
  { name: "launch", color: "#be123c" },
  { name: "brand", color: "#be123c" },
  { name: "budget", color: "#15803d" },
  { name: "contingency", color: "#15803d" },
  { name: "timeline", color: "#4338ca" },
  { name: "phase-1", color: "#4338ca" },
  { name: "phase-2", color: "#4338ca" },
  { name: "cash-protection", color: "#4338ca" },
  { name: "future-proofing", color: "#4338ca" },
  { name: "roadmap", color: "#4338ca" },
  { name: "procurement", color: "#7c2d12" },
  { name: "restroom", color: "#7c2d12" },
  { name: "risk", color: "#991b1b" },
  { name: "working-capital", color: "#991b1b" },
  { name: "verification", color: "#1f2937" }
] as const;

export const seededDocuments = [
  {
    title: "Lakeland buildout planning guide",
    originalName: "lakeland_aesthetics_buildout_planning_guide.pdf",
    storagePath: "seed://lakeland-buildout-guide",
    mimeType: "application/pdf",
    size: 0,
    category: DocumentCategory.FLOOR_PLAN,
    notes:
      "Seed metadata record pointing to the local planning guide source. Upload a working copy to local storage if you want downloadable access in-app."
  }
] as const;

export const messageThreadSeeds = [
  {
    title: "General buildout coordination",
    scope: "GENERAL" as const,
    category: MessageThreadCategory.GENERAL,
    messages: [
      "Use this thread for cross-functional buildout coordination, owner approvals, and schedule changes.",
      "Current priority is locking the room plan, device requirements, and permit path before procurement accelerates."
    ]
  },
  {
    title: "Procurement and long-lead items",
    scope: "GENERAL" as const,
    category: MessageThreadCategory.PROCUREMENT,
    messages: [
      "Track doors, glass, cabinetry, signage, beds, and device lead times here.",
      "Front-desk millwork and device selection remain the two items most likely to affect the current launch date."
    ]
  },
  {
    title: "Compliance verification",
    scope: "GENERAL" as const,
    category: MessageThreadCategory.COMPLIANCE,
    messages: [
      "This thread is for permit, occupancy, laser supervision, and policy-manual verification follow-up.",
      "Regulatory items remain reminders and tracked tasks until local counsel, contractors, and authorities confirm the final requirements."
    ]
  }
] as const;
