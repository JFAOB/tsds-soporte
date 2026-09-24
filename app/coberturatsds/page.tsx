import type { Metadata } from "next";
import CoberturaClient from "./cobertura-client";

export const metadata: Metadata = {
  title: "Cobertura TSDS",
  description: "Consulta interactiva de cobertura y atención técnica TSDS.",
};

export default function CoberturaTsdsPage() {
  return <CoberturaClient />;
}
