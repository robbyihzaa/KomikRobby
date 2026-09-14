import { komiku } from "./source";

export async function latest(page: number = 1) {
  return komiku.latest(page);
}

export async function popular(page: number = 1) {
  return komiku.popular(page);
}



export async function search(q: string) {
  return komiku.search(q);
}

export async function detail(slug: string) {
  return komiku.detail(slug);
}

export async function chapter(slug: string, number: string) {
  return komiku.chapter(slug, number);
}

export async function filter(params: {
  genre?: string;
  type?: string;
  status?: string;
  orderby?: string;
  page?: number;
} = {}) {
  return komiku.filter(params);
}

export async function genre(slug: string, page: number = 1) {
  return komiku.genre(slug, page);
}