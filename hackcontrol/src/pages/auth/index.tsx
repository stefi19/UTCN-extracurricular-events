import { useState } from "react";
import Head from "next/head";
import { getProviders, signIn } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";

import { Button } from "@/ui";
import { Github } from "@/ui/icons";
import { toast } from "sonner";
import Up from "@/animations/up";

type AuthProps = {
  providers: Record<string, ClientSafeProvider> | null;
};

const Auth = ({ providers }: AuthProps) => {
  const [loading, setLoading] = useState(false);
  const hasGithub = Boolean(providers?.github);
  const utcnUrl = process.env.NEXT_PUBLIC_UTCN_APP_URL ?? "http://localhost:8080/login";

  const handleLogin = async (provider: string) => {
    setLoading(true);
    try {
      await signIn(provider, {
        callbackUrl: `/app`,
      });
    } catch (error) {
      toast.error("Unable to log in. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Auth - Project Hackathon</title>
      </Head>
      <div className="flex h-screen flex-col items-center justify-center">
        <Up>
          <h1 className="mb-4 text-2xl font-medium">
            {loading ? "Logging in..." : "Sign in to continue"}
          </h1>
        </Up>
        <Up delay={0.2}>
          {hasGithub ? (
            <Button
              icon={<Github width={20} />}
              onClick={() => handleLogin("github")}
              loadingstatus={loading}
            >
              <span>Continue with GitHub</span>
            </Button>
          ) : (
            <div className="max-w-md rounded-md border border-white/10 bg-[#181820] p-5 text-center">
              <p className="mb-4 text-[#8888a0]">
                GitHub OAuth is not configured for this environment. Use the
                UTCN login, or set GitHub OAuth credentials and restart the
                Hackcontrol service.
              </p>
              <a
                href={utcnUrl}
                className="inline-flex rounded-md border border-[#c8102e] bg-[#c8102e] px-4 py-2 font-semibold text-white transition hover:border-[#e8203e] hover:bg-[#e8203e]"
              >
                Sign in with UTCN
              </a>
            </div>
          )}
        </Up>
      </div>
    </>
  );
};

export async function getServerSideProps() {
  return {
    props: {
      providers: await getProviders(),
    },
  };
}

export default Auth;
