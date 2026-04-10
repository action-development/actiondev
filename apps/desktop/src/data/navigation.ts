export interface NavItem {
  label: string;
  href: string;
}

export const navigation: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/projects" },
  { label: "Reviews", href: "/reviews" },
  { label: "Map", href: "/map" },
  { label: "Contact", href: "/contact" },
];
