export interface NavItem {
  label: string;
  labelEs?: string;
  href: string;
}

export const navigation: NavItem[] = [
  { label: "Home",    labelEs: "Inicio",   href: "/" },
  { label: "Work",    labelEs: "Trabajo",  href: "/#projects" },
  { label: "Reviews", labelEs: "Reseñas",  href: "/#reviews" },
  { label: "Contact", labelEs: "Contacto", href: "/#contact" },
];
