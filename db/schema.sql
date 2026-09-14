CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  base_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comics (
  id BIGSERIAL PRIMARY KEY,
  source_id INT REFERENCES sources(id),
  source_key TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  alternative_title TEXT,
  description TEXT,
  type TEXT,
  status TEXT,
  author TEXT,
  artist TEXT,
  rating TEXT,
  cover_url TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, source_key)
);

CREATE INDEX IF NOT EXISTS comics_title_idx ON comics(title);
CREATE INDEX IF NOT EXISTS comics_type_idx ON comics(type);

CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS comic_genres (
  comic_id BIGINT REFERENCES comics(id) ON DELETE CASCADE,
  genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY(comic_id, genre_id)
);

CREATE TABLE IF NOT EXISTS chapters (
  id BIGSERIAL PRIMARY KEY,
  comic_id BIGINT REFERENCES comics(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  chapter_number TEXT,
  title TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comic_id, source_key)
);

CREATE TABLE IF NOT EXISTS pages (
  id BIGSERIAL PRIMARY KEY,
  chapter_id BIGINT REFERENCES chapters(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  image_url TEXT NOT NULL,
  UNIQUE(chapter_id, page_number)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id BIGSERIAL PRIMARY KEY,
  source_id INT REFERENCES sources(id),
  category TEXT,
  page INT,
  status TEXT NOT NULL,
  items_seen INT DEFAULT 0,
  items_saved INT DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

INSERT INTO sources(name, base_url) VALUES ('Komiku','https://komiku.org')
ON CONFLICT(name) DO NOTHING;
