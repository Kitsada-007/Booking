import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex h-[70vh] min-h-[480px] items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&q=80"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex flex-col items-center px-4 text-center text-white">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Seaside Resort
          </h1>
          <p className="mt-4 max-w-md text-base text-white/85 sm:text-lg">
            Relax by the ocean. Stay in comfort. Explore the islands.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/room-types"
              className="rounded bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              Browse Rooms
            </Link>
            <Link
              href="/boats"
              className="rounded border border-white/40 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Boat Tours
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-16 sm:grid-cols-2 lg:gap-8 lg:py-24">
        <Card
          image="https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=600&q=80"
          imageAlt="Beachfront room with ocean view"
          title="Beachfront Rooms"
          description="Choose from our selection of comfortable rooms steps from the sand. Air conditioning, hot water, and ocean views included."
          href="/room-types"
          label="View rooms"
        />
        <Card
          image="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80"
          imageAlt="Boat tour on crystal clear water"
          title="Boat Excursions"
          description="Explore nearby islands with our guided boat tours. Half-day and full-day trips available for groups of all sizes."
          href="/boats"
          label="View tours"
        />
      </section>

      <section className="bg-zinc-50 px-4 py-16 text-center lg:py-24">
        <h2 className="text-2xl font-bold">Ready to book?</h2>
        <p className="mt-2 text-zinc-500">
          Create an account or sign in to start your reservation.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}

function Card({
  image,
  imageAlt,
  title,
  description,
  href,
  label,
}: {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded border border-zinc-200 bg-white transition hover:border-zinc-400 hover:shadow-sm"
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-6 lg:p-8">
        <h3 className="text-lg font-semibold group-hover:text-zinc-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
        <span className="mt-4 inline-block text-sm font-medium text-zinc-800 group-hover:text-zinc-900">
          {label} &rarr;
        </span>
      </div>
    </Link>
  );
}
