export interface NavItem {
  label: string;
  href: string;
}

export const navigation: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "#projects" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Map", href: "#map" },
  { label: "Contact", href: "/contact" },
];
