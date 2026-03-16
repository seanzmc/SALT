import {
  ClipboardList,
  DollarSign,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Milestone
} from "lucide-react";

export const appNavigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    href: "/checklists",
    label: "Checklist",
    icon: ClipboardList
  },
  {
    href: "/timeline",
    label: "Timeline",
    icon: Milestone
  },
  {
    href: "/budget",
    label: "Budget",
    icon: DollarSign
  },
  {
    href: "/documents",
    label: "Documents",
    icon: FileText
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageSquare
  }
];
