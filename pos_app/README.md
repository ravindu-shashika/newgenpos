# NewGen POS (`pos_app`)

Windows desktop POS — **cloud API client** with offline-first local storage.

- Download catalog from cloud API → **`newgenpos.sqlite`** (Drift/SQLite)
- Bill offline → queue in `local_sales`
- Sync sales back to cloud when online
- **No local server** — no PostgreSQL on the PC

## Architecture

```
Windows app  ◄──►  Cloud API (/pos/*)  ◄──►  MySQL/PostgreSQL
newgenpos.sqlite     download + sync sales
```

## App flow

1. **Register** device (terminal + POS token)
2. **Download** full catalog (admin activates terminal first)
3. **Login** with downloaded username/password
4. **POS** — scan, search, complete sales locally
5. **Sync** — pending sales upload to cloud automatically

## Run (Windows)

```bash
cd pos_app
flutter pub get
dart run build_runner build
flutter run -d windows
```

Set cloud URL in `lib/core/config/app_config.dart`:

```dart
static const AppRunMode runMode = AppRunMode.development;
static const String developmentAppUrl = 'http://127.0.0.1:8000';
```

## Local database

File: `%USERPROFILE%\Documents\newgenpos.sqlite`

| Table | Purpose |
|-------|---------|
| `device_session` | Terminal registration, tokens, logged-in user |
| `local_users` | Downloaded users (offline login) |
| `products`, `product_stock`, `customers`, … | Downloaded catalog |
| `local_sales`, `local_sale_lines` | Offline sales + sync state |
| `sync_meta` | Last download timestamp |

## Key files

| File | Role |
|------|------|
| `lib/core/database/app_database.dart` | Drift local DB |
| `lib/core/sync/catalog_download_service.dart` | Download from cloud |
| `lib/core/sync/sync_service.dart` | Upload pending sales |
| `lib/core/pos_http/pos_api_client.dart` | Cloud `/pos` HTTP client |
| `lib/features/pos/pos_screen.dart` | Main POS UI |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DATA_MODEL.md](docs/DATA_MODEL.md).
