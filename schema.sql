-- rampr — canonical Postgres schema + sector/company seed.
-- Run once locally (psql rampr -f schema.sql) and once against Railway Postgres.
-- Four tables, no views: open counts + breakdowns are derived at query time, not stored.

-- Sector lookup: display label + ordering, and the FK target for companies.
CREATE TABLE sectors (
  slug        text PRIMARY KEY,              -- 'data-ai' (also the board filter param)
  label       text NOT NULL,                 -- 'Data/AI'
  sort_order  smallint NOT NULL DEFAULT 0    -- market/filter display order
);

-- Companies we poll. Curated seed — ATS feeds carry no sector, so sector is assigned here.
CREATE TABLE companies (
  id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug           text NOT NULL UNIQUE,       -- /company/:slug
  name           text NOT NULL,
  sector_slug    text NOT NULL REFERENCES sectors(slug),
  ats_provider   text NOT NULL CHECK (ats_provider IN ('greenhouse', 'lever', 'ashby')),
  ats_id         text NOT NULL,              -- greenhouse token / lever site / ashby org
  careers_url    text,                       -- "view roles on X's board"
  tracked_since  date NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT companies_provider_ats_key UNIQUE (ats_provider, ats_id)
);

-- Currently-open roles only (poller upserts present, deletes departed); source of open counts + breakdowns.
CREATE TABLE listings (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id   integer NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  external_id  text NOT NULL,                -- stable ID from the ATS (upsert key)
  department   text,
  location     text,
  remote_type  text NOT NULL DEFAULT 'unknown'
                 CHECK (remote_type IN ('remote', 'hybrid', 'onsite', 'unknown')),
  CONSTRAINT listings_company_external_key UNIQUE (company_id, external_id)
);
-- Count + breakdowns are always scoped to one company.
CREATE INDEX listings_company_idx ON listings (company_id);

-- Forward-only time series: one open-count row per company per day; composite PK keeps the write idempotent.
CREATE TABLE daily_snapshots (
  company_id     integer NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  snapshot_date  date NOT NULL,
  open_count     integer NOT NULL CHECK (open_count >= 0),
  PRIMARY KEY (company_id, snapshot_date)
);
-- Market index + movers scan by date across companies.
CREATE INDEX daily_snapshots_date_idx ON daily_snapshots (snapshot_date);

-- Sector seed. Idempotent.
INSERT INTO sectors (slug, label, sort_order) VALUES
  ('data-ai',      'Data/AI',      1),
  ('fintech',      'Fintech',      2),
  ('devtools',     'Devtools',     3),
  ('health',       'Health',       4),
  ('defense',      'Defense',      5),
  ('design',       'Design',       6),
  ('ecomm',        'Ecomm',        7),
  ('productivity', 'Productivity', 8),
  ('other',        'Other',        9)
ON CONFLICT (slug) DO NOTHING;

-- Company seed (listings/snapshots come from polling). Every ats_id verified live against its ATS at build time.
INSERT INTO companies (slug, name, sector_slug, ats_provider, ats_id, careers_url) VALUES
  ('databricks',      'Databricks',      'data-ai',      'greenhouse', 'databricks',   'https://boards.greenhouse.io/databricks'),
  ('openai',          'OpenAI',          'data-ai',      'ashby',      'openai',       'https://jobs.ashbyhq.com/openai'),
  ('anthropic',       'Anthropic',       'data-ai',      'greenhouse', 'anthropic',    'https://boards.greenhouse.io/anthropic'),
  ('scale-ai',        'Scale AI',        'data-ai',      'greenhouse', 'scaleai',      'https://boards.greenhouse.io/scaleai'),
  ('glean',           'Glean',           'data-ai',      'greenhouse', 'gleanwork',    'https://boards.greenhouse.io/gleanwork'),
  ('cohere',          'Cohere',          'data-ai',      'ashby',      'cohere',       'https://jobs.ashbyhq.com/cohere'),
  ('stripe',          'Stripe',          'fintech',      'greenhouse', 'stripe',       'https://boards.greenhouse.io/stripe'),
  ('brex',            'Brex',            'fintech',      'greenhouse', 'brex',         'https://boards.greenhouse.io/brex'),
  ('affirm',          'Affirm',          'fintech',      'greenhouse', 'affirm',       'https://boards.greenhouse.io/affirm'),
  ('ramp',            'Ramp',            'fintech',      'ashby',      'ramp',         'https://jobs.ashbyhq.com/ramp'),
  ('plaid',           'Plaid',           'fintech',      'ashby',      'plaid',        'https://jobs.ashbyhq.com/plaid'),
  ('mercury',         'Mercury',         'fintech',      'greenhouse', 'mercury',      'https://boards.greenhouse.io/mercury'),
  ('gitlab',          'GitLab',          'devtools',     'greenhouse', 'gitlab',       'https://boards.greenhouse.io/gitlab'),
  ('fivetran',        'Fivetran',        'devtools',     'greenhouse', 'fivetran',     'https://boards.greenhouse.io/fivetran'),
  ('postman',         'Postman',         'devtools',     'greenhouse', 'postman',      'https://boards.greenhouse.io/postman'),
  ('grafana-labs',    'Grafana Labs',    'devtools',     'greenhouse', 'grafanalabs',  'https://boards.greenhouse.io/grafanalabs'),
  ('vercel',          'Vercel',          'devtools',     'greenhouse', 'vercel',       'https://boards.greenhouse.io/vercel'),
  ('sentry',          'Sentry',          'devtools',     'ashby',      'sentry',       'https://jobs.ashbyhq.com/sentry'),
  ('included-health', 'Included Health', 'health',       'lever',      'includedhealth', 'https://jobs.lever.co/includedhealth'),
  ('headway',         'Headway',         'health',       'ashby',      'headway',      'https://jobs.ashbyhq.com/headway'),
  ('ro',              'Ro',              'health',       'lever',      'ro',           'https://jobs.lever.co/ro'),
  ('maven-clinic',    'Maven Clinic',    'health',       'greenhouse', 'mavenclinic',  'https://boards.greenhouse.io/mavenclinic'),
  ('cedar',           'Cedar',           'health',       'ashby',      'cedar',        'https://jobs.ashbyhq.com/cedar'),
  ('shield-ai',       'Shield AI',       'defense',      'lever',      'shieldai',     'https://jobs.lever.co/shieldai'),
  ('palantir',        'Palantir',        'defense',      'lever',      'palantir',     'https://jobs.lever.co/palantir'),
  ('saronic',         'Saronic',         'defense',      'ashby',      'saronic',      'https://jobs.ashbyhq.com/saronic'),
  ('skydio',          'Skydio',          'defense',      'ashby',      'skydio',       'https://jobs.ashbyhq.com/skydio'),
  ('vannevar-labs',   'Vannevar Labs',   'defense',      'greenhouse', 'vannevarlabs', 'https://boards.greenhouse.io/vannevarlabs'),
  ('figma',           'Figma',           'design',       'greenhouse', 'figma',        'https://boards.greenhouse.io/figma'),
  ('miro',            'Miro',            'design',       'ashby',      'miro',         'https://jobs.ashbyhq.com/miro'),
  ('webflow',         'Webflow',         'design',       'greenhouse', 'webflow',      'https://boards.greenhouse.io/webflow'),
  ('descript',        'Descript',        'design',       'greenhouse', 'descript',     'https://boards.greenhouse.io/descript'),
  ('recraft',         'Recraft',         'design',       'ashby',      'recraft',      'https://jobs.ashbyhq.com/recraft'),
  ('gopuff',          'Gopuff',          'ecomm',        'lever',      'gopuff',       'https://jobs.lever.co/gopuff'),
  ('instacart',       'Instacart',       'ecomm',        'greenhouse', 'instacart',    'https://boards.greenhouse.io/instacart'),
  ('flexport',        'Flexport',        'ecomm',        'greenhouse', 'flexport',     'https://boards.greenhouse.io/flexport'),
  ('faire',           'Faire',           'ecomm',        'greenhouse', 'faire',        'https://boards.greenhouse.io/faire'),
  ('stockx',          'StockX',          'ecomm',        'greenhouse', 'stockx',       'https://boards.greenhouse.io/stockx'),
  ('asana',           'Asana',           'productivity', 'greenhouse', 'asana',        'https://boards.greenhouse.io/asana'),
  ('notion',          'Notion',          'productivity', 'ashby',      'notion',       'https://jobs.ashbyhq.com/notion'),
  ('clickup',         'ClickUp',         'productivity', 'ashby',      'clickup',      'https://jobs.ashbyhq.com/clickup'),
  ('airtable',        'Airtable',        'productivity', 'greenhouse', 'airtable',     'https://boards.greenhouse.io/airtable'),
  ('linear',          'Linear',          'productivity', 'ashby',      'linear',       'https://jobs.ashbyhq.com/linear'),
  ('calendly',        'Calendly',        'productivity', 'greenhouse', 'calendly',     'https://boards.greenhouse.io/calendly'),
  ('samsara',         'Samsara',         'other',        'greenhouse', 'samsara',      'https://boards.greenhouse.io/samsara'),
  ('verkada',         'Verkada',         'other',        'greenhouse', 'verkada',      'https://boards.greenhouse.io/verkada'),
  ('reddit',          'Reddit',          'other',        'greenhouse', 'reddit',       'https://boards.greenhouse.io/reddit'),
  ('vanta',           'Vanta',           'other',        'ashby',      'vanta',        'https://jobs.ashbyhq.com/vanta'),
  ('gong',            'Gong',            'other',        'greenhouse', 'gongio',       'https://boards.greenhouse.io/gongio'),
  ('discord',         'Discord',         'other',        'greenhouse', 'discord',      'https://boards.greenhouse.io/discord'),
  ('snowflake',       'Snowflake',       'data-ai',      'ashby',      'snowflake',    'https://jobs.ashbyhq.com/snowflake'),
  ('datadog',         'Datadog',         'data-ai',      'greenhouse', 'datadog',      'https://boards.greenhouse.io/datadog'),
  ('mongodb',         'MongoDB',         'data-ai',      'greenhouse', 'mongodb',      'https://boards.greenhouse.io/mongodb'),
  ('sierra',          'Sierra',          'data-ai',      'ashby',      'sierra',       'https://jobs.ashbyhq.com/sierra'),
  ('perplexity',      'Perplexity',      'data-ai',      'ashby',      'perplexity',   'https://jobs.ashbyhq.com/perplexity'),
  ('confluent',       'Confluent',       'data-ai',      'ashby',      'confluent',    'https://jobs.ashbyhq.com/confluent'),
  ('block',           'Block',           'fintech',      'greenhouse', 'block',        'https://boards.greenhouse.io/block'),
  ('navan',           'Navan',           'fintech',      'greenhouse', 'tripactions',  'https://boards.greenhouse.io/tripactions'),
  ('robinhood',       'Robinhood',       'fintech',      'greenhouse', 'robinhood',    'https://boards.greenhouse.io/robinhood'),
  ('coinbase',        'Coinbase',        'fintech',      'greenhouse', 'coinbase',     'https://boards.greenhouse.io/coinbase'),
  ('nubank',          'Nubank',          'fintech',      'greenhouse', 'nubank',       'https://boards.greenhouse.io/nubank'),
  ('sofi',            'SoFi',            'fintech',      'greenhouse', 'sofi',         'https://boards.greenhouse.io/sofi'),
  ('gusto',           'Gusto',           'fintech',      'greenhouse', 'gusto',        'https://boards.greenhouse.io/gusto'),
  ('cloudflare',      'Cloudflare',      'devtools',     'greenhouse', 'cloudflare',   'https://boards.greenhouse.io/cloudflare'),
  ('elastic',         'Elastic',         'devtools',     'greenhouse', 'elastic',      'https://boards.greenhouse.io/elastic'),
  ('twilio',          'Twilio',          'devtools',     'greenhouse', 'twilio',       'https://boards.greenhouse.io/twilio'),
  ('jfrog',           'JFrog',           'devtools',     'greenhouse', 'jfrog',        'https://boards.greenhouse.io/jfrog'),
  ('temporal',        'Temporal',        'devtools',     'greenhouse', 'temporaltechnologies', 'https://boards.greenhouse.io/temporaltechnologies'),
  ('docker',          'Docker',          'devtools',     'ashby',      'docker',       'https://jobs.ashbyhq.com/docker'),
  ('cockroach-labs',  'Cockroach Labs',  'devtools',     'greenhouse', 'cockroachlabs','https://boards.greenhouse.io/cockroachlabs'),
  ('lyra-health',     'Lyra Health',     'health',       'lever',      'lyrahealth',   'https://jobs.lever.co/lyrahealth'),
  ('talkiatry',       'Talkiatry',       'health',       'ashby',      'talkiatry',    'https://jobs.ashbyhq.com/talkiatry'),
  ('aledade',         'Aledade',         'health',       'lever',      'aledade',      'https://jobs.lever.co/aledade'),
  ('clover-health',   'Clover Health',   'health',       'greenhouse', 'cloverhealth', 'https://boards.greenhouse.io/cloverhealth'),
  ('sword-health',    'Sword Health',    'health',       'lever',      'swordhealth',  'https://jobs.lever.co/swordhealth'),
  ('komodo-health',   'Komodo Health',   'health',       'greenhouse', 'komodohealth', 'https://boards.greenhouse.io/komodohealth'),
  ('benchling',       'Benchling',       'health',       'ashby',      'benchling',    'https://jobs.ashbyhq.com/benchling'),
  ('chaos-industries','Chaos Industries','defense',      'greenhouse', 'chaosindustries', 'https://boards.greenhouse.io/chaosindustries'),
  ('epirus',          'Epirus',          'defense',      'greenhouse', 'epirus',       'https://boards.greenhouse.io/epirus'),
  ('photoroom',       'Photoroom',       'design',       'ashby',      'photoroom',    'https://jobs.ashbyhq.com/photoroom'),
  ('toast',           'Toast',           'ecomm',        'greenhouse', 'toast',        'https://boards.greenhouse.io/toast'),
  ('peloton',         'Peloton',         'ecomm',        'greenhouse', 'peloton',      'https://boards.greenhouse.io/peloton'),
  ('seatgeek',        'SeatGeek',        'ecomm',        'greenhouse', 'seatgeek',     'https://boards.greenhouse.io/seatgeek'),
  ('squarespace',     'Squarespace',     'ecomm',        'greenhouse', 'squarespace',  'https://boards.greenhouse.io/squarespace'),
  ('poshmark',        'Poshmark',        'ecomm',        'ashby',      'poshmark',     'https://jobs.ashbyhq.com/poshmark'),
  ('smartsheet',      'Smartsheet',      'productivity', 'greenhouse', 'smartsheet',   'https://boards.greenhouse.io/smartsheet'),
  ('dropbox',         'Dropbox',         'productivity', 'greenhouse', 'dropbox',      'https://boards.greenhouse.io/dropbox'),
  ('amplitude',       'Amplitude',       'productivity', 'greenhouse', 'amplitude',    'https://boards.greenhouse.io/amplitude'),
  ('zapier',          'Zapier',          'productivity', 'ashby',      'zapier',       'https://jobs.ashbyhq.com/zapier'),
  ('roblox',          'Roblox',          'other',        'greenhouse', 'roblox',       'https://boards.greenhouse.io/roblox'),
  ('airbnb',          'Airbnb',          'other',        'greenhouse', 'airbnb',       'https://boards.greenhouse.io/airbnb'),
  ('pinterest',       'Pinterest',       'other',        'greenhouse', 'pinterest',    'https://boards.greenhouse.io/pinterest'),
  ('lyft',            'Lyft',            'other',        'greenhouse', 'lyft',         'https://boards.greenhouse.io/lyft'),
  ('spotify',         'Spotify',         'other',        'lever',      'spotify',      'https://jobs.lever.co/spotify'),
  ('match-group',     'Match Group',     'other',        'lever',      'matchgroup',   'https://jobs.lever.co/matchgroup'),
  ('checkr',          'Checkr',          'other',        'greenhouse', 'checkr',       'https://boards.greenhouse.io/checkr'),
  ('1password',       '1Password',       'other',        'ashby',      '1password',    'https://jobs.ashbyhq.com/1password'),
  ('attentive',       'Attentive',       'other',        'greenhouse', 'attentive',    'https://boards.greenhouse.io/attentive'),
  ('life360',         'Life360',         'other',        'greenhouse', 'life360',      'https://boards.greenhouse.io/life360'),
  ('nextdoor',        'Nextdoor',        'other',        'greenhouse', 'nextdoor',     'https://boards.greenhouse.io/nextdoor')
ON CONFLICT (ats_provider, ats_id) DO NOTHING;
