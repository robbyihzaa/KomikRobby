import SearchPage from "../search/page";

export const metadata = {
  title: "Cari & Filter Komik – Oniforge",
  description: "Cari dan filter Manhwa, Manga, Manhua di Oniforge.",
};

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    type?: string;
    status?: string;
    orderby?: string;
    page?: string;
  }>;
}

export default function BrowsePage(props: BrowsePageProps) {
  return <SearchPage {...props} />;
}
