import { signOut } from "next-auth/react";
import Image from "next/image";

import Up from "@/animations/up";
import { Button, Link } from "@/ui";
import { toast } from "sonner";
import { useUnifiedSession } from "@/hooks/use-unified-session";

const Header = () => {
  const { data: session } = useUnifiedSession();
  const utcnUrl = process.env.NEXT_PUBLIC_UTCN_APP_URL ?? "http://localhost:8080";

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/",
      });
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <header className="fixed top-0 z-50 block w-full border-b border-white/10 bg-[#0a0a0c]/90 px-5 py-3 font-medium text-[#f0f0f5] backdrop-blur">
      <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-4">
        <Link href="/" underline={false}>
          <div className="flex items-center space-x-3 transition-all duration-100 hover:text-white">
            <Image
              src="/images/phck.svg"
              width={34}
              height={34}
              alt="UTCN Hackathons"
            />
            <div className="hidden md:block">
              <p className="font-display text-[1.05rem] font-bold leading-tight">UTCN Events</p>
              <p className="text-xs text-[#8888a0]">Hackathons</p>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={utcnUrl}
            className="rounded-full border border-transparent px-3 py-1.5 text-sm text-[#8888a0] transition hover:border-white/10 hover:bg-[#1e1e28] hover:text-[#f0f0f5]"
          >
            Events
          </a>
          <Link
            href="/"
            underline={false}
            className="rounded-full border border-transparent px-3 py-1.5 text-sm text-[#8888a0] transition hover:border-white/10 hover:bg-[#1e1e28] hover:text-[#f0f0f5]"
          >
            Hackathons
          </Link>
          {session && (
          <div className="flex items-center space-x-3 pl-1">
            <Up>
              <div className="flex items-center space-x-3">
                {session.user.role === "ADMIN" && (
                  <span className="rounded-full border border-[#c8102e]/50 bg-[#c8102e]/20 px-2 py-1 text-xs font-medium text-white">
                    ADMIN
                  </span>
                )}
                <Image
                  src={session.user.image}
                  width={24}
                  height={24}
                  className="rounded-full"
                  alt={session.user.name}
                />
                <p className="hidden md:block">{session.user.name}</p>
              </div>
            </Up>
            <Up delay={0.2}>
              <div className="flex items-center space-x-3">
                <span className="text-gray-400">|</span>
                <Button onClick={handleLogout}>Sign out</Button>
              </div>
            </Up>
          </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
