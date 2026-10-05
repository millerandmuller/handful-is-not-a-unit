import { redirect } from "next/navigation";

// For now the app starts in the session. The recipe list takes this place
// once naming and the recipe card exist.
export default function HomePage() {
  redirect("/session");
}
