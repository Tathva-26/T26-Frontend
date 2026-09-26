import Image from "next/image";

export default function Workshops({ workshop }) {
  return (
    <main className="relative isolate min-h-dvh overflow-auto bg-[#171326] text-white">
      <div aria-hidden className="fixed inset-0 -z-20 bg-[linear-gradient(rgba(28,29,59,.3),rgba(60,40,86,.3)),url('/images/workshops/background.png')] bg-cover bg-center" />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(28,29,59,.08),rgba(60,40,86,.28))]" />

      <section className="relative mx-auto mt-[47px] mb-2.5 w-[min(calc(100%_-_56px),542px)] rounded-[13px] border border-white/[0.13] bg-[#1d1937]/[0.20] px-6 pt-6 pb-5 shadow-[0_18px_50px_rgba(7,5,19,.24)] backdrop-blur-[16px] max-[560px]:mt-5 max-[560px]:mb-0 max-[560px]:min-h-[973px] max-[560px]:w-[calc(100%_-_26px)] max-[560px]:rounded-[35px] max-[560px]:border-white/20 max-[560px]:bg-[#120e20]/30 max-[560px]:p-0 max-[560px]:shadow-none max-[560px]:backdrop-blur-[10px]" id="top" aria-labelledby="workshops-title">
        <h1 id="workshops-title" className="mb-[-1em] ml-[253px] font-['Jaro'] text-[clamp(38px,8.08vw,52px)] leading-none tracking-[-.03em] [font-variation-settings:'opsz'_6] max-[560px]:absolute max-[560px]:top-[362px] max-[560px]:left-[39px] max-[560px]:m-0 max-[560px]:text-[61.6px] max-[560px]:leading-none">
          {workshop.title}
        </h1>
        <div className="grid grid-cols-[216px_minmax(0,187px)] items-start gap-x-[60px] max-[560px]:block">
          <article className="relative pb-[50px] max-[560px]:absolute max-[560px]:top-[41px] max-[560px]:left-[41px] max-[560px]:w-[305px] max-[560px]:p-0">
            <div className="size-[216px] overflow-hidden rounded-[7px] border border-[#737373] max-[560px]:size-[305px] max-[560px]:rounded-[10.5px] max-[560px]:border-[1.5px]">
              <Image className="h-[270px] w-full object-cover object-top max-[560px]:h-[381px]" src={workshop.image} width={305} height={381} alt={workshop.imageAlt} priority />
            </div>
            <div className="grid gap-0 px-1 pt-1 max-[560px]:absolute max-[560px]:top-[414px] max-[560px]:left-[7px] max-[560px]:p-0">
              <span className="font-['Jaro'] text-[30px] leading-none [font-variation-settings:'opsz'_6] max-[560px]:text-[41.8px]"><span className="mr-[3px] font-['Roboto_Slab'] text-[28px] max-[560px]:text-[41.8px]">₹</span>{workshop.price}</span>
              <span className="font-['Mona_Sans'] text-[18px] font-bold [font-variation-settings:'wdth'_100] max-[560px]:text-[25.85px]">{workshop.date}</span>
            </div>
            <a className="absolute right-[6px] bottom-[51px] grid h-[27px] w-24 place-items-center rounded-[7px] bg-[rgba(0,116,122,.75)] font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-white no-underline max-[560px]:top-[444px] max-[560px]:right-[3px] max-[560px]:bottom-auto max-[560px]:h-[37px] max-[560px]:w-[133px] max-[560px]:rounded-[10px] max-[560px]:text-[18px]" href="#workshop-details">LEARN MORE</a>
            <a className="absolute bottom-0 left-0 grid h-[27px] w-[216px] place-items-center rounded-[7px] bg-[rgba(78,40,74,.72)] font-['Plus_Jakarta_Sans'] text-[18px] font-bold tracking-[2.9px] text-white no-underline max-[560px]:top-[515px] max-[560px]:left-[2px] max-[560px]:bottom-auto max-[560px]:h-[37px] max-[560px]:w-[300px] max-[560px]:rounded-[10px] max-[560px]:text-[25px] max-[560px]:tracking-[4px]" href={workshop.registrationUrl}>REGISTER</a>
          </article>
          <aside className="pt-[105px] max-[560px]:absolute max-[560px]:top-[630px] max-[560px]:left-[33px] max-[560px]:w-[321px] max-[560px]:p-0 max-[560px]:text-center" id="workshop-details">
            <div>
              <h2 className="m-0 font-['Plus_Jakarta_Sans'] text-[15px] font-semibold leading-[1.2] max-[560px]:text-[27px]">About the workshop</h2>
              <p className="mt-[9px] font-['Plus_Jakarta_Sans'] text-[8.5px] font-medium leading-[1.25] text-[#b6b4c0] max-[560px]:mt-[48px] max-[560px]:text-[15px] max-[560px]:leading-[1.25]">{workshop.details}</p>
            </div>
            <div className="mt-[46px] max-[560px]:mt-[23px]">
              <h2 className="m-0 font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase max-[560px]:text-[19px]">Contacts :</h2>
              <div className="mt-2.5 flex items-start gap-[30px] max-[560px]:mt-[20px] max-[560px]:justify-between max-[560px]:gap-0 max-[560px]:px-[18px] max-[560px]:text-left">
                {workshop.contacts.map((contact) => (
                  <address className="grid font-['Plus_Jakarta_Sans'] text-[10px] not-italic leading-[1.35] uppercase max-[560px]:text-[16px]" key={`${contact.name}-${contact.phone}`}>
                    <strong className="text-[9px] font-medium max-[560px]:text-[16px]">{contact.name}</strong>
                    <a className="text-inherit no-underline" href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </address>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
