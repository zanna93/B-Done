# B-Done

B-Done è una Progressive Web App installabile per ricordare il corretto conferimento dei rifiuti porta a porta.

La prima versione è predisposta per il Comune di Jesi (AN), anno 2026, ma l'architettura è pensata per aggiungere nuovi comuni e nuovi anni senza riscrivere l'app.

## Stack

- React + TypeScript + Vite
- PWA con manifest e Service Worker
- CSV come unica sorgente dati
- LocalStorage versionato per preferenze e progressi
- Vitest per parser e logica di dominio

## Installazione

```bash
pnpm install
```

## Sviluppo

```bash
pnpm dev
```

## Test

```bash
pnpm test
```

## Build

```bash
pnpm build
```

## Anteprima produzione

```bash
pnpm preview
```

## Deploy

La build produce file statici in `dist/`, distribuibili su GitHub Pages, Vercel o Netlify.

Per GitHub Pages puoi usare il workflow incluso in `.github/workflows/ci.yml` come base e aggiungere un job di deploy quando il repository remoto è pronto.

## Struttura

```txt
data/
  raccolte_jesi_2026.csv
  vie_jesi.csv
  meta.csv
scripts/
  pdf-to-csv.ts
src/
  app/
  data/
  domain/
  features/
  services/
  ui/
  utils/
```

## CSV

`data/raccolte_jesi_2026.csv`

```csv
date,zona,rifiuto,note,is_variazione,is_doppio_ritiro
2026-05-28,residenziale,"organico,vetro","doppio ritiro",false,true
```

`data/vie_jesi.csv`

```csv
via,zona,note
VIA MONTECAPPONE,periferia_ovest,
```

`data/meta.csv`

```csv
comune,anno,versione,ultimo_aggiornamento,fonte
Jesi,2026,1.0.0,2026-01-01,Calendario ufficiale verificato manualmente
```

Le zone attualmente supportate sono:

- `residenziale`
- `periferia_ovest`
- `industriale`

Se una via non è presente in `vie_jesi.csv`, B-Done usa automaticamente `residenziale`.

## Aggiornamento annuale calendario

1. Scarica il PDF ufficiale del Comune o del gestore.
2. Estrai il testo con Poppler oppure passa direttamente il PDF allo script.
3. Esegui:

```bash
pnpm convert:pdf calendario-2027.pdf data/raccolte_jesi_2027.generated.csv
```

4. Verifica manualmente il CSV generato.
5. Rinomina il file verificato e aggiorna `meta.csv`.
6. Esegui `pnpm test` e `pnpm build`.

Il PDF non viene mai letto dall'app finale.

## Notifiche

La PWA salva preferenze e orari per sera prima, mattina, entrambe o nessuna.

Nota tecnica: notifiche affidabili con app chiusa richiedono Web Push e quindi un backend o servizio push. La v1 prepara il `NotificationManager` e il consenso utente, ma resta pronta a collegare un server push in una fase successiva.

## Dati demo

I CSV inclusi sono dimostrativi e marcati come tali. Prima di usare B-Done pubblicamente bisogna sostituire il calendario con dati ufficiali verificati.
