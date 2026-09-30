'use client'

import { useRouter } from "next/navigation";
import { Frame } from "@/pageComponents/W1/Frame";

export default function W1Page() {
  const router = useRouter();
  return <Frame isActive={true} onScrollUp={() => router.push('/')} />;
}
