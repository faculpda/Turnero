export type ThemeStylePreset = {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
};

export const themeOneStyles: ThemeStylePreset[] = [
  {
    id: "tema1_claro",
    name: "Claro profesional",
    description: "Limpio, sereno y muy versatil para casi cualquier negocio.",
    primaryColor: "#205fc0",
    secondaryColor: "#eef4ff",
  },
  {
    id: "tema1_rosa",
    name: "Rosa suave",
    description: "Calido y delicado, ideal para una presencia mas femenina.",
    primaryColor: "#b55f8d",
    secondaryColor: "#fbf1f6",
  },
  {
    id: "tema1_grafito",
    name: "Grafito empresarial",
    description: "Sobrio, elegante y corporativo, con contraste mas serio.",
    primaryColor: "#475569",
    secondaryColor: "#f2f5f8",
  },
  {
    id: "tema1_verde",
    name: "Verde calma",
    description: "Suave y confiable, muy util para salud, bienestar o servicios cercanos.",
    primaryColor: "#4a8c74",
    secondaryColor: "#edf7f2",
  },
  {
    id: "tema1_indigo",
    name: "Indigo premium",
    description: "Mas oscuro y refinado, para una imagen moderna y segura.",
    primaryColor: "#4f46b5",
    secondaryColor: "#f0efff",
  },
  {
    id: "tema1_terracota",
    name: "Terracota suave",
    description: "Humano, cercano y con un tono mas calido sin verse agresivo.",
    primaryColor: "#b46a58",
    secondaryColor: "#fbf2ee",
  },
];

export function findThemeOneStyle(primaryColor: string, secondaryColor: string) {
  return (
    themeOneStyles.find(
      (style) =>
        style.primaryColor.toLowerCase() === primaryColor.toLowerCase() &&
        style.secondaryColor.toLowerCase() === secondaryColor.toLowerCase(),
    ) ?? null
  );
}
