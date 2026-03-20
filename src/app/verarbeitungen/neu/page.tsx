"use client";

import PageHeader from "@/components/PageHeader";
import ProcessForm from "../ProcessForm";

export default function NeueVerarbeitungPage() {
  return (
    <div>
      <PageHeader
        title="Neue Verarbeitung erstellen"
        description="Erstellen Sie einen neuen Eintrag im Verarbeitungsverzeichnis"
      />
      <ProcessForm />
    </div>
  );
}
