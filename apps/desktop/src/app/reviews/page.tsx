import { redirect } from "next/navigation";

// La sección de reseñas de la home fue sustituida por la plaza 3D.
export default function ReviewsPage() {
  redirect("/resenas");
}
