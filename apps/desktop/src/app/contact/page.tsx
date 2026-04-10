import { ContentLayout } from "@/components/layout/ContentLayout";
import { Contact } from "@/components/sections/Contact";

export const metadata = {
  title: "Contact — Action",
  description: "Get in touch with our team.",
};

export default function ContactPage() {
  return (
    <ContentLayout>
      <Contact />
    </ContentLayout>
  );
}
