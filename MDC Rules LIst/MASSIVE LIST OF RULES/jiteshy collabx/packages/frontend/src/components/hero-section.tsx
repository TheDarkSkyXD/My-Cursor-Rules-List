export function HeroSection() {
  return (
    <div className="text-center md:text-left lg:pl-2 lg:pt-5">
      <h1 className="text-3xl text-white mb-3 lg:mb-4">
        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
          No-Nonsense
        </span>{' '}
        <span className="text-zinc-300">
          Text <br />
          Collaboration
        </span>
      </h1>
      <p className="text-zinc-400 text-base lg:text-lg leading-relaxed">
        Edit code, notes or any text together in real-time.
      </p>
      <p className="text-zinc-400 text-base lg:text-lg leading-relaxed">
        <span className="text-zinc-200 font-bold1">NO sign-up</span>, just share the link and start{' '}
        <br />
        collaborating.
      </p>
    </div>
  );
}
