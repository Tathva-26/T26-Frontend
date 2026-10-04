import { TeamSection } from "@/pageComponents/TeamSection";

const leads = [
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
];

const frontends = [
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
];

const backends = [
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
];

const uiux = [
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "NAME SURNAME", image: null, linkedin: "https://linkedin.com", github: "https://github.com" },
];

export default function Ilovemygf() {
  return (
    <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden">
      <TeamSection title="LEAD" members={leads} sectionId="lead" />
      <TeamSection title="FRONTEND" members={frontends} titleSize="text-[13vw]" sectionId="frontend" />
      <TeamSection title="BACKEND" members={backends} titleSize="text-[13vw]" sectionId="backend" />
      <TeamSection title="UI/UX" members={uiux} sectionId="uiux" />
    </div>
  );
}