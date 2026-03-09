import { PageHeader } from "@/components/layout/page-header";
import { PhaseTimeline } from "@/components/timeline/phase-timeline";
import { getTimelineData } from "@/server/timeline";

export default async function TimelinePage() {
  const phases = await getTimelineData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timeline"
        description="The timeline follows the guide’s 10 opening phases from secured space through grand opening and the first 30 days."
      />
      <PhaseTimeline phases={phases as never} />
    </div>
  );
}
