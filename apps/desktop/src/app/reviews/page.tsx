import { ContentLayout } from "@/components/layout/ContentLayout";
import { Testimonials } from "@/components/sections/Testimonials";

export const metadata = {
  title: "Reviews — Action",
  description: "What our clients say about working with us.",
};

export default function ReviewsPage() {
  return (
    <ContentLayout>
      <Testimonials />
    </ContentLayout>
  );
}
