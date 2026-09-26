import Workshops from "@/pageComponents/Workshops";
import { getFeaturedWorkshop } from "@/lib/workshops";

export default async function Home() {
  const workshop = await getFeaturedWorkshop();

  return <Workshops workshop={workshop} />;
}
