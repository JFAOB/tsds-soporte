import type { Metadata } from "next";
import IndicadoresClient from "./indicadores-client";

export const metadata: Metadata = {
  title: "Indicadores Técnicos | TSDS",
  description: "Generador de fichas individuales de desempeño de técnicos TSDS.",
};

export default function IndicadoresPage() {
  return <IndicadoresClient />;
}
