"use client";

import { use } from "react";
import PageHeader from "@/components/PageHeader";
import ProcessForm from "../ProcessForm";

export default function VerarbeitungBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <PageHeader
        title="Verarbeitung bearbeiten"
        description="Bearbeiten Sie den Eintrag im Verarbeitungsverzeichnis"
      />
      <ProcessForm processId={id} />
    </div>
  );
}
