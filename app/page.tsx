import Link from "next/link";

export default function HomePage() {
  return (
    <main className="session">
      <header className="session__header">
        <span className="session__mark">Handful</span>
        <h1 className="session__title">Recipes</h1>
      </header>

      <p className="empty">
        No recipes here yet. Tap <strong>New</strong>, prop the screen on the counter, and catch the first one while mom cooks.
      </p>

      <Link href="/new" className="button button--link">
        New
      </Link>
    </main>
  );
}
