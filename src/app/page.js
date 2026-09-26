import Lead from "@/pageComponents/Lead";
import Frontend from "@/pageComponents/Frontend";
import Backend from "@/pageComponents/Backend";
import UIUX from "@/pageComponents/UIUX";

export default function Home() {
  return (
    <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden">
      <Lead />
      <Frontend />
      <Backend />
      <UIUX />
    </div>
  );
}
