import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { PageHeader } from "@/components/gia/kit";

export const Route = createFileRoute("/app/$section")({ component: Section });

function Section() {
  const { section } = Route.useParams();
  const title = section.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <>
      <PageHeader title={title} />
      <div className="rounded-xl border border-dashed bg-card py-20 text-center">
        <Construction className="mx-auto h-10 w-10 text-gold" />
        <p className="mt-3 font-semibold text-primary">{title} is coming in the next phase</p>
        <p className="mt-1 text-sm text-muted-foreground">This screen will be connected when the backend is added.</p>
      </div>
    </>
  );
}
