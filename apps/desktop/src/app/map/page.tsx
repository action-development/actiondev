import { ContentLayout } from "@/components/layout/ContentLayout";
import { Map } from "@/components/sections/Map";

export const metadata = {
  title: "Location — Action",
  description: "Find us in Madrid, Spain.",
};

export default function MapPage() {
  return (
    <ContentLayout>
      <Map />
    </ContentLayout>
  );
}
