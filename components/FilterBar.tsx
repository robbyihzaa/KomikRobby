"use client";

import Link from "next/link";
import { useState } from "react";
import { GENRES, TYPES, STATUSES, ORDERS } from "../lib/genres";

interface FilterBarProps {
  currentQ?: string;
  currentGenre?: string;
  currentType?: string;
  currentStatus?: string;
  currentOrder?: string;
}

export default function FilterBar({
  currentQ = "",
  currentGenre = "",
  currentType = "",
  currentStatus = "",
  currentOrder = "popular",
}: FilterBarProps) {
  const [showAllGenres, setShowAllGenres] = useState(false);

  // Helper to construct URL with updated filter keys for unified Search & Filter
  const buildUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    const next = {
      q: currentQ,
      genre: currentGenre,
      type: currentType,
      status: currentStatus,
      orderby: currentOrder,
      ...updates,
    };

    if (next.q) params.set("q", next.q);
    if (next.genre) params.set("genre", next.genre);
    if (next.type) params.set("type", next.type);
    if (next.status) params.set("status", next.status);
    if (next.orderby && next.orderby !== "popular") params.set("orderby", next.orderby);

    const qs = params.toString();
    return `/search${qs ? `?${qs}` : ""}`;
  };

  const hasActiveFilters = Boolean(
    currentGenre ||
    currentType ||
    currentStatus ||
    (currentOrder && currentOrder !== "popular")
  );

  // Top 14 genres visible initially, rest in expand toggle
  const initialGenres = GENRES.slice(0, 14);
  // If active genre is outside top 14, include it so it's always visible
  if (currentGenre && !initialGenres.some((g) => g.slug === currentGenre)) {
    const found = GENRES.find((g) => g.slug === currentGenre);
    if (found) initialGenres.push(found);
  }
  const visibleGenres = showAllGenres ? GENRES : initialGenres;

  return (
    <div className="filter-panel">
      {/* Filter Controls Grid */}
      <div className="filter-controls-grid">
        {/* Type Selector */}
        <div className="filter-group">
          <label className="filter-label">Tipe Komik</label>
          <div className="filter-chips">
            {TYPES.map((t) => {
              const isActive = currentType === t.slug;
              const targetUrl = buildUrl({ type: isActive && t.slug ? "" : t.slug });
              return (
                <Link
                  key={t.slug}
                  href={targetUrl}
                  scroll={false}
                  className={`filter-chip ${isActive ? "filter-chip-active" : ""}`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Status Selector */}
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <div className="filter-chips">
            {STATUSES.map((s) => {
              const isActive = currentStatus === s.slug;
              const targetUrl = buildUrl({ status: isActive && s.slug ? "" : s.slug });
              return (
                <Link
                  key={s.slug}
                  href={targetUrl}
                  scroll={false}
                  className={`filter-chip ${isActive ? "filter-chip-active" : ""}`}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sort Selector */}
        <div className="filter-group">
          <label className="filter-label">Urutkan</label>
          <div className="filter-chips">
            {ORDERS.map((o) => {
              const isActive = currentOrder === o.slug;
              const targetUrl = buildUrl({ orderby: o.slug });
              return (
                <Link
                  key={o.slug}
                  href={targetUrl}
                  scroll={false}
                  className={`filter-chip ${isActive ? "filter-chip-active" : ""}`}
                >
                  {o.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Genre Section */}
      <div className="filter-group genre-filter-group">
        <div className="filter-group-header">
          <label className="filter-label">Genre</label>
          {GENRES.length > 14 && (
            <button
              type="button"
              className="btn-text-toggle"
              onClick={() => setShowAllGenres(!showAllGenres)}
            >
              {showAllGenres ? "Tampilkan Sedikit ▲" : `Lihat Semua (${GENRES.length}) ▼`}
            </button>
          )}
        </div>

        <div className="filter-chips genre-chips">
          <Link
            href={buildUrl({ genre: "" })}
            scroll={false}
            className={`filter-chip ${!currentGenre ? "filter-chip-active" : ""}`}
          >
            Semua Genre
          </Link>
          {visibleGenres.map((g) => {
            const isActive = currentGenre === g.slug;
            const targetUrl = buildUrl({ genre: isActive ? "" : g.slug });
            return (
              <Link
                key={g.slug}
                href={targetUrl}
                scroll={false}
                className={`filter-chip ${isActive ? "filter-chip-active" : ""}`}
              >
                {g.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      {hasActiveFilters && (
        <div className="active-filters-bar">
          <span className="active-filters-title">Filter Aktif:</span>
          <div className="active-filters-list">
            {currentGenre && (
              <span className="active-filter-tag">
                Genre: {GENRES.find((g) => g.slug === currentGenre)?.label || currentGenre}
                <Link
                  href={buildUrl({ genre: "" })}
                  scroll={false}
                  aria-label="Hapus filter genre"
                  className="active-filter-remove"
                >
                  ✕
                </Link>
              </span>
            )}
            {currentType && (
              <span className="active-filter-tag">
                Tipe: {TYPES.find((t) => t.slug === currentType)?.label || currentType}
                <Link
                  href={buildUrl({ type: "" })}
                  scroll={false}
                  aria-label="Hapus filter tipe"
                  className="active-filter-remove"
                >
                  ✕
                </Link>
              </span>
            )}
            {currentStatus && (
              <span className="active-filter-tag">
                Status: {STATUSES.find((s) => s.slug === currentStatus)?.label || currentStatus}
                <Link
                  href={buildUrl({ status: "" })}
                  scroll={false}
                  aria-label="Hapus filter status"
                  className="active-filter-remove"
                >
                  ✕
                </Link>
              </span>
            )}
            {currentOrder && currentOrder !== "popular" && (
              <span className="active-filter-tag">
                Urutan: {ORDERS.find((o) => o.slug === currentOrder)?.label || currentOrder}
                <Link
                  href={buildUrl({ orderby: "popular" })}
                  scroll={false}
                  aria-label="Reset urutan"
                  className="active-filter-remove"
                >
                  ✕
                </Link>
              </span>
            )}
            <Link href="/search" scroll={false} className="btn-reset-filters">
              Reset Semua
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
