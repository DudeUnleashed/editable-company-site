import { useEffect } from "react";
import { useContent } from "../hooks/useContent";

function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

function darkenHex(hex: string, amount = 30): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export default function DocumentHead() {
  const { content } = useContent("settings");

  useEffect(() => {
    if (content.tab_title) document.title = content.tab_title;

    if (content.tab_description) {
      document.querySelector('meta[name="description"]')?.setAttribute("content", content.tab_description);
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", content.tab_description);
    }
    if (content.tab_title) {
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", content.tab_title);
    }
  }, [content.tab_title, content.tab_description]);

  useEffect(() => {
    if (!content.business_name && !content.contact_phone && !content.contact_email && !content.contact_address) return;

    const script = document.getElementById("business-jsonld") as HTMLScriptElement | null;
    if (!script) return;

    try {
      const data = JSON.parse(script.textContent || "{}");
      if (content.business_name) data.name = content.business_name;
      if (content.tab_description) data.description = content.tab_description;
      if (content.contact_phone) data.telephone = content.contact_phone;
      if (content.contact_email) data.email = content.contact_email;
      if (content.contact_address) data.address = content.contact_address;
      script.textContent = JSON.stringify(data);
    } catch {
      // malformed JSON-LD in index.html — leave it untouched rather than break the page
    }
  }, [content.business_name, content.tab_description, content.contact_phone, content.contact_email, content.contact_address]);

  useEffect(() => {
    if (content.favicon) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = content.favicon;
    }
  }, [content.favicon]);

  useEffect(() => {
    const root = document.documentElement;

    if (content.color_accent) {
      root.style.setProperty("--primary", content.color_accent);
      root.style.setProperty("--primary-hover", darkenHex(content.color_accent));
      const rgb = hexToRgb(content.color_accent);
      if (rgb) root.style.setProperty("--hero-overlay", `rgba(${rgb}, 0.55)`);
    }

    if (content.color_hero) {
      const rgb = hexToRgb(content.color_hero);
      if (rgb) root.style.setProperty("--hero-overlay", `rgba(${rgb}, 0.55)`);
    }

    if (content.color_footer) {
      root.style.setProperty("--footer-bg", content.color_footer);
    }
  }, [content.color_accent, content.color_hero, content.color_footer]);

  return null;
}
