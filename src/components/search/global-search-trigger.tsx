"use client";

import { useGlobalSearch } from "./global-search";

export function GlobalSearchTrigger() {
  const { openSearch } = useGlobalSearch();
  return <button aria-label="Search GadgetMoTo products" className="header-icon-control icon-control global-search-trigger" onClick={(event) => openSearch(event.currentTarget)} type="button"><svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" /><path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg></button>;
}
