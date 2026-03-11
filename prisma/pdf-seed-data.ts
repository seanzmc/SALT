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
    title: "Confirm launch room program",
    description:
      "Approve the opening room mix for reception, consult, treatment, workroom, laundry, restroom, and storage before design moves into permit coordination.",
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
    title: "Draft lean-opening layout with future room capacity",
    description:
      "Show the exact launch footprint for front desk, consult, two treatment rooms, shared workroom, laundry/storage, restroom, and one to two future rooms.",
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 8,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["phase-planning", "layout"],
    subtasks: [
      "Mark the two rooms that will open for revenue use on day one",
      "Reserve shell-ready space for one to two future treatment rooms",
      "Confirm corridor, storage, and mechanical space still work in the lean plan"
    ]
  },
  {
    key: "hipaa-speech-privacy",
    sectionSlug: "space-planning-layout",
    title: "Review speech and screen privacy at check-in and consult",
    description:
      "Confirm front-desk acoustics, consult-room privacy, and monitor placement so private information is not overheard or visible from public seating.",
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
    title: "Confirm treatment-room sink plan",
    description:
      "Decide which rooms require sinks, whether a shared sink is acceptable, and what plumbing points must be shown before permit drawings are released.",
    priority: Priority.CRITICAL,
    status: TaskStatus.BLOCKED,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 16,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["plumbing", "treatment-room"],
    blockedReason: "Awaiting service-scope and supervision-model confirmation to finalize room sink requirements.",
    subtasks: [
      "Review room-by-room sink needs against the launch service mix",
      "Confirm shared-sink vs in-room sink decision with advisors and operators",
      "Mark required plumbing points on the final layout"
    ]
  },
  {
    key: "photo-location",
    sectionSlug: "space-planning-layout",
    title: "Set photo station location and lighting standard",
    description:
      "Reserve one private location for before-and-after photos with a fixed backdrop, consistent lighting, and storage for consent and camera gear.",
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
    title: "Approve framing layout and wall backing schedule",
    description:
      "Review wall locations against the room plan and issue backing locations for mirrors, TVs, shelves, dispensers, and future accessories before framing starts.",
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
    title: "Specify acoustic privacy package for consult and treatment rooms",
    description:
      "Confirm insulation, door type, sweeps, and any other sound-control details for rooms near waiting areas or demising walls.",
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
    title: "Lock device electrical requirements before rough-in",
    description:
      "Collect the final amperage, voltage, dedicated circuit, and outlet placement requirements for each device before electrical rough-in is released.",
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
    title: "Pre-wire security, phones, and extra data drops",
    description:
      "Run hardwired lines for front desk equipment, cameras, alarm, access control, printers, and spare data drops while walls are still open.",
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
    title: "Approve lighting zones and controls by room type",
    description:
      "Set the lighting plan for reception, consult, treatment, and back-of-house so each zone has the right brightness, color quality, and control type.",
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
    title: "Close ADA, storefront, and fire-safety coordination",
    description:
      "Confirm routes, clearances, restroom accessibility, sign rules, extinguisher locations, exit signage, and any sprinkler or alarm revisions with the licensed team.",
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
    title: "Order front desk millwork and cable-managed check-in counter",
    description:
      "Release the front desk package with locking storage, transaction counter height, and concealed routing for POS, monitors, printer, and phones.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 87,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["reception", "ff&e"],
    subtasks: [
      "Approve front desk dimensions and transaction counter height",
      "Confirm locking drawer and printer storage locations",
      "Verify cable pass-throughs for POS, monitors, and phones"
    ]
  },
  {
    key: "waiting-retail-fixtures",
    sectionSlug: "furniture-fixtures-equipment",
    title: "Order waiting-room seating and retail fixtures",
    description:
      "Select the seating, side tables, shelving, display lighting, and refreshment pieces that fit the waiting area without crowding circulation.",
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
    title: "Standardize treatment-room furniture and sanitation setup",
    description:
      "Build one repeatable room package for beds, stools, carts, storage, hampers, waste, and clean/dirty zoning across every active treatment room.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 118,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    tags: ["treatment-room", "ff&e"],
    subtasks: [
      "Select one bed or chair model for all launch rooms",
      "Standardize stool, cart, hamper, and waste placement",
      "Confirm clean and dirty supply zones for each room"
    ]
  },
  {
    key: "utility-break-janitorial",
    sectionSlug: "furniture-fixtures-equipment",
    title: "Equip laundry, break, office, and janitorial support areas",
    description:
      "Complete the support-area package for washer/dryer, shelving, fridge, microwave, office station, shred bin, and cleaning-tool storage.",
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
    title: "Select primary laser platform",
    description:
      "Choose the launch platform based on treatment volume, skin-type mix, treatment speed, service scope, service response time, and budget.",
    priority: Priority.CRITICAL,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 36,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["device", "vendor"],
    subtasks: [
      "Compare final vendor quotes and financing terms",
      "Review service response-time and loaner coverage",
      "Confirm skin-type coverage and treatment speed against the launch menu",
      "Select the vendor and capture the final install scope"
    ]
  },
  {
    key: "secondary-service-scope",
    sectionSlug: "laser-aesthetic-equipment",
    title: "Confirm launch service menu beyond hair removal",
    description:
      "Decide whether opening includes only hair removal or a limited set of adjacent services such as pigment, vascular, or skin-rejuvenation treatments.",
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
    title: "Order laser accessories and safety kit",
    description:
      "Purchase handpieces, gauges, cooling support, patient and provider eyewear, photo accessories, and recommended replacement parts for launch.",
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
    title: "Finalize device service coverage and training sign-offs",
    description:
      "Close the service plan, downtime response, preventive maintenance log, and manufacturer training records before live treatments begin.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 135,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["device", "training", "uptime"],
    dependsOn: ["device-selection"],
    subtasks: [
      "Confirm warranty and service contract terms",
      "Document the downtime escalation and client reschedule plan",
      "Set up preventive maintenance and repair logs",
      "Collect manufacturer training sign-offs for each provider"
    ]
  },
  {
    key: "treatment-consumables",
    sectionSlug: "supplies-consumables",
    title: "Order treatment consumables and client comfort supplies",
    description:
      "Buy the gloves, razors, gauze, post-care items, cooling supplies, disposable covers, robes, blankets, and other room-level treatment supplies needed for opening.",
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
    title: "Stock disinfectants, hand hygiene, waste, and laundry supplies",
    description:
      "Purchase equipment-safe disinfectants, sanitizer, soap, towels, liners, detergent, signage, spare linens, and sharps or biohazard supplies if applicable.",
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
    title: "Split opening inventory into launch, 30-day, and reserve buys",
    description:
      "Set par levels so opening inventory covers launch demand without overbuying items that can be reordered after the first month.",
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
    title: "Configure practice management system",
    description:
      "Build the scheduling, charting, intake, treatment-note, reminder, package, deposit, and reporting workflows in one system the team will actually use.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 120,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["software", "operations"],
    subtasks: [
      "Configure service categories, providers, and room resources",
      "Build charting templates and treatment-note fields",
      "Enable reminders, deposits, and package or membership rules",
      "Confirm reporting views for revenue, no-shows, and rebooks"
    ]
  },
  {
    key: "payments-booking-forms",
    sectionSlug: "technology-software",
    title: "Configure payments, online booking, and digital forms",
    description:
      "Set booking rules, card-on-file settings, no-show policies, financing options, and the full digital intake, consent, privacy, and aftercare form set.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 124,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    tags: ["booking", "payments", "forms"],
    dependsOn: ["practice-management-stack"],
    subtasks: [
      "Connect merchant processing and test a live payment flow",
      "Set online booking rules, buffers, and no-show controls",
      "Publish intake, consent, privacy, and aftercare forms",
      "Test the full path from booking through completed intake"
    ]
  },
  {
    key: "phones-wifi-cybersecurity",
    sectionSlug: "technology-software",
    title: "Install phones, Wi-Fi, cameras, and security controls",
    description:
      "Activate business lines, staff and guest Wi-Fi, role-based access, cameras, printer/scanner, router controls, MFA, and backup permissions.",
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
    title: "Launch website, branded email, and booking path",
    description:
      "Publish the core site, connect the domain, create branded inboxes, and make sure the consultation and booking path works cleanly on mobile and desktop.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 140,
    phaseSlug: "grand-opening-first-30-days",
    assigneeRole: Role.COLLABORATOR,
    tags: ["marketing", "website"],
    subtasks: [
      "Connect the production domain and DNS records",
      "Create branded inboxes for bookings and general inquiries",
      "Publish homepage, service pages, FAQ, and contact page",
      "Test every booking and contact form submission path"
    ]
  },
  {
    key: "entity-tax-banking",
    sectionSlug: "licensing-compliance-business-setup",
    title: "Complete entity, banking, and bookkeeping setup",
    description:
      "Finish entity formation, tax setup, merchant accounts, and bookkeeping workflows before the clinic starts collecting revenue or paying vendors.",
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
    title: "Confirm zoning, permitted use, and landlord restrictions",
    description:
      "Verify the clinic use is allowed at the address and note any landlord or plaza restrictions before design and spend increase.",
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
    title: "Confirm permit, inspection, and occupancy pathway",
    description:
      "Map the permit submissions, inspection sequence, and final occupancy approval required before construction spending and opening commitments accelerate.",
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
    title: "Verify licensure, supervision, and Florida laser rules",
    description:
      "Confirm the licensure, supervision model, protocols, and any facility or electrology requirements that apply to each provider and service offered at launch.",
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
    title: "Finalize policy manual, logs, and waste procedures",
    description:
      "Build the working document set for hazard communication, privacy, incidents, cleaning, maintenance, and waste handling before staff training starts.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 132,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    tags: ["policies", "osha", "hipaa"],
    subtasks: [
      "Draft OSHA and hazard-communication procedures",
      "Finalize privacy, incident, and maintenance logs",
      "Document biomedical waste workflow if applicable",
      "Assemble the opening policy-manual binder or digital library"
    ]
  },
  {
    key: "insurance-bind",
    sectionSlug: "licensing-compliance-business-setup",
    title: "Bind operating insurance for opening",
    description:
      "Bind the general, professional, property, workers comp, cyber, and equipment coverage needed before install, occupancy, and opening.",
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
    title: "Confirm opening staffing plan",
    description:
      "Set the day-one staffing mix for owner coverage, providers, front desk, and part-time support without overcommitting payroll.",
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
    title: "Draft launch SOP library",
    description:
      "Write the repeatable workflows for consults, treatments, no-shows, inventory, maintenance, opening, and closing before the team trains in-room.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 138,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.COLLABORATOR,
    tags: ["sop", "training"],
    subtasks: [
      "Draft consult and treatment-room workflow SOPs",
      "Document no-show, cancellation, and rebooking steps",
      "Write inventory, maintenance, opening, and closing routines",
      "Store the approved SOP set where staff can access it daily"
    ]
  },
  {
    key: "core-training-and-signoffs",
    sectionSlug: "staffing-operations-setup",
    title: "Complete room-based training and competency sign-offs",
    description:
      "Train the team on software, intake, room reset, contraindications, photography, safety, emergency response, and client communication in the actual rooms.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 145,
    phaseSlug: "compliance-and-staffing",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["training", "competency"],
    dependsOn: ["practice-management-stack", "device-service-and-training", "sop-library"],
    subtasks: [
      "Run booking, intake, charting, and checkout drills",
      "Complete laser safety and contraindication sign-offs",
      "Practice photo workflow and room reset standards",
      "Record competency sign-offs for each launch role"
    ]
  },
  {
    key: "daily-opening-closing-cleaning",
    sectionSlug: "staffing-operations-setup",
    title: "Assign opening, closing, cleaning, and inventory routines",
    description:
      "Assign ownership for alarm, lighting, room setup, cashout, chart completion, laundry, waste, charging, par levels, reorder points, and monthly counts.",
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
    title: "Install storefront, room, and menu signage",
    description:
      "Print and install the physical brand package for storefront signs, hours decals, room signs, treatment menus, and any in-clinic displays.",
    priority: Priority.MEDIUM,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 120,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.COLLABORATOR,
    tags: ["brand", "signage"],
    subtasks: [
      "Approve storefront sign and hours decal proofs",
      "Install room and wayfinding signage",
      "Print treatment menus and front-desk collateral",
      "Set any branded in-clinic screen or display content"
    ]
  },
  {
    key: "client-experience-details",
    sectionSlug: "marketing-client-experience-setup",
    title: "Finalize review, referral, and first-visit touchpoints",
    description:
      "Set the comfort details and post-visit touchpoints that staff will use during soft opening, including review requests, referral handoffs, and retail education.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.CAN_PHASE_IN,
    dueOffsetDays: 152,
    phaseSlug: "soft-opening",
    assigneeRole: Role.COLLABORATOR,
    tags: ["client-experience", "launch"],
    subtasks: [
      "Set beverage, robe, music, and restroom amenity standards",
      "Prepare review-request script and automated follow-up",
      "Print referral cards or set up referral code workflow",
      "Write retail talking points and aftercare handoff steps"
    ]
  },
  {
    key: "budget-tracker-ready",
    sectionSlug: "budget-framework",
    title: "Build opening budget tracker by priority tier",
    description:
      "Tag each budget line as must-have, can-phase-in, or optional-upgrade and track quotes, deposits, lead times, and contingency in one place.",
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 18,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["budget", "contingency"],
    subtasks: [
      "Label every line item by opening priority",
      "Capture current quote, deposit due date, and lead time",
      "Assign an owner for each committed spend item",
      "Set and review the TI and launch contingency target"
    ]
  },
  {
    key: "timeline-baseline",
    sectionSlug: "opening-timeline",
    title: "Baseline opening timeline and dependencies",
    description:
      "Set realistic phase dates, link dependencies, and avoid announcing a hard opening date before permitting, equipment, and staffing readiness are grounded.",
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 14,
    phaseSlug: "pre-lease-immediately-after-securing-space",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["timeline", "launch"],
    subtasks: [
      "Review the target dates for all ten opening phases",
      "Link major dependencies across permits, buildout, install, and staffing",
      "Flag long-lead items that can move the opening date",
      "Hold public launch-date announcements until critical blockers clear"
    ]
  },
  {
    key: "phase-1-must-have",
    sectionSlug: "phase-1-vs-phase-2-buildout",
    title: "Approve Phase 1 opening scope",
    description:
      "Lock the minimum opening scope for rooms, equipment, software, furniture, inventory, and compliance so spending stays aligned to launch needs.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 20,
    phaseSlug: "design-and-due-diligence",
    assigneeRole: Role.OWNER_ADMIN,
    tags: ["phase-1", "cash-protection"],
    subtasks: [
      "List the rooms and systems required for day-one operations",
      "Separate must-have equipment from can-phase-in items",
      "Use the approved scope to guide procurement and contractor decisions"
    ]
  },
  {
    key: "phase-1-future-proofing",
    sectionSlug: "phase-1-vs-phase-2-buildout",
    title: "Add Phase 2 rough-ins during Phase 1 buildout",
    description:
      "Use the open-wall phase to add the extra power, data, cabinetry backing, and room-readiness items that reduce future expansion cost.",
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
    title: "Record Phase 2 activation list",
    description:
      "Maintain a clean list of what activates after opening, including extra rooms, devices, upgraded decor, and additional staffing.",
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
    title: "Procure reception opening package",
    description:
      "Order the front desk, guest seating, side tables, shelving, branded signs, charging touches, and refreshment pieces for reception and waiting.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 110,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.COLLABORATOR,
    roomName: "Reception / Waiting",
    tags: ["procurement", "reception"],
    isRoomProcurement: true,
    subtasks: [
      "Order guest seating and side tables",
      "Order retail shelving and front-desk accessories",
      "Confirm charging, refreshment, and signage items"
    ]
  },
  {
    key: "procure-consultation-room",
    sectionSlug: "room-by-room-procurement-checklist",
    title: "Procure consultation-room package",
    description:
      "Order the consult table or desk, chairs, mirror, task lighting, secure storage, and photo or consent support items for the consult room.",
    priority: Priority.HIGH,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 112,
    phaseSlug: "finishes-and-fixture-install",
    assigneeRole: Role.COLLABORATOR,
    roomName: "Consultation Room",
    tags: ["procurement", "consult"],
    isRoomProcurement: true,
    subtasks: [
      "Order consult table or desk and guest seating",
      "Set up monitor or tablet support for treatment plans",
      "Order mirror, lighting, and consent or photo accessories"
    ]
  },
  {
    key: "procure-treatment-room",
    sectionSlug: "room-by-room-procurement-checklist",
    title: "Procure treatment-room package for each launch room",
    description:
      "Order the bed or chair, stool, cart, mirror, hamper, waste setup, eye protection, linens, and opening supply stock for each active treatment room.",
    priority: Priority.CRITICAL,
    openingPriority: OpeningPriority.MUST_HAVE_BEFORE_OPENING,
    dueOffsetDays: 118,
    phaseSlug: "equipment-it-software-setup",
    assigneeRole: Role.COLLABORATOR,
    roomName: "Treatment Room",
    tags: ["procurement", "treatment-room"],
    isRoomProcurement: true,
    subtasks: [
      "Order bed or chair, stool, and rolling cart for each room",
      "Set up hamper, waste, disinfectant, and eye-protection stations",
      "Stage linens and opening supply stock in every launch room"
    ]
  },
  {
    key: "procure-provider-workroom",
    sectionSlug: "room-by-room-procurement-checklist",
    title: "Procure provider workroom package",
    description:
      "Order shelving, locking storage, charging station, printer, label printer, stock bins, and SOP or binder storage for the provider workroom.",
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
    title: "Procure laundry and utility package",
    description:
      "Order the washer or dryer, hampers, shelving, detergent storage, folding surface, and any sink accessories needed in laundry and utility.",
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
    title: "Procure break nook package",
    description:
      "Order the mini fridge, microwave, shelving, seating surface, waste setup, and staff cubbies or lockers for the break nook.",
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
    title: "Procure restroom package",
    description:
      "Order the soap and hand-dry setup, paper storage, trash can, mirror, amenity basket, and cleaning-checklist holder for the restroom.",
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
    title: "Approve final room plan",
    description:
      "Approve the room plan with layout, device needs, storage, and privacy decisions locked before construction details move forward.",
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
    title: "Incorporate device requirements into drawings",
    description:
      "Confirm the drawings reflect final device power, plumbing, HVAC, and room-clearance requirements before permit submission and rough-in.",
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
    title: "Bind opening insurance coverage",
    description:
      "Make sure operating coverage is active in time for equipment install, occupancy, and opening exposures.",
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
    title: "Verify licensure and supervision for every launch service",
    description:
      "Confirm that every launch service has a documented licensure, supervision, and protocol path before opening.",
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
    title: "Complete policies, logs, forms, and consent packets",
    description:
      "Finish the working policy set, logs, forms, and consent packets before the first soft-opening appointments.",
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
    title: "Complete software configuration and testing",
    description:
      "Finish the scheduling, charting, payments, forms, reminders, and package setup and test the workflow before launch traffic starts.",
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
    title: "Install IT, phone, and security systems",
    description:
      "Make sure connectivity, phones, cameras, alarm, and access control are live before staff training and opening.",
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
    title: "Install front desk and treatment-room furniture",
    description:
      "Install the front desk and treatment-room furniture package in time for training, room setup, and final punch work.",
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
    title: "Install, test, and train on launch device",
    description:
      "Complete delivery, install, testing, documentation, and staff training for the launch device before live treatments begin.",
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
    title: "Receive, label, and stock opening inventory",
    description:
      "Get launch inventory into rooms, labeled, and ready so soft opening exposes process issues instead of missing supplies.",
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
    title: "Activate laundry, janitorial, and waste workflows",
    description:
      "Make sure laundry, janitorial, and waste processes are running in practice, not just purchased on paper, before clients arrive.",
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
    title: "Stock and verify client restroom",
    description:
      "Verify the restroom is accessible, stocked, and presentation-ready before launch.",
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
    title: "Finish retail pricing and merchandising",
    description:
      "Set shelf pricing, signage, testers, and display standards before the clinic opens to full public traffic.",
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
    title: "Test before-and-after photo workflow",
    description:
      "Validate the camera, lighting, backdrop, angles, consent support, and storage workflow before live patients arrive.",
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
    title: "Post and assign operating checklists",
    description:
      "Post the opening, closing, cleaning, and reset checklists where staff will use them and assign ownership for each one.",
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
    title: "Close soft-opening issues before public launch",
    description:
      "Use soft opening to surface supply gaps, scripting issues, reset problems, and software misses, then close them before public launch.",
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
    title: "Publish grand-opening offers and launch assets",
    description:
      "Finalize the public launch package, including offers, QR codes, signage, review prompts, and content-capture plan.",
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
    title: "Confirm 30-day working capital reserve",
    description:
      "Verify the clinic has enough cash reserve to carry payroll, rent, utilities, and marketing through the first month of ramp.",
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
    title: "Obtain final device electrical specs before permit release",
    description:
      "Collect final device power requirements early enough to avoid permit revisions, change orders, or unsafe temporary setups.",
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
    title: "Confirm storage plan before millwork is released",
    description:
      "Count clean supply, retail backstock, janitorial, and accessory storage before the design is released so overflow does not land in public areas.",
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
    title: "Verify acoustic privacy details before wall close-up",
    description:
      "Confirm insulation, door, and sweep details before wall close-up so consult and treatment conversations are not heard from public areas.",
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
    title: "Standardize before-and-after photo workflow",
    description:
      "Set one repeatable process for camera, lighting, backdrop, angles, naming, and consent so results are comparable and reusable.",
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
    title: "Check laundry capacity against opening schedule",
    description:
      "Estimate linen turns per day and confirm the washer, dryer, and storage plan can support the opening schedule without bottlenecks.",
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
    title: "Verify front-desk cable routing before install",
    description:
      "Confirm cable paths, outlet placement, and equipment storage before front-desk install so the check-in area stays clean after opening.",
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
    title: "Set launch contingency budget",
    description:
      "Carry a documented contingency for construction and launch surprises before signing major vendor commitments.",
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
    title: "Create device downtime response plan",
    description:
      "Document the service contacts, client communication steps, and reschedule workflow to use if the launch device goes down.",
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
    title: "Finish SOPs before staff drills begin",
    description:
      "Complete the written operating system before staff drills so the team is training to the actual standard instead of improvising.",
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
    title: "Test software and forms before soft opening",
    description:
      "Run end-to-end tests for booking, intake, charting, checkout, and follow-up before soft opening so broken workflows do not hit live clients.",
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
    title: "Release signage approvals before production window slips",
    description:
      "Get landlord, design, and permit approvals for signage early enough to avoid a late storefront install or redesign.",
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
    title: "Review working capital against first-30-day burn",
    description:
      "Check cash on hand against expected first-30-day payroll, rent, utilities, and marketing spend before public launch.",
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
    title: "Confirm Lakeland use approval and local business tax requirements",
    description:
      "Verify allowed use, zoning compatibility, and local business tax expectations with the City of Lakeland before relying on site-plan assumptions.",
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
    title: "Confirm Lakeland permit, inspection, and occupancy sequence",
    description:
      "Verify the local building-authority pathway, inspection sequence, and final approval requirements with the contractor and design team.",
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
    title: "Confirm Florida laser licensure and supervision requirements",
    description:
      "Verify the current Florida licensure, supervision, and protocol requirements directly with the appropriate state resources for the launch service model.",
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
    title: "Confirm biomedical waste requirements if sharps or regulated waste apply",
    description:
      "If launch services generate sharps or biomedical waste, verify the Florida and county handling, storage, and pickup requirements before opening.",
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
