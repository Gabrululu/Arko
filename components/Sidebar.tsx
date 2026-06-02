"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { gsap } from "gsap";
import { listSpacesByOwner, type Space } from "@/lib/arkiv/spaces";
import { listDocsInSpace, type Doc } from "@/lib/arkiv/docs";
import {
  ChevronRight,
  FileText,
  FolderOpen,
  Home,
  Plus,
  Search,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function SpaceItem({ space }: { space: Space }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(pathname.includes(`/${space.slug}`));
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loaded, setLoaded] = useState(false);

  const isActive = pathname.includes(`/${space.slug}`);

  useEffect(() => {
    if (open && !loaded) {
      listDocsInSpace(space.entityKey).then((d) => {
        setDocs(d);
        setLoaded(true);
      });
    }
  }, [open, loaded, space.entityKey]);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-left group transition-colors duration-150 ${
          isActive ? "bg-[#f5f1e8] text-[#615050]" : "text-[#776a6a] hover:bg-[#f5f1e8] hover:text-[#615050]"
        }`}
      >
        <ChevronRight
          size={12}
          className={`flex-shrink-0 transition-transform duration-200 text-[#ad9a6f] ${open ? "rotate-90" : ""}`}
        />
        <span className="text-base">{space.icon ?? "📁"}</span>
        <span className="text-sm font-medium flex-1 truncate">{space.name}</span>
        <Link
          href={`/dashboard/${space.slug}/new/edit`}
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#ede8dc] transition-all"
          title="New doc"
        >
          <Plus size={12} />
        </Link>
      </button>

      {open && (
        <div className="ml-4 mt-0.5 border-l border-[#e0d9cc] pl-2 space-y-0.5">
          {!loaded && (
            <div className="py-2 space-y-1.5">
              {[1, 2].map((i) => (
                <div key={i} className="h-3 bg-[#ede8dc] rounded animate-pulse" />
              ))}
            </div>
          )}
          {loaded && docs.length === 0 && (
            <p className="py-2 text-[11px] text-[#ad9a6f] italic">No pages yet</p>
          )}
          {loaded &&
            docs.map((doc) => {
              const docPath = `/dashboard/${space.slug}/${doc.slug}/edit`;
              const isDocActive = pathname === docPath || pathname.includes(`/docs/${space.slug}/${doc.slug}`);
              return (
                <Link
                  key={doc.entityKey}
                  href={docPath}
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm transition-colors ${
                    isDocActive
                      ? "bg-[#f5f1e8] text-[#615050] font-medium"
                      : "text-[#776a6a] hover:bg-[#f5f1e8] hover:text-[#615050]"
                  }`}
                >
                  <FileText size={12} className="flex-shrink-0 text-[#ad9a6f]" />
                  <span className="truncate">{doc.icon ?? ""} {doc.title}</span>
                </Link>
              );
            })}
          <Link
            href={`/dashboard/${space.slug}/new/edit`}
            className="flex items-center gap-2 px-2 py-1 rounded-lg text-[11px] text-[#ad9a6f] hover:text-[#615050] hover:bg-[#f5f1e8] transition-colors"
          >
            <Plus size={11} />
            Add a page
          </Link>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { address, isConnected } = useAccount();
  const pathname = usePathname();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [mounted, setMounted] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !address) return;
    listSpacesByOwner(address).then(setSpaces);
  }, [address, mounted]);

  // Animate open/close
  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.to(sidebarRef.current, {
      width: collapsed ? 0 : 260,
      opacity: collapsed ? 0 : 1,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [collapsed]);

  const isHome = pathname === "/";
  const isDash = pathname === "/dashboard";

  if (!mounted) return null;

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={onToggle}
        className="fixed top-[72px] left-3 z-40 w-7 h-7 flex items-center justify-center rounded-lg
                   bg-[#fcfcfc] border border-[#d4c9b0] text-[#776a6a] hover:text-[#615050]
                   hover:border-[#ad9a6f] transition-all duration-200 shadow-sm"
        title={collapsed ? "Open sidebar" : "Close sidebar"}
      >
        {collapsed ? <PanelLeft size={13} /> : <PanelLeftClose size={13} />}
      </button>

      {/* Sidebar panel */}
      <div
        ref={sidebarRef}
        style={{ width: 260, overflow: "hidden" }}
        className="flex-shrink-0 h-[calc(100vh-64px)] sticky top-16 border-r border-[#e0d9cc] bg-[#faf7f2] flex flex-col"
      >
        <div className="flex flex-col h-full overflow-y-auto py-3 px-2 space-y-1 min-w-[260px]">

          {/* Search */}
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              document.dispatchEvent(new CustomEvent("open-command-palette"));
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#776a6a] hover:bg-[#f0ebe0] hover:text-[#615050] transition-colors"
          >
            <Search size={14} className="flex-shrink-0" />
            <span className="flex-1">Quick find</span>
            <kbd className="text-[10px] font-mono bg-[#e8e3d8] px-1.5 py-0.5 rounded text-[#ad9a6f]">⌘K</kbd>
          </Link>

          {/* Navigation */}
          <div className="pt-1 pb-1">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isHome ? "bg-[#f5f1e8] text-[#615050] font-medium" : "text-[#776a6a] hover:bg-[#f5f1e8]"
              }`}
            >
              <Home size={14} className="flex-shrink-0 text-[#ad9a6f]" />
              Home
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isDash ? "bg-[#f5f1e8] text-[#615050] font-medium" : "text-[#776a6a] hover:bg-[#f5f1e8]"
              }`}
            >
              <FolderOpen size={14} className="flex-shrink-0 text-[#ad9a6f]" />
              All spaces
            </Link>
          </div>

          <hr className="border-[#e0d9cc]" />

          {/* Spaces */}
          {isConnected ? (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between px-3 pt-1 pb-0.5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#c4b89a]">My Spaces</p>
                <Link
                  href="/dashboard"
                  className="text-[#ad9a6f] hover:text-[#615050] transition-colors"
                  title="New space"
                >
                  <Plus size={13} />
                </Link>
              </div>
              {spaces.length === 0 && (
                <p className="px-3 py-2 text-[11px] text-[#ad9a6f] italic">No spaces yet</p>
              )}
              {spaces.map((space) => (
                <SpaceItem key={space.entityKey} space={space} />
              ))}
            </div>
          ) : (
            <p className="px-3 py-2 text-[11px] text-[#ad9a6f] italic">Connect wallet to see spaces</p>
          )}

          <div className="flex-1" />

          <hr className="border-[#e0d9cc]" />

          {/* Footer */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[#776a6a] hover:bg-[#f5f1e8] transition-colors"
          >
            <Settings size={14} className="flex-shrink-0 text-[#ad9a6f]" />
            Settings
          </Link>
        </div>
      </div>
    </>
  );
}
