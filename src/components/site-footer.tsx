import { Link, useRouterState } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";

export function SiteFooter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-24 border-t bg-sand/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Globe2 className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-semibold">Lingua Terra</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Learn the language <em>and</em> the lifestyle of any country — before you go, or just because you love it.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/countries" className="hover:text-foreground">Countries</Link></li>
            <li><Link to="/courses" className="hover:text-foreground">Courses</Link></li>
            <li><Link to="/events" className="hover:text-foreground">Events</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/faqs" className="hover:text-foreground">FAQs</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Lingua Terra. A global culture & language learning platform.
        </div>
      </div>
    </footer>
  );
}
