# NewGen POS — Windows client architecture

This app is a **desktop client only**. It does not run a local server or local PostgreSQL.

## Data flow

```
┌─────────────────────┐   download / sync    ┌─────────────────────┐
│  Windows POS app    │ ◄──────────────────► │  Cloud Laravel API  │
│  newgenpos.sqlite   │   POST /pos/sales/sync │  (MySQL/PostgreSQL) │
│  (Drift / SQLite)   │                        │  source of truth    │
└─────────────────────┘                        └─────────────────────┘
```

| Layer | Technology | Role |
|-------|------------|------|
| **Cloud** | Laravel + MySQL/PostgreSQL | Master catalog, users, all sale history |
| **Windows PC** | Drift → `newgenpos.sqlite` | Offline catalog, login users, pending sales |

## What the app does

1. **Register** terminal → cloud (`POST /pos/register`)
2. **Download** catalog + users → store in `newgenpos.sqlite`
3. **Login** → check username/password against downloaded `local_users`
4. **Bill offline** → save to `local_sales` (`sync_status = pending`)
5. **Sync online** → `POST /pos/sales/sync` → mark rows synced with cloud `sale_id`

Cloud URL is set in `lib/core/config/app_config.dart` (`developmentAppUrl` / `productionAppUrl`).

## Download modes

| Mode | When |
|------|------|
| **Full** | First setup or full re-download (clears catalog, keeps pending sales) |
| **Delta** | After login — rows with `updated_at >= since` |

## Large datasets

- Cloud pages up to 2000 rows; client requests **500** per HTTP call
- DB writes in **batches of 50** with UI yields between batches
- Progress bar shows resource + page + overall %
