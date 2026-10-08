"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { BUSINESS } from "@actiondev/shared";
import { GENERIC_WHATSAPP_TEXT, whatsappHref } from "@/lib/leads/whatsapp";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { MOBILE_NAV, OFFICE_LINE, PROJECT_CTA_HREF, PROJECT_CTA_LABEL, isCurrent, publicPath } from "./nav";

export const MOBILE_MENU_ID = "m-menu";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Botón «MENÚ» + menú a pantalla completa (DESIGN.md §7). `<dialog>` nativo
 * con `showModal()`: el resto de la página queda inerte, Esc lo cierra (evento
 * `cancel`) y al cerrar el foco vuelve al botón. Además el Tab se ATRAPA a mano
 * entre el primer y el último control (sin eso, del último saltaba a la barra
 * del navegador) y se bloquea el scroll del documento mientras está abierto.
 *
 * Sin transición (DESIGN.md §9: el menú aparece seco). Los enlaces están en el
 * HTML del servidor aunque el diálogo esté cerrado.
 */
export function MobileMenu({
  whatsappText = GENERIC_WHATSAPP_TEXT,
  ctaHref = PROJECT_CTA_HREF,
}: {
  whatsappText?: string;
  /** Destino de «Contar mi proyecto». */
  ctaHref?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = publicPath(usePathname());

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  const show = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setOpen(true);
  };
  const close = () => {
    dialogRef.current?.close();
    // El evento `close` llega en otra tarea: sin esto, al navegar el scroll
    // seguía bloqueado un instante.
    setOpen(false);
  };

  /** Tab y Mayús+Tab dan la vuelta dentro del diálogo. */
  const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const wa = whatsappHref(whatsappText);

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={MOBILE_MENU_ID}
        data-testid="m-menu-open"
        className="on-ink flex items-center gap-2 bg-ink px-[18px] font-display text-base font-extrabold uppercase tracking-[0.1em] text-paper hover:bg-lime hover:text-ink active:bg-lime active:text-ink"
      >
        Menú
        <Icon name="menu" size={22} />
      </button>

      <dialog
        ref={dialogRef}
        id={MOBILE_MENU_ID}
        aria-label="Menú"
        data-testid="m-menu"
        onClose={() => setOpen(false)}
        onKeyDown={trapFocus}
        className="on-ink fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-ink p-0 text-paper open:flex open:flex-col"
      >
        <div className="flex min-h-[60px] items-stretch border-b-2 border-line-dark">
          <Link
            href="/"
            onClick={close}
            aria-label="Action Development, inicio"
            className="mr-auto flex items-center px-4"
          >
            <Image src="/logos/logo-papel.png" alt="" width={113} height={34} className="h-[34px] w-auto" />
          </Link>
          <button
            type="button"
            onClick={close}
            data-testid="m-menu-close"
            className="flex items-center gap-2 border-l border-line-dark px-[18px] font-display text-base font-extrabold uppercase tracking-[0.1em] hover:bg-paper hover:text-ink active:bg-paper active:text-ink"
          >
            Cerrar
            <Icon name="close" size={22} />
          </button>
        </div>

        <nav aria-label="Menú principal">
          <ul>
            {MOBILE_NAV.map((item) => {
              const current = isCurrent(item.href, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={current ? "page" : undefined}
                    data-testid="m-menu-link"
                    className={`flex items-center justify-between gap-3 border-b border-line-dark px-4 pt-3.5 pb-2.5 font-display text-[54px] font-black uppercase leading-[0.9] tracking-[-0.01em] hover:bg-paper hover:text-ink active:bg-paper active:text-ink ${
                      current ? "text-lime" : ""
                    }`}
                  >
                    {item.label}
                    <Icon name="arrow_outward" size={34} className="text-muted-dark" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="grid grid-cols-[1fr_72px] gap-px border-b border-line-dark bg-line-dark">
          <Button href={ctaHref} variant="lime" size="xl" onClick={close} data-testid="m-menu-cta">
            {PROJECT_CTA_LABEL}
          </Button>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribir por WhatsApp"
            data-testid="m-menu-whatsapp"
            className="flex items-center justify-center bg-ink text-paper hover:bg-paper hover:text-ink active:bg-paper active:text-ink"
          >
            <Icon name="whatsapp" size={32} />
          </a>
        </div>

        <div className="grid gap-3.5 px-4 pt-5 pb-7">
          <p className="flex items-start gap-3">
            <Icon name="location_on" size={22} className="text-muted-dark" />
            <span>{OFFICE_LINE}</span>
          </p>
          <p className="flex items-start gap-3">
            <Icon name="call" size={22} className="text-muted-dark" />
            <span>{BUSINESS.phoneDisplay}</span>
          </p>
          <p className="flex items-start gap-3">
            <Icon name="mail" size={22} className="text-muted-dark" />
            <span>{BUSINESS.email}</span>
          </p>
          <p className="font-display text-label uppercase text-muted-dark">
            La primera reunión es gratis y sin compromiso
          </p>
        </div>
      </dialog>
    </>
  );
}
