interface NavItem {
  label: string;
  labelEs?: string;
  href: string;
}

export const navigation: NavItem[] = [
  { label: "Home",    labelEs: "Inicio",   href: "/" },
  { label: "Work",    labelEs: "Trabajo",  href: "/projects" },
  { label: "Reviews", labelEs: "Reseñas",  href: "/resenas" },
  { label: "Contact", labelEs: "Contacto", href: "/contact" },
];
