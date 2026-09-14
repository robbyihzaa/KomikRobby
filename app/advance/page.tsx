import Navbar from "../../components/Navbar";
import { manhwadesu } from "../../lib/api";
import AdvanceClient from "../../components/AdvanceClient";

export const metadata = {
  title: "Advance VIP – Komik Eksklusif ManhwaDesu | KomikZone",
  description: "Halaman khusus Advance VIP KomikZone. Dapatkan akses eksklusif ke koleksi ManhwaDesu.",
};

export default async function AdvancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const p = await searchParams;
  const page = Math.max(1, Number(p.page || 1));

  let items: any[] = [];
  try {
    items = await manhwadesu(page);
  } catch (e) {
    console.error("Gagal memuat ManhwaDesu di /advance:", e);
  }

  return (
    <>
      <Navbar />
      <main className="container page-with-nav">
        <div className="page-header">
          <div>
            <h1>👑 Advance VIP Content</h1>
            <p className="muted">
              Halaman khusus koleksi komik eksklusif ManhwaDesu. Login untuk membuka gembok akses VIP.
            </p>
          </div>
        </div>

        <AdvanceClient items={items} page={page} />
      </main>
    </>
  );
}
