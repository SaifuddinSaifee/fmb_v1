"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

type NavFooterProps = {
  homePath: string;
};

export function NavFooter({ homePath }: NavFooterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === homePath;

  return (
    <footer className="grid shrink-0 grid-cols-2 gap-2 border-t bg-background px-3 py-3 sm:px-4">
      <div className="min-w-0">
        {!isHome ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-9 w-full gap-1.5"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back
          </Button>
        ) : (
          <div className="h-9" aria-hidden />
        )}
      </div>
      <div className="min-w-0">
        <Button variant="outline" size="sm" asChild className="h-9 w-full gap-1.5">
          <Link href={homePath}>
            <Home className="h-4 w-4 shrink-0" />
            Home
          </Link>
        </Button>
      </div>
    </footer>
  );
}
