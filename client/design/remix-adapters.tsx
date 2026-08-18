/** @jsxImportSource remix/ui */
/**
 * remix/ui adapters for design components — client-only.
 */

import {
  defineRemixAdapter,
  type RemixSandboxAdapter,
  type SandboxInspectorDraft,
} from "@glassbox-studio/sandbox-engine";
import {
  buttonClassName,
  slotsFromPlainText as blogHeroSlotsFromText,
  type DesignComponentId,
} from "@glassbox-studio/components";
import { MoonIcon } from "@glassbox-studio/ui-icons/24/outline/moon";
import { BlogHero } from "./components/blog-hero.tsx";
import { Button } from "./components/button.tsx";
import { Container } from "./components/container.tsx";
import { Flex } from "./components/flex.tsx";
import { Footer } from "./components/footer.tsx";
import { Grid } from "./components/grid.tsx";
import { Header } from "./components/header.tsx";
import { Section } from "./components/section.tsx";
import {
  inspectComponentAttrs,
  inspectSlotAttrs,
} from "./inspect-attrs.ts";

function textNode(text: string) {
  return <span>{text}</span>;
}

function slotFromHtml(html: string | undefined) {
  if (!html) return undefined;
  const plain = html.replace(/<[^>]+>/g, "").trim();
  return plain ? textNode(plain) : undefined;
}

function buttonClassForVariant(variant: string): string {
  return buttonClassName(
    variant === "secondary" || variant === "ghost" ? variant : "primary",
  );
}

function parseNavSpec(spec: string): Array<{ label: string; href: string }> {
  return spec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [label, href] = part.split("|").map((s) => s.trim());
      return { label: label || "Link", href: href || "#" };
    });
}

function SiteLogoPreview(props: { label: string; className?: string }) {
  const mark = props.label.slice(0, 1);
  return (
    <a
      href="/"
      class={
        props.className ??
        "inline-flex items-center gap-3 font-display text-xl font-semibold tracking-tight text-ink no-underline md:text-2xl"
      }
      {...inspectComponentAttrs({ componentId: "site-logo" })}
    >
      <span
        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm text-inverse-fg"
        {...inspectSlotAttrs({ componentId: "site-logo", slot: "mark" })}
      >
        {mark}
      </span>
      <span
        {...inspectSlotAttrs({ componentId: "site-logo", slot: "wordmark" })}
      >
        {props.label}
      </span>
    </a>
  );
}

function NavLinksPreview(spec: string) {
  const items = parseNavSpec(spec);
  return (
    <>
      {items.map((item) => (
        <a
          href={item.href}
          class="rounded-md px-2 py-1 text-sm font-medium text-ink-soft hover:text-ink max-md:block max-md:px-3 max-md:py-3 max-md:text-base"
          {...inspectComponentAttrs({ componentId: "nav-link" })}
        >
          <span
            {...inspectSlotAttrs({ componentId: "nav-link", slot: "label" })}
          >
            {item.label}
          </span>
        </a>
      ))}
    </>
  );
}

function ThemeTogglePreview() {
  return (
    <button
      type="button"
      data-as-theme-toggle
      class="inline-flex size-9 items-center justify-center rounded-full border border-line bg-paper-raised text-ink hover:bg-sand"
      aria-label="Toggle color mode"
      title="Toggle light / dark"
    >
      {MoonIcon({ class: "size-4" })}
    </button>
  );
}

function FooterColumnPreview(props: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div class="flex flex-col gap-3">
      <div class="text-xs font-semibold uppercase tracking-wider text-ink-soft">
        {props.title}
      </div>
      <ul class="flex flex-col gap-2">
        {props.links.map((link) => (
          <li>
            <a
              href={link.href}
              class="rounded-md px-2 py-1 text-sm font-medium text-ink-soft hover:text-ink"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function parseFooterColumns(spec: string) {
  return spec
    .split("||")
    .map((group) => group.trim())
    .filter(Boolean)
    .map((group) => {
      const parts = group.split("|").map((s) => s.trim());
      const title = parts[0] || "Links";
      const links: Array<{ label: string; href: string }> = [];
      for (let i = 1; i + 1 < parts.length; i += 2) {
        links.push({ label: parts[i]!, href: parts[i + 1]! });
      }
      return { title, links };
    });
}

export const remixAdapters: Partial<
  Record<DesignComponentId, RemixSandboxAdapter>
> = {
  section: defineRemixAdapter({
    Component: Section as never,
    mapDraftToProps: (draft: SandboxInspectorDraft) => ({
      background: draft.props.background ?? "transparent",
      padding: draft.props.padding ?? "lg",
      gap: draft.props.gap ?? "none",
      children: (
        <p class="px-6 text-sm text-ink-soft">
          {draft.children || "Section content"}
        </p>
      ),
    }),
  }),
  container: defineRemixAdapter({
    Component: Container as never,
    mapDraftToProps: (draft: SandboxInspectorDraft) => ({
      width: draft.props.width ?? "xl",
      align: draft.props.align ?? "center",
      children: (
        <p class="text-sm text-ink-soft">
          {draft.children || "Container content"}
        </p>
      ),
    }),
  }),
  flex: defineRemixAdapter({
    Component: Flex as never,
    mapDraftToProps: (draft: SandboxInspectorDraft) => ({
      demo: draft.props.demo ?? "row-wrap",
      direction: draft.props.direction ?? "row",
      wrap: draft.props.wrap ?? "wrap",
      gap: draft.props.gap ?? "md",
      justify: draft.props.justify ?? "start",
      align: draft.props.align ?? "stretch",
    }),
  }),
  grid: defineRemixAdapter({
    Component: Grid as never,
    mapDraftToProps: (draft: SandboxInspectorDraft) => ({
      demo: draft.props.demo ?? "letters",
      cols: draft.props.cols ?? "3",
      gap: draft.props.gap ?? "md",
    }),
  }),
  button: defineRemixAdapter({
    Component: Button as never,
    mapDraftToProps: (draft: SandboxInspectorDraft) => {
      const variant = draft.props.variant ?? "primary";
      return {
        variant,
        type: draft.props.type ?? "button",
        className: buttonClassForVariant(variant),
        label: draft.slotText.label || "Button",
      };
    },
  }),
  "blog-hero": defineRemixAdapter({
    Component: BlogHero as never,
    mapDraftToProps: (draft: SandboxInspectorDraft) => {
      const slots = blogHeroSlotsFromText(draft.slotText);
      const primaryLabel = draft.slotText.ctaPrimary?.trim();
      const secondaryLabel = draft.slotText.ctaSecondary?.trim();
      return {
        layout: draft.props.layout ?? "magazine",
        slots: {
          eyebrow: slotFromHtml(slots.eyebrow),
          title: slotFromHtml(slots.title),
          subtitle: slotFromHtml(slots.subtitle),
          byline: slotFromHtml(slots.byline),
          ctaPrimary: primaryLabel ? (
            <Button
              variant="primary"
              href="#"
              className={buttonClassForVariant("primary")}
              label={primaryLabel}
            />
          ) : undefined,
          ctaSecondary: secondaryLabel ? (
            <Button
              variant="secondary"
              href="#"
              className={buttonClassForVariant("secondary")}
              label={secondaryLabel}
            />
          ) : undefined,
          cover: slots.cover ? (
            <figure class="overflow-hidden rounded-2xl border border-line bg-sand/50">
              <div
                class="aspect-[16/9] w-full bg-gradient-to-br from-accent/30 to-sand"
                role="img"
                aria-label="Cover placeholder"
              />
            </figure>
          ) : undefined,
        },
      };
    },
  }),
  header: defineRemixAdapter({
    Component: Header as never,
    mapDraftToProps: (draft: SandboxInspectorDraft) => {
      const brandLabel = draft.slotText.brand?.trim() || "Northline";
      const navSpec =
        draft.slotText.nav?.trim() ||
        "Home|/|,About|/about|,Contact|/contact";
      const actionsRaw = draft.slotText.actions?.trim() || "theme";
      return {
        sticky: draft.props.sticky ?? "off",
        transparent: draft.props.transparent ?? "off",
        borderBottom: draft.props.borderBottom ?? "on",
        slots: {
          brand: <SiteLogoPreview label={brandLabel} />,
          nav: NavLinksPreview(navSpec),
          actions:
            actionsRaw === "theme" || !actionsRaw ? (
              <ThemeTogglePreview />
            ) : (
              textNode(actionsRaw)
            ),
        },
      };
    },
  }),
  footer: defineRemixAdapter({
    Component: Footer as never,
    mapDraftToProps: (draft: SandboxInspectorDraft) => {
      const brandRaw =
        draft.slotText.brand?.trim() ||
        "Northline|Ship the work that matters.";
      const [name, tagline] = brandRaw.split("|").map((s) => s.trim());
      const columnsRaw =
        draft.slotText.columns?.trim() ||
        "Explore|Home|/|About|/about|Contact|/contact";
      const bottom =
        draft.slotText.bottom?.trim() ||
        "Studio Starter · Cloudflare Workers";
      const columnGroups = parseFooterColumns(columnsRaw);
      return {
        variant: draft.props.variant ?? "muted",
        borderTop: draft.props.borderTop ?? "off",
        slots: {
          brand: (
            <>
              <SiteLogoPreview
                label={name || "Northline"}
                className="inline-flex items-center gap-3 font-display text-base font-semibold text-ink no-underline"
              />
              {tagline ? (
                <p class="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
                  {tagline}
                </p>
              ) : null}
            </>
          ),
          columns: (
            <>
              {columnGroups.map((col) => (
                <FooterColumnPreview title={col.title} links={col.links} />
              ))}
            </>
          ),
          bottom: textNode(bottom),
        },
      };
    },
  }),
};

/** Render remix/ui preview for a component draft. */
export function renderRemixPreview(
  id: DesignComponentId,
  draft: SandboxInspectorDraft,
) {
  const adapter = remixAdapters[id];
  if (!adapter) {
    return (
      <p class="text-sm text-ink-soft">
        No remix adapter for <code>{id}</code> — HTML sandbox still works.
      </p>
    );
  }
  const props = adapter.mapDraftToProps(draft);
  if (id === "section") {
    return (
      <Section
        background={(props.background as never) ?? "transparent"}
        padding={(props.padding as never) ?? "lg"}
        gap={(props.gap as never) ?? "none"}
      >
        {props.children as never}
      </Section>
    );
  }
  if (id === "container") {
    return (
      <Container
        width={(props.width as never) ?? "xl"}
        align={(props.align as never) ?? "center"}
      >
        {props.children as never}
      </Container>
    );
  }
  if (id === "flex") {
    return (
      <Flex
        demo={(props.demo as never) ?? "row-wrap"}
        direction={(props.direction as never) ?? "row"}
        wrap={(props.wrap as never) ?? "wrap"}
        gap={(props.gap as never) ?? "md"}
        justify={(props.justify as never) ?? "start"}
        align={(props.align as never) ?? "stretch"}
      />
    );
  }
  if (id === "grid") {
    return (
      <Grid
        demo={(props.demo as never) ?? "letters"}
        cols={(props.cols as never) ?? "3"}
        gap={(props.gap as never) ?? "md"}
      />
    );
  }
  if (id === "button") {
    return (
      <Button
        variant={(props.variant as never) ?? "primary"}
        type={(props.type as never) ?? "button"}
        className={(props.className as string) ?? ""}
        label={(props.label as string) ?? "Button"}
      />
    );
  }
  if (id === "header") {
    return (
      <Header
        sticky={(props.sticky as never) ?? "off"}
        transparent={(props.transparent as never) ?? "off"}
        borderBottom={(props.borderBottom as never) ?? "on"}
        slots={props.slots as never}
      />
    );
  }
  if (id === "footer") {
    return (
      <Footer
        variant={(props.variant as never) ?? "muted"}
        borderTop={(props.borderTop as never) ?? "off"}
        slots={props.slots as never}
      />
    );
  }
  return (
    <BlogHero
      layout={(props.layout as never) ?? "magazine"}
      slots={props.slots as never}
    />
  );
}
