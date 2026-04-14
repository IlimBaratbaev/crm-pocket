# CRM Pocket — Контекст проекта

## Что это
CRM-система для компании по отправке студентов за рубеж.
Простая, без лишнего — только лиды, автоответы, рассылки, сделки, документы.

## Стек
- **PocketBase** — бэкенд, база данных (SQLite), хранилище файлов, авторизация
- **Node.js + Baileys** — WhatsApp интеграция (неофициальная, через QR-код)
- **React + Vite + Tailwind** — фронтенд
- **Docker Compose + Nginx** — деплой на VPS

## Структура проекта
```
crm-pocket/
├── pocketbase/
│   ├── pb_migrations/1_init.js     # схема всех 7 коллекций
│   └── pb_hooks/broadcasts.pb.js  # хук: при статусе "sending" → вызывает WA сервис
├── whatsapp-service/
│   ├── src/index.ts                # Express сервер (порт 3001)
│   ├── src/whatsapp.ts             # Baileys: подключение, обработка входящих
│   ├── src/broadcast.ts            # рассылка по всем лидам с задержкой
│   └── src/pb-client.ts            # обёртка над PocketBase SDK
├── frontend/src/pages/
│   ├── Dashboard.tsx               # главная: 3 карточки статистики + последние лиды
│   ├── Leads.tsx                   # таблица лидов, добавление, удаление, фильтры
│   ├── Deals.tsx                   # kanban-доска (5 этапов)
│   ├── Documents.tsx               # дерево: клиент → папка → файлы
│   ├── AutoReplies.tsx             # шаблоны автоответов, редактирование, вкл/выкл
│   └── Broadcasts.tsx              # рассылки: форма + история с прогрессом
├── nginx/nginx.conf                # reverse proxy: / → frontend, /api/ → PB, /wa/ → WA
└── docker-compose.yml              # 4 сервиса: pocketbase, whatsapp, frontend, nginx
```

## Коллекции PocketBase (база данных)
| Коллекция | Назначение |
|---|---|
| `leads` | Лиды — телефон, имя, источник (whatsapp/instagram), статус |
| `deals` | Сделки — связь с лидом, этап, сумма |
| `folders` | Папки документов — привязаны к лиду |
| `documents` | Файлы — привязаны к папке и лиду |
| `auto_replies` | Шаблоны автоответов — триггер, платформа, текст, вкл/выкл |
| `broadcasts` | Рассылки — текст, ссылка, статус, счётчик |
| `broadcast_logs` | Лог каждой отправки рассылки |

## Как работает WhatsApp
1. Сервис стартует → подключается через QR-код (Baileys)
2. Входящее сообщение → новый лид сохраняется в PocketBase → отправляется автоответ "welcome"
3. Рассылка: фронтенд создаёт запись broadcasts со статусом "sending" → PocketBase хук вызывает `/broadcast/:id` → сервис обходит всех лидов и шлёт сообщение

## Instagram
Phase 1 (сейчас): лиды с Instagram добавляются вручную через форму (source=instagram).
Phase 2 (потом): Meta Graph API webhooks — требует одобренного бизнес-аккаунта.

## Деплой на VPS
```bash
git clone git@github.com:IlimBaratbaev/crm-pocket.git
cd crm-pocket
cp .env.example .env
# заполнить .env
docker compose up --build -d
```

После запуска:
1. `http://VPS_IP/_/` → создать админ аккаунт PocketBase
2. `http://VPS_IP/wa/qr` → получить QR → отсканировать телефоном
3. `http://VPS_IP` → добавить первый автоответ (триггер: welcome, платформа: whatsapp)

## .env переменные
```
PB_ADMIN_EMAIL=     # email для PocketBase admin
PB_ADMIN_PASSWORD=  # пароль
WA_SERVICE_PORT=3001
WA_SERVICE_SECRET=  # секрет между PB хуком и WA сервисом
VITE_PB_URL=        # URL PocketBase (для сборки фронтенда)
```

## Репозиторий
https://github.com/IlimBaratbaev/crm-pocket
