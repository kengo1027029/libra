"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AdminRowMenuRootAttr =
  | "data-event-row-menu"
  | "data-applicant-menu"
  | "data-archive-row-menu";

type Box = { top: number; left: number };

export type AdminFixedRowMenuPopoverProps = {
  openMenuId: string | null;
  /** 開いている行の「···」ボタン要素 */
  getAnchorEl: () => HTMLElement | null;
  /** 行コンテナの data-* 属性名（data- プレフィックス付き） */
  rowMenuRootAttr: AdminRowMenuRootAttr;
  /** 初回レイアウト前のメニュー高さ推定（px） */
  estimatedMenuHeight: number;
  /** 初回レイアウト前のメニュー幅推定（px） */
  estimatedMenuWidth: number;
  onClose: () => void;
  /** メニューパネルに追加するクラス（min-w や py など） */
  menuPanelClassName?: string;
  children: React.ReactNode;
};

const VIEW_MARGIN = 8;
const GAP = 6;

function rootSelector(attr: AdminRowMenuRootAttr): string {
  return `[${attr}]`;
}

function isEventInsideOpenRow(
  target: HTMLElement,
  openMenuId: string,
  rowMenuRootAttr: AdminRowMenuRootAttr,
): boolean {
  const root = target.closest(rootSelector(rowMenuRootAttr));
  if (root?.getAttribute(rowMenuRootAttr) === openMenuId) return true;
  return target.closest(`[data-admin-row-menu-popover="${openMenuId}"]`) !== null;
}

export function AdminFixedRowMenuPopover({
  openMenuId,
  getAnchorEl,
  rowMenuRootAttr,
  estimatedMenuHeight,
  estimatedMenuWidth,
  onClose,
  menuPanelClassName = "",
  children,
}: AdminFixedRowMenuPopoverProps) {
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const getAnchorElRef = useRef(getAnchorEl);
  getAnchorElRef.current = getAnchorEl;

  const [box, setBox] = useState<Box | null>(null);

  const recompute = useCallback(() => {
    if (!openMenuId) {
      setBox(null);
      return;
    }
    const anchor = getAnchorElRef.current();
    if (!anchor) {
      setBox(null);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const panel = menuPanelRef.current;
    const mw = Math.max(panel?.offsetWidth || estimatedMenuWidth, 1);
    const mh = Math.max(panel?.offsetHeight || estimatedMenuHeight, 1);

    const maxTop = window.innerHeight - VIEW_MARGIN - mh;
    const minTop = VIEW_MARGIN;

    const roomBelow = window.innerHeight - rect.bottom - GAP;
    const roomAbove = rect.top - GAP;
    const preferUp = roomBelow < mh && roomAbove > roomBelow;

    let top = preferUp ? rect.top - GAP - mh : rect.bottom + GAP;
    top = Math.min(Math.max(top, minTop), maxTop);

    let left = rect.right - mw;
    const maxLeft = window.innerWidth - VIEW_MARGIN - mw;
    const minLeft = VIEW_MARGIN;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    setBox((prev) => {
      if (prev && prev.top === top && prev.left === left) return prev;
      return { top, left };
    });
  }, [openMenuId, estimatedMenuHeight, estimatedMenuWidth]);

  useLayoutEffect(() => {
    recompute();
  }, [recompute]);

  useEffect(() => {
    if (openMenuId === null) return;
    const menuId: string = openMenuId;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (isEventInsideOpenRow(target, menuId, rowMenuRootAttr)) return;
      onClose();
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openMenuId, rowMenuRootAttr, onClose]);

  useEffect(() => {
    if (!openMenuId) return;
    function onViewportChange() {
      onClose();
    }
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [openMenuId, onClose]);

  if (!openMenuId || typeof document === "undefined") return null;

  const positioned = box !== null;

  return createPortal(
    <div
      ref={menuPanelRef}
      role="menu"
      data-admin-row-menu-popover={openMenuId}
      className={`fixed z-[121] rounded-lg border border-neutral-200 bg-white shadow-lg ring-1 ring-black/5 ${menuPanelClassName}`.trim()}
      style={
        positioned
          ? { top: box.top, left: box.left, visibility: "visible" as const }
          : { top: -9999, left: -9999, visibility: "hidden" as const }
      }
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}
