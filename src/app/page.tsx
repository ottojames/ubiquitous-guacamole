export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-bold mb-4">Public Notices Portal</h1>
        <p className="mb-6">Create a premises notice and pay securely.</p>
        <a
          href="/notices/new"
          className="inline-block rounded-xl bg-black text-white px-5 py-3"
        >
          Create a premises notice →
        </a>
      </div>
    </main>
  );
}