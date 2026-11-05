import type { Metadata } from "next";
import AgendaClient from "./agenda-client";

export const metadata: Metadata = {
  title: "Agenda TSDS",
  description: "Generador de backlog y agenda diaria por región y técnico.",
};

export default function AgendaPage() {
  return <AgendaClient />;
}
