import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center text-stone-800">
      <h1 className="font-serif text-6xl text-stone-900 mb-2 font-light">404</h1>
      <h2 className="font-serif text-2xl text-stone-700 mb-4">Page Not Found</h2>
      <p className="font-serif italic text-stone-500 max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="bg-[#1e2321] text-white px-6 py-2.5 rounded text-xs uppercase tracking-widest font-sans font-semibold hover:bg-stone-800 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
