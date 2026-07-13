# ◉ NODO — La máquina de leads que trabaja sola

Proyecto 4 de **The Vibecoders League 2.0** (Platzi). Una landing de una agencia de
automatización con IA para PYMEs… cuya propia landing **es** una máquina de leads
funcionando en vivo. El visitante experimenta el producto al usarlo.

**Un solo formulario dispara un flujo completo, de principio a fin:**

```
Formulario → API
  ├─ ① Valida y normaliza los datos
  ├─ ② Clasifica el lead con IA (caliente / tibio / frío + score 0–100)
  ├─ ③ Lo guarda en la base de datos
  ├─ ④ Envía un correo de bienvenida real
  └─ ⑤ Notifica al equipo por Telegram
Dashboard en vivo ← se llena en tiempo real (polling cada 3s)
```

## ✨ Lo importante: funciona sin configurar nada

La app usa **degradación elegante**. Sin credenciales corre en *modo demo* y el flujo
igual se ejecuta completo (clasificador por reglas, almacenamiento en memoria, correo y
Telegram simulados). Cada credencial que agregas "enciende" esa etapa con datos reales:

| Etapa | Con credencial | Sin credencial (fallback) |
|---|---|---|
| Clasificación IA | API de Claude (`ANTHROPIC_API_KEY`) | Heurística por reglas |
| Base de datos | Neon Postgres (`DATABASE_URL`) | Memoria del proceso |
| Correo | Resend (`RESEND_API_KEY`) | Simulado (log) |
| Telegram | Bot API (`TELEGRAM_*`) | Simulado (log) |

Así el flujo **siempre termina** y siempre hay una URL viva y votable.

## 🛠 Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Neon serverless ·
Resend · Telegram Bot API · **API de Claude** (`claude-haiku-4-5` por defecto).

## 🚀 Correr en local

```bash
npm install
cp .env.example .env.local   # opcional: rellena lo que tengas
npm run dev                  # http://localhost:3000
```

- Landing (formulario): `/`
- Panel en vivo: `/dashboard`

## ☁️ Desplegar en Vercel

1. Sube el repo a GitHub y conéctalo en Vercel (o `vercel` CLI).
2. En **Settings → Environment Variables** agrega las que quieras activar
   (ver `.env.example`). Todas son opcionales.
3. Deploy. La URL pública es votable y compartible.

### Notas de credenciales
- **Neon**: crea un proyecto gratis en neon.tech y pega el connection string en `DATABASE_URL`.
  La tabla `leads` se crea sola en el primer registro.
- **Resend**: `onboarding@resend.dev` sirve para pruebas; para tu dominio, verifícalo.
- **Telegram**: crea un bot con @BotFather, obtén el token y tu `chat_id`
  (habla con el bot y consulta `https://api.telegram.org/bot<token>/getUpdates`).
- **Modelo IA**: `CLASSIFIER_MODEL` por defecto es `claude-haiku-4-5` (barato, apto para
  un demo público). Cámbialo a `claude-opus-4-8` para máxima calidad.

## 📁 Estructura

```
src/
  app/
    page.tsx              Landing + formulario + traza del flujo
    dashboard/page.tsx    Panel en vivo (polling)
    api/lead/route.ts     El flujo: valida → IA → guarda → correo → Telegram
    api/leads/route.ts    Fuente del dashboard
  lib/
    classify.ts           Clasificador IA (Claude) + fallback por reglas
    store.ts              Neon Postgres + fallback en memoria
    email.ts              Resend + fallback simulado
    telegram.ts           Bot API + fallback simulado
    types.ts
```
