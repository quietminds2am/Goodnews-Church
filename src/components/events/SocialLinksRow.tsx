import { Link as LinkIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { SocialLink } from "../../types/database";
import { InstagramIcon, FacebookIcon, YoutubeIcon, TiktokIcon, XIcon, WhatsappIcon } from "../icons/SocialIcons";

const ICONS: Record<SocialLink["platform"], ComponentType<SVGProps<SVGSVGElement>>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
  x: XIcon,
  whatsapp: WhatsappIcon,
  other: LinkIcon,
};

export function SocialLinksRow({ links }: { links: SocialLink[] }) {
  if (!links || links.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((link, i) => {
        const Icon = ICONS[link.platform] ?? LinkIcon;
        return (
          <li key={i}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 hover:border-brand-500 hover:text-brand-600"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {link.label ?? link.platform}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
