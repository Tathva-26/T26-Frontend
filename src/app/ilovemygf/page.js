import fs from "fs";
import path from "path";
import Credits from "@/pageComponents/Credits";
import { teams as defaultTeams, PLACEHOLDER } from "@/lib/creditsData";

export const dynamic = "force-dynamic";

/**
 * Checks public/images/credits for each member's photo:
 * - Checks for {first_name_in_lowercase}.{jpg|jpeg|png|webp|avif|svg}
 * - If found, uses that image path
 * - If NOT found, automatically puts the placeholder (/images/credits/placeholder.png)
 */
function getResolvedTeams() {
  const creditsDir = path.join(process.cwd(), "public/images/credits");
  const extensions = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"];

  return defaultTeams.map((team) => ({
    ...team,
    members: team.members.map((member) => {
      // 1. If explicit custom image is specified and actually exists on disk
      if (member.image && member.image !== PLACEHOLDER) {
        const basename = path.basename(member.image);
        if (fs.existsSync(path.join(creditsDir, basename))) {
          return { ...member, image: `/images/credits/${basename}` };
        }
      }

      // 2. Check for {firstname}.{any extension}
      const firstName = member.name.trim().split(" ")[0].toLowerCase();
      for (const ext of extensions) {
        const candidate = `${firstName}${ext}`;
        if (fs.existsSync(path.join(creditsDir, candidate))) {
          return { ...member, image: `/images/credits/${candidate}` };
        }
      }

      // 3. Check for sanitized full name (e.g. arjundas.jpg)
      const cleanFullName = member.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const ext of extensions) {
        const candidate = `${cleanFullName}${ext}`;
        if (fs.existsSync(path.join(creditsDir, candidate))) {
          return { ...member, image: `/images/credits/${candidate}` };
        }
      }

      // 4. If image does not exist, put the placeholder directly
      return {
        ...member,
        image: PLACEHOLDER,
      };
    }),
  }));
}

export default function Ilovemygf() {
  const teams = getResolvedTeams();
  return <Credits teams={teams} />;
}