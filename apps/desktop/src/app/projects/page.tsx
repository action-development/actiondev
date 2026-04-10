import { ContentLayout } from "@/components/layout/ContentLayout";
import { Projects } from "@/components/sections/Projects";

export const metadata = {
  title: "Work — Action",
  description: "Selected projects from our digital agency.",
};

export default function ProjectsPage() {
  return (
    <ContentLayout>
      <Projects />
    </ContentLayout>
  );
}
