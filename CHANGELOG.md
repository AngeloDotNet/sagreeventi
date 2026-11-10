# Registro modifiche al codice

Registro delle modifiche al codice: un titolo per giorno, con una sottosezione per intervento (cosa, dove e perché). Più recente in alto.

## 2026-11-10

### Regole del template aggiornate e confrontate con i `.bak`

**Perché:** `/kit:aggiorna-regole` ha portato `.claude/rules*/` alle versioni del template (core 3.37, git 1.4, frontend 1.6, ecc.); serviva sapere se i vecchi file contenessero qualcosa di perso.
**Cosa / Dove:** aggiornati 12 file in `.claude/rules/` e `.claude/rules-optional/` (con copie `.md.bak` accanto), aggiunto `.claude/rules/lavoro.md`; creato `CONFRONTO-REGOLE-BAK.md` (root, non da committare) con le differenze file per file.
**Verifica:** nessun codice toccato, nessuna build. Confronto fatto con `diff` e `git diff --word-diff`.
**Note:** nei `.bak` nulla di specifico del progetto.

### Riallineamento di `CLAUDE.md` alle regole 2026-11-10 e controlli sul codice

**Perché:** i nuovi `core.md` e `git.md` citano `lavoro.md` e la voce «Commit di fila, massimo per lotto».
**Cosa / Dove:** `CLAUDE.md`: `lavoro` nell'elenco dei moduli; voce «Commit di fila, massimo per lotto: 5» (scelta del 2026-11-10).
**Verifica:** `grep` in `src/` (nessun `transition: all`, nessun `EnableSensitiveDataLogging`/`EnableDetailedErrors`); i tre compose di `deploy/` non hanno nessuna opzione di hardening (né `no-new-privileges`, né `read_only`, `cap_drop`, `pids_limit`).
**Note:** hardening dei compose rimandato (server in aggiornamento di sicurezza), nessun compose toccato; il piano `docs/piani/PLAN-hardening-compose.md` è stato scritto e poi cancellato su richiesta, con promemoria in `CHECKLIST.md`. Cancellati i 12 file `.md.bak` (via libera del 2026-11-10).

### Versione da tag: `build-info.mjs` legge `APP_VERSION` (passo 1 di `PLAN-versione-da-tag.md`)

**Perché:** la versione mostrata in Informazioni veniva solo da `package.json` (sempre `1.0.0`). La CI dovrà passarla dal tag git `vX.Y.Z`.
**Cosa / Dove:** `src/SagreEventi.Web/scripts/build-info.mjs`: usa la variabile d'ambiente `APP_VERSION` solo se è nel formato `X.Y.Z`, altrimenti `package.json`; il valore scartato è stampato con `JSON.stringify` nel warning (niente log injection).
**Verifica:** script provato a mano con valore assente, valido, con spazi, vuoto, `1.2`, `v1.2.3`, `1.2.3-rc1`, tentativi di iniezione e a capo: sempre scartati o accettati come atteso. `npm test`: 361/361 verdi. Nessun test automatico nuovo (lo script non è importabile da Vitest).
**Note:** da fare gli step 2-5 (Dockerfile, workflow, verifica con Docker, documentazione). Nessun commit.

### Versione da tag: `ARG APP_VERSION` nel Dockerfile web (passo 2 di `PLAN-versione-da-tag.md`)

**Perché:** la CI deve poter passare la versione del tag al build dell'immagine, perché `build-info.mjs` la legga.
**Cosa / Dove:** `src/SagreEventi.Web/Dockerfile`: `ARG APP_VERSION` e `ENV APP_VERSION` nello stage `build` (non finiscono nell'immagine finale, che è lo stage nginx); commento d'uso in testa. La versione non è un segreto, quindi l'`ARG` è ammesso da `docker.md`.
**Verifica:** `docker` non è installato su questo PC: l'immagine **non è stata buildata**. Da verificare nella CI o altrove (passo 4).

### Versione da tag: il workflow parte sui tag `vX.Y.Z` (passo 3 di `PLAN-versione-da-tag.md`)

**Perché:** la CI deve ricavare la versione dal tag e pubblicare le immagini anche come `X.Y.Z` (decisione del 2026-11-10).
**Cosa / Dove:** `.github/workflows/build-push.yml`: trigger `push: tags: ['v*.*.*']`; `PUSH` vale anche per i tag; passo «Version from tag» in entrambi i job (il nome del tag passa da una variabile d'ambiente e deve essere esattamente `vX.Y.Z`, altrimenti il job fallisce); l'immagine web riceve `build-args: APP_VERSION`; sia `sagreeventi-api` sia `sagreeventi-web` ricevono il tag `X.Y.Z` oltre a `latest` e sha (la riga resta vuota, e quindi ignorata, fuori dai tag).
**Verifica:** YAML letto correttamente con `js-yaml` (trigger, `PUSH`, passi dei due job); regex del tag provata su 6 valori (`v1.2.3` e `v10.20.30` ok; `v1.2`, `1.2.3`, `v1.2.3-rc1`, `v1.2.3;x` rifiutati). Pipeline **non avviata**: serve la tua conferma per ogni esecuzione.
### Chiusura della sessione: piano concluso cancellato, piani di lavoro aggiornati

**Perché:** `PLAN-versione-da-tag.md` aveva tutti i passi spuntati; per `CLAUDE.md` un piano concluso si cancella (la storia resta qui).
**Cosa / Dove:** cancellato `docs/piani/PLAN-versione-da-tag.md` (non tracciato); aggiornati `piano-commit.md` (nuova sezione V1–V3 e decisione aperta sui file con modifiche miste), `PIANO.md` (ripartenza) e `CHECKLIST.md` (prima prova con un tag, tag solo su `main`, test di `build-info.mjs`; corretta la riga «periodi dei temi», che diceva ancora «dal passo 1»). Tenuto `PLAN-periodi-temi.md`: tutti i passi sono fatti ma i commit non ancora, e il worktree va riallineato.
**Verifica:** solo documentazione; nessuna build né test. README, DEPLOY e wiki erano già aggiornati nel passo 5 (build e typecheck della wiki ok). Non toccati i `.claude/rules/*.bak` (non sono `.md`, in attesa di conferma in `CHECKLIST.md`).

### Versione da tag: documentazione (passo 5 di `PLAN-versione-da-tag.md`)

**Perché:** `README.md`, `DEPLOY.md` e la wiki dicevano ancora che la versione si cambia a mano in `package.json`.
**Cosa / Dove:** `README.md` (funzionalità Informazioni e sezione su `build-info.mjs`), `DEPLOY.md` (workflow: tag `vX.Y.Z`, formato obbligatorio, tag `X.Y.Z` sulle immagini, il tag lo crea l'utente); wiki `docs/sagreeventi/informazioni.md`, `deployment.md`, `architettura.md` e `CHANGELOG.md` della wiki.
**Verifica:** build e typecheck della wiki senza errori. Nessun commit, né nel repository né nella wiki (la wiki aveva già modifiche non committate).

### Versione da tag: verifica locale (passo 4 di `PLAN-versione-da-tag.md`)

**Verifica:** `APP_VERSION=2.3.4 npm run build -- --configuration production` ok, senza warning; il file generato contiene `2.3.4` e la stringa è nel bundle JS prodotto. Senza variabile, `npm test` torna a `1.0.0`: 361/361 test verdi. Build Docker **non** provata (Docker assente su questo PC): da verificare alla prima esecuzione della CI su un tag.

**Note (passo 3):** un tag su un commit vecchio o fuori da `main` aggiorna comunque `latest`: oggi non c'è nessun controllo.

## 2026-11-09

### Riallineamento dei riferimenti di CLAUDE.md alle regole aggiornate

**Perché:** il template ha diviso `security.md` in `security-backend.md` e `security-frontend.md` e ha aggiornato `core.md` alla v3.36 (sito di documentazione esterno, §5b). Alcuni rimandi di `CLAUDE.md` puntavano ancora alle sezioni nel posto sbagliato.
**Cosa / Dove:** `CLAUDE.md`: elenco delle regole in apertura (aggiunti `security-backend` e `security-frontend`); riferimenti a JWT, deroga MFA, healthcheck, security headers, header `Server` e `Cache-Control: no-store` spostati su `security-backend.md`. Nessuna decisione cambiata.
**Verifica:** solo modifica di documentazione; nessuna build né test richiesti.
**Note:** `core.md` aggiornato alla v3.36 con `/kit:aggiorna-regole` (il precedente è in `core.md.bak`). Gli altri moduli erano già uguali al template.

### Cartelle per elemento in `shared/` e per le pagine singole (P2 e P3 del refactoring frontend)

**Perché:** `frontend.md` v1.1 chiede una cartella per ogni componente e per ogni pagina, anche quando è l'unica della feature (`PLAN-cartelle-frontend.md`, passi P2 e P3).
**Cosa / Dove:** 4 componenti in `src/SagreEventi.Web/src/app/shared/<nome>/` (`empty-state`, `evento-card`, `festone`, `sync-status`). 9 pagine in `features/<area>/<pagina>/`: `agenda`, `amministrazione`, `gestione`, `home`, `informazioni`, `login`, `not-found`, `revisione`, `segnalazioni/mie-segnalazioni`. Con i rispettivi `.html`, `.css` e `.spec.ts`. Riscritti 47 import e lazy import in `app.routes.ts`. `features/eventi/` invariato.
**Verifica:** build Angular senza errori né warning; 361 test frontend su 20 file; lint pulito. Diff di 106 righe, tutte import riscritti.
**Note:** rinomine staged con `git mv`, nessun commit. Il suffisso `.component` viene tolto dal nome della cartella, come quello `.service` in `core/`.

### Verifica finale del refactoring frontend e riferimenti aggiornati (P4)

**Perché:** chiudere `PLAN-cartelle-frontend.md` con build, test e lint sul risultato finale, e togliere i percorsi vecchi dai file di configurazione e dalla documentazione.
**Cosa / Dove:** `src/SagreEventi.Web/.prettierignore` (percorso di `build-info.generated.ts`, così Prettier lo ignora ancora) e `README.md` riga 100 (stesso percorso). `CHECKLIST.md`: nuovo punto sul worktree `feature/periodi-temi`, che lavora su file già spostati. I riferimenti nel `CHANGELOG.md` storico restano invariati.
**Verifica:** build Angular, 361 test su 20 file e lint eseguiti dopo P3, senza modifiche al codice successive (si sono cambiati solo i due file di configurazione e il README).
**Note:** nessun commit. Il refactoring è in working tree (rinomine in stage).

### Regola dei confini del frontend semplificata

**Perché:** il pattern per feature (`**/<nome>`) bloccava anche i nomi di pacchetti come `home` o `login`, e la configurazione non copriva `core/` e `shared/` verso `features/`, pur dichiarato in `CLAUDE.md`.
**Cosa / Dove:** `src/SagreEventi.Web/eslint.config.js`: due blocchi, uno per `features/**` (non importa da `features/**`) e uno per `core/**` e `shared/**` (non importano da `features/**`). Rimosse le letture di `fs` e `path` e la lista delle feature.
**Verifica:** lint pulito; import di prova bloccati (da feature ad altra feature, da `core/` e da `shared/` verso `features/`) e consentiti (da feature a `core/`, da `core/` a `shared/`, pacchetto `home`).
**Note:** voce in `CHECKLIST.md` chiusa. Non ancora committato.

### Cartelle per elemento in `core/` (P1 del refactoring frontend)

**Perché:** `frontend.md` v1.1 chiede che ogni servizio o file non di componente stia nella propria cartella (`PLAN-cartelle-frontend.md`, passo P1).
**Cosa / Dove:** 20 elementi di `src/SagreEventi.Web/src/app/core/` (con i relativi spec) spostati in cartelle con il nome dell'elemento senza suffisso `.service` (es. `core/eventi-api/eventi-api.service.ts`; `build-info-generated/` per il file generato). Riscritti 103 import nei file di `app/` (inclusi `app.component.*`, `app.config.ts`, `app.routes.ts`, che restano dove sono; spostati solo i loro percorsi di import). Aggiornati `tsconfig.worker.json`, `scripts/build-info.mjs` (percorso di output) e la riga 47 di `.gitignore`. In `eslint.config.js` il pattern dei confini tra feature è limitato a `**/features/<nome>/`, perché il nome `revisione` coincideva con la cartella `core/revisione/`.
**Verifica:** build Angular senza errori, 361 test frontend su 20 file, lint pulito. Prova di lint: un import cross-feature resta bloccato, l'import da `core/` no. Diff di 206 righe, tutte import riscritti (nessun cambio di fine riga).
**Note:** rinomine staged con `git mv`, nessun commit. Il primo tentativo ha lasciato `src/` a metà per una seconda esecuzione dello script; `src/` è stato riportato a HEAD (autorizzato dall'utente) e la migrazione rifatta. `build-info.generated.ts` è ignorato da git: spostato senza `git mv`. Restano da fare P2 (`shared/`) e P3 (pagine in `features/`).

## 2026-11-08

### Piani conclusi cancellati e stato dei piani aggiornato

**Perché:** `PLAN-documentazione-sito.md` era concluso (commit e PR #52 e #53 mergiati) e `piano-commit.md` non aveva più commit da fare, salvo il GPS, che è in `PLAN-gps.md`. I punti ancora validi sono stati spostati in `CHECKLIST.md`.
**Cosa / Dove:** cancellati `docs/piani/PLAN-documentazione-sito.md` e `piano-commit.md` (non tracciati). Aggiornati `docs/piani/PLAN-gps.md` (in pausa, dopo i periodi dei temi), `docs/piani/PLAN-periodi-temi.md` (branch confermato, ripresa dal passo 1) e `CHECKLIST.md` (punti ripresi, snapshot EF scartato, nome del repository verificato).
**Verifica:** solo documentazione; nessuna build richiesta. Verificato con `git worktree list` che non restano worktree, e con `git fetch --prune` che restano solo `develop` e `main` su `origin`.
**Note:** modifica di `CHANGELOG.md` non ancora committata: andrà nel prossimo commit di documentazione, dopo conferma.

### Fonte della documentazione nella wiki

**Perché:** la documentazione di SagreEventi non sta più nel sito `sagreeventi.docs` (non più presente): la sorgente unica è la wiki `E:\Disco_E\Progetti\wiki`, cartella `docs\sagreeventi`.
**Cosa / Dove:** `CLAUDE.md` (nota «Documentazione»: sorgente, percorso e piano aggiornati alla wiki).
**Verifica:** solo documentazione; nessuna build né test richiesti. Riferimenti residui a `sagreeventi.docs` nel repository: solo nella storia (`CHANGELOG.md` del 2026-11-06) e in `docs/piani/`.
**Note:** `piano-commit.md` e `CHECKLIST.md` restano fuori dal commit, come da regola.

### Link della documentazione nel README alla wiki

**Perché:** il dominio del sito di documentazione non è ancora attivo; i link del README devono puntare alla wiki, come già la guida di deploy.
**Cosa / Dove:** `README.md`: otto link (tabella «Documentazione» e riga «Moderazione») da `http://docs-sagre-eventi.aepserver.it/<pagina>` a `http://wiki.aepserver.it/sagreeventi/<pagina>`. Stesso nome di pagina.
**Verifica:** solo documentazione; nessun riferimento residuo al vecchio dominio nel codice e nei documenti del repository, esclusa la storia.
**Note:** le pagine della wiki vanno verificate una per una: il percorso è stato dedotto dal nome della pagina.

### Voce account in fondo al menu in alto

**Perché:** su richiesta dell'utente, la voce di accesso o uscita non deve più essere la prima del menu a tre puntini.
**Cosa / Dove:** `src/SagreEventi.Web/src/app/app.component.ts` (computed `voci`: l'account è l'ultima voce, dopo «Informazioni») e `app.component.spec.ts` (tre test del menu al nuovo ordine).
**Verifica:** 361 test frontend, lint e build verdi.
**Note:** commit `c411e6b`, PR #42 (squash in `develop`).

### Prettier esclude il file generato delle info di build

**Perché:** `build-info.generated.ts` viene rigenerato a ogni build e non va controllato né riscritto da Prettier.
**Cosa / Dove:** `src/SagreEventi.Web/.prettierignore`, una riga in più.
**Verifica:** 361 test e build verdi.
**Note:** commit `aec3e80`, PR #42.

### Guida di deploy: nome del repository e link PWA

**Perché:** il repository è stato rinominato in `SagreEventi`; il link alla guida PWA puntava a una pagina nel repository, cancellata con la documentazione spostata nel sito.
**Cosa / Dove:** `DEPLOY.md` (comandi `curl` e `git clone` con il nuovo nome; link PWA verso la wiki `http://wiki.aepserver.it/sagreeventi/sincronizzazione-pwa`).
**Verifica:** solo documentazione.
**Note:** il link alla wiki è provvisorio, da rivedere quando il sito di documentazione sarà online. Commit `3626442`, PR #42.

### Pagine di documentazione spostate nel sito

**Perché:** le pagine vivono solo nel sito di documentazione; le copie in `docs/` rischiavano di divergere.
**Cosa / Dove:** cancellati `docs/{anti-bot,api,architettura,configurazione,deployment,moderazione,sincronizzazione-pwa,sviluppo}.md` e tre screenshot in `docs/screenshots/`. Restano in `docs/` solo i piani.
**Verifica:** nessun riferimento residuo ai file cancellati, fuori dal changelog.
**Note:** commit `525988e`, PR #42. Il `README.md` linka ancora il dominio del sito, non ancora attivo: da sistemare.

### Riga di `CLAUDE.md` sulla documentazione e regole in versione 3.31

**Perché:** la riga sulla sorgente della documentazione deve essere vera; le regole del progetto vanno allineate al template (revisione 2026-11-06).
**Cosa / Dove:** `CLAUDE.md` (sezione «Note per Claude»: il README linka il sito, `DEPLOY.md` la wiki); `.claude/rules/core.md` (solo la riga di versione, 3.31).
**Verifica:** solo testo.
**Note:** commit `7c87f11` e `0eaf4f5`, PR #42. In `CLAUDE.md` la voce «Integrazione GitHub approvata» è ora «PR sì, push sì, tag no, rilasci no (2026-11-08)».

### Eventi con indirizzo e coordinate (backend GPS, passo A1)

**Perché:** la mappa e il filtro per distanza richiedono una posizione per evento; è il primo passo del piano GPS.
**Cosa / Dove:** `EventoModel.cs`, `Evento.cs`, `EventoMappings.cs`, `EfCoreEventiService.cs`, `EventoValidator.cs` (indirizzo facoltativo senza caratteri di controllo; latitudine e longitudine sempre in coppia, al massimo 6 decimali); `AppDbContext.cs` e snapshot EF (tre colonne nullabili); migrazione `AddPosizioneEventi`; test in `EventoMappingsTests.cs`, `EventoValidatorPosizioneTests.cs` e `PosizioneEventiTests.cs`. Il DTO pubblico mostra la posizione solo per gli eventi approvati.
**Verifica:** backend 386 test superati, build senza warning.
**Note:** commit `44c7888`, PR #44 (squash in `develop`). Il frontend (passi A2–A4 e B1–B4) non è ancora sviluppato. La migrazione non è ancora applicata a un database reale.

### Merge in `develop` e `main`

**Perché:** chiusura delle PR del 2026-11-08.
**Cosa / Dove:** PR #42 (squash in `develop`, `b2e3fe1`), PR #43 (`develop` → `main` con merge commit, `322b43d`), PR #44 (squash in `develop`, `efeeeb0`).
**Verifica:** esito delle PR su GitHub.
**Note:** la sincronizzazione `main` → `develop` non è stata fatta, per scelta dell'utente. Il `develop` locale della cartella principale è indietro: le sue modifiche non committate vanno riallineate a parte.

## 2026-11-06

### Voce account spostata in fondo al menu in alto

**Perché:** nel menu a tre puntini della barra in alto la prima voce era l'account (`Esci (email)` o `Accedi`); su richiesta dell'utente va in ultima posizione.
**Cosa / Dove:**
- `src/SagreEventi.Web/src/app/app.component.ts`: nel computed `voci` l'account è l'ultima voce, dopo `Informazioni`; ordine di "Le mie" e "Gestione" invariato.
- `src/SagreEventi.Web/src/app/app.component.spec.ts`: tre test del menu aggiornati al nuovo ordine (anonimo: `Informazioni`, `Accedi`; moderatore: `Gestione (2)`, `Informazioni`, `Accedi`; con "Le mie": `Le mie`, `Gestione`, `Informazioni`, `Accedi`).
**Verifica:** `npm run build` completato senza errori né warning; `npm test` 20 file e 361 test verdi (prima della modifica dello spec, 3 test fallivano per l'ordine atteso vecchio).
**Note:** modifica solo di ordine, nessun cambio di comportamento o di etichette.

### Piano della documentazione allineato al nuovo nome

**Perché:** `docs/piani/PLAN-documentazione-sito.md` aveva ancora il nome vecchio nei percorsi e il punto 5 risultava aperto, anche se il nome del repository è stato sistemato.
**Cosa / Dove:** `docs/piani/PLAN-documentazione-sito.md`: percorsi aggiornati a `E:\Disco_E\Progetti\sagreeventi`; punto 5 (nome del repository) segnato come risolto.
**Verifica:** solo Markdown, nessun codice toccato.

### Riferimenti al repository rinominato in SagreEventi

**Perché:** il repository su GitHub è stato rinominato in `AngeloDotNet/SagreEventi` (punto aperto in `CHECKLIST.md`); i link nel codice e nella documentazione puntavano ancora a `AngeloDotNet/SagreEventi.SQLServer`.
**Cosa / Dove:**
- `README.md`: comandi di clone e cartella (righe 63-64).
- `DEPLOY.md`: URL `curl` di `docker-compose.yml` e `.env.example` (righe 77-78), comando di clone e percorso (righe 84-85).
- `src/SagreEventi.Web/src/app/features/informazioni/informazioni.component.ts`: link del repository mostrato nella pagina Informazioni.
- Non toccati: `.claude/rules/` (copia del template), `.vs/` e `src/SagreEventi.Web/.angular/` (file generati), `docs/piani/PLAN-documentazione-sito.md` (piano in corso, da cancellare a conclusione). Il remote locale `origin` lo cambia l'utente con `git remote set-url`.
**Verifica:** `npm ci --ignore-scripts` (dipendenze installate dal lock file), `npm test` 20 file e 361 test verdi, `npm run build` completato senza errori né warning. Nessun test backend eseguito (modifiche solo di testo).

### Deroghe «da rivalutare» confermate

**Perché:** rivalutazione prevista in `CLAUDE.md`, decisa con l'utente una deroga alla volta.
**Cosa / Dove:** `docs/piani/PLAN-piani-da-scrivere.md` (voce C3 chiusa). Restano valide: MFA per gli admin e primo amministratore senza cambio password (admin ancora pochi), client API scritti a mano (API solo per la PWA), traduzioni (solo italiano). Nessuna modifica a `CLAUDE.md`.
**Verifica:** solo documentazione, nessun codice toccato.

### Regole del template allineate alla v3.31 e decisioni chiuse

**Perché:** il template aveva `core.md` v3.31 (progetto v3.30); chiusura delle prime decisioni aperte di `CHECKLIST.md`.
**Cosa / Dove:**
- `.claude/rules/core.md`: copiato dal template; l'unica differenza era la riga di versione (3.31, revisione 2026-11-06).
- `CHECKLIST.md`: deciso di tenere il nome `CHECKLIST.md`. Il nome del repository resta com'è (rimandato).
- `docs/piani/PLAN-xunit-v3.md`, `docs/piani/PLAN-failsafe-cache.md`: nomi dei branch `feature/xunit-v3` e `feature/cache-failsafe` confermati.
**Verifica:** solo documentazione e regole, nessun codice toccato.

### Documentazione spostata nel sito sagreeventi.docs

**Perché:** la documentazione è stata spostata nel sito Docusaurus `E:\Disco_E\Progetti\sagreeventi.docs`, che è ora l'unica sorgente delle pagine. Le copie in `docs/` del repository applicativo erano duplicate e rischiavano di divergere. Piano in `docs/piani/PLAN-documentazione-sito.md`.
**Cosa / Dove:**
- `README.md`: la tabella «Documentazione» e il link della riga «Moderazione» puntano alle pagine sul sito (`http://wiki.aepserver.it/sagreeventi`; a quella data il dominio del sito era `http://docs-sagre-eventi.aepserver.it`).
- `DEPLOY.md` riga 196: il link alla sincronizzazione PWA punta al sito.
- `CLAUDE.md`, «Note per Claude»: riga sulla sorgente della documentazione.
- Rimossi `docs/architettura.md`, `docs/moderazione.md`, `docs/anti-bot.md`, `docs/api.md`, `docs/sviluppo.md`, `docs/configurazione.md`, `docs/deployment.md`, `docs/sincronizzazione-pwa.md` e `docs/screenshots/` (3 PNG, identici a quelli del sito). `docs/piani/` resta.
- `CHECKLIST.md`: punto sul nome del repository, rinominato su GitHub in `AngeloDotNet/SagreEventi`.
- Registro del sito in `~/.claude/kit-progetti.json` (fuori dal repository), come richiede `/kit:aggiorna-docs`.

**Verifica:** diff di ogni pagina prima della cancellazione (solo front matter e link), screenshot confrontati byte per byte, nessun riferimento residuo a `docs/` o agli screenshot nel repository applicativo. Nel sito: `npm run typecheck` senza errori, `npm test` 5/5, `npm run build` riuscita con `onBrokenLinks: 'throw'`. Nessuna build né test dell'applicazione, perché il repository cambia solo Markdown.
**Note:** le cancellazioni sono nell'albero di lavoro, non committate: il commit è a cura dell'utente su conferma. Il sito non è ancora stato verificato online (dominio da attivare). Il `README.md` del sito, riga 32, descrive ancora il sito come «copia» di `docs/` del repository: da correggere, con un passo a parte.

### Documentazione: versione e data di rilascio nel README, piano dei commit aggiornato

**Perché:** la pagina Informazioni e il file di build info sono nuovi e il README non li descriveva. Il piano `PLAN-info-versione.md` è concluso e lo stato dei commit va registrato in `piano-commit.md`.

**Cosa / Dove:**
- `README.md`: una voce in «Funzionalità» per la pagina `/informazioni`; nella sezione «Eseguire in locale» una nota su `scripts/build-info.mjs` che genera `build-info.generated.ts` prima di `npm start` e `npm run build`.
- `piano-commit.md`: voce per il lavoro su versione e data di rilascio, ancora da committare, con l'elenco dei file.
- `docs/piani/PLAN-info-versione.md`: cancellato, con piano concluso (step 1-3 completati).

**Verifica:** solo documentazione, nessun codice toccato. Nessun test eseguito in questo passo.

### Pagina Informazioni: versione e data di rilascio su due righe

**Perché:** richiesta dell'utente. «Compilata» descrive la build, non il rilascio: con «Data di rilascio» la frase è più chiara a chi legge la pagina, e su due righe si legge meglio.

**Cosa / Dove:**
- `features/informazioni/informazioni.component.html`: la sezione «Versione» mostra le due righe in un solo paragrafo (`<br />`, nessuna riga vuota): «**Versione:** 1.0.0» e «**Data di rilascio:** 06/11/2026». Lo spazio tra etichetta e valore è `&nbsp;`, perché Angular elimina gli spazi che stanno solo tra due tag. Il dato resta `BUILD_INFO.buildDate` (data di build, invariata).

**Verifica:** `ng test` sul solo `informazioni` (2 test verdi).

**Note:** se la data di build non coincide con il rilascio (build successiva al rilascio), la frase mostrerà la data di build. Da rivedere se i due momenti si separano.

### Versione e data di build nella pagina Informazioni (step 2 di `PLAN-info-versione.md`)

**Perché:** richiesta dell'utente: mostrare la versione dell'app e la data di build nella pagina Informazioni.

**Cosa / Dove:**
- `features/informazioni/informazioni.component.html`: nuovo blocco «Versione» con versione e data di build (`data-testid` `versione` e `data-build`).
- `features/informazioni/informazioni.component.ts`: espone `versione` e `dataBuild` da `BUILD_INFO`.
- `features/informazioni/informazioni.component.spec.ts` (nuovo): versione mostrata dal build info; data nel formato `dd/mm/yyyy`, senza orario.

**Verifica:** `npm test` 361 test su 20 file, tutti verdi (incluso il nuovo spec); `npx eslint` sulla cartella senza errori; `npm run build` in produzione senza warning.

**Note:** Prettier segnala la cartella `informazioni` (anche i file originali): il progetto usa 2 spazi mentre `.editorconfig` chiede 4. Non riformattato di iniziativa, come da `CLAUDE.md` (Prettier non imposto). Il test usa `data-testid` perché il testo della versione non ha un ruolo accessibile di riferimento (`frontend.md` §10 lo ammette come ultima scelta).

### Versione e data di build: generazione del file (step 1 di `PLAN-info-versione.md`)

**Perché:** la pagina Informazioni deve mostrare la versione dell'app e la data di build, senza chiamate al server. Il piano è in `docs/piani/PLAN-info-versione.md`.

**Cosa / Dove:**
- `src/SagreEventi.Web/scripts/build-info.mjs` (nuovo): legge `version` da `package.json` e scrive `src/app/core/build-info.generated.ts` con la data di build in formato `gg/mm/aaaa`, nel fuso `Europe/Rome`.
- `src/SagreEventi.Web/package.json`: hook `prestart`, `prebuild`, `prewatch`, `pretest`, `pretest:coverage` che lanciano lo script.
- `.gitignore`: esclusa `src/SagreEventi.Web/src/app/core/build-info.generated.ts` (il file si rigenera a ogni build).
- `src/SagreEventi.Web/.prettierignore`: stesso file escluso dal controllo Prettier.

**Verifica:** `npm ci --ignore-scripts` (dipendenze installate da zero, `node_modules` era assente), poi `npm run build` in produzione: esito 0, nessun warning, file generato con `version: "1.0.0"` e `buildDate: "06/11/2026"`. Dopo il build di prova il file è risultato escluso da Git (`git check-ignore`).

**Note:** `npm audit` ha segnalato vulnerabilità nelle dipendenze installate: non le ho corrette in questo step, da esaminare a parte (`core.md` §3). Il file è in formato con indentazione a 2 spazi come l'originale: il `package.json` è stato riscritto solo con le 5 righe nuove degli hook.

### Deploy in produzione da `main` (fa47d29): API e web aggiornate insieme

**Perché:** pubblicare in produzione le modifiche di `develop` e `main` del 2026-11-06: email di moderazione, anti-bot, tabella `StatiModerazione`, regole e documentazione divisa.

**Cosa / Dove:**
- Prerequisiti verificati prima del deploy (dichiarati dall'utente): il `.env` di produzione ha `Altcha__HmacKey`, `App__PublicBaseUrl` e `Smtp__Host`, `Smtp__Port`, `Smtp__Security`; in `Eventi.Stato` ci sono solo i valori 0, 1 e 2.
- Migrazione applicata all'avvio dell'API, con `Database:MigraAllAvvio`: `AddStatiModerazione` (tabella `StatiModerazione` e chiave esterna su `Eventi.Stato`). Backup del database eseguito prima del deploy (confermato dall'utente).
- Immagini API e web pubblicate dalla CI su push di `main` e aggiornate insieme, come da `DEPLOY.md`.
- Il GPS, lo splash screen e il titolo iOS non sono inclusi.

**Verifica:** deploy dichiarato completato dall'utente. Non sono stati controllati dal repository: la CI di `main`, i log di avvio del container API, la lettura di `GetEventi` dal browser. Da confermare: vedi le note.

**Note / da confermare:**
- Esito della migrazione `AddStatiModerazione` sul database di produzione: **confermato** dall'utente. La tabella `StatiModerazione` contiene `0 InAttesa`, `1 Approvato`, `2 Rifiutato`, cioè i valori dell'enum.
- Avvio dell'API e della pagina web dopo l'aggiornamento: **confermato** dall'utente.
- Primo invio delle email di moderazione: **nessuna mail, comportamento atteso e chiuso il 2026-11-06**. L'unica segnalazione in database ha `Stato = 1` (Approvato): l'avviso conta solo le segnalazioni `InAttesa` (`Stato = 0`) non ancora notificate (`EfCoreEventiService.GetNotificaModerazioneAsync`), quindi non parte.
- Backup del database prima del deploy: **confermato** dall'utente.

### Chiusura della giornata: regole, stati e README mergiati in develop e main

**Perché:** richiesta dell'utente di salvare lo stato a fine giornata, dopo i merge delle PR di regole, stati e README.

**Cosa / Dove:**
- PR mergiate: `#33` (regole allineate al template, squash `00f0079`), `#34` (tabella `StatiModerazione`, squash `b445023`), `#36` (README diviso in `docs/`, squash `fa4b11b`) e `#37` (`develop` → `main`, `fa47d29`). Verificato sul remoto che il contenuto di `develop` e `main` coincide con i branch.
- `develop` e `main` locali allineati al remoto, senza toccare i file di lavoro (`reset --mixed` su `origin/develop`, con il confronto dello stato prima e dopo).
- Branch e worktree locali cancellati: `bugfix/allineamento-regole-template`, `feature/stati-moderazione`, `feature/readme-in-docs` (con i worktree `wt-regole`, `wt-stati`, `wt-readme`). Il branch remoto `feature/readme-in-docs` lo cancella l'utente.
- `piano-commit.md`: stato aggiornato (sezione «Stato alla fine della giornata del 2026-11-06»). `CHECKLIST.md`: punti da verificare e da decidere. `docs/piani/PLAN-allineamento-regole-template.md`: passi 0-8 chiusi, R5 e R6 aperti.

**Verifica:** nessun codice modificato in questa voce, solo documenti e stato git. Le verifiche dei singoli commit sono nelle voci precedenti di oggi (build backend 0 avvisi, test backend superati, frontend build e lint puliti).

**Note / da fare:** restano 40c, splash screen, GPS, e il commit finale del changelog con R5 e R6 (vedi `piano-commit.md`). Il lavoro non committato nell'albero principale è di 23 voci.

### Regole allineate al template: core, security, docker, git, frontend e CLAUDE.md (passi 2-6)

**Perché:** completare l'allineamento delle regole al template `claude-config` (vedi `docs/piani/PLAN-allineamento-regole-template.md`).

**Cosa / Dove:**
- `.claude/rules/core.md`, `security.md`, `docker.md`, `git.md`, `frontend.md`: copiati dal template (identici).
- `CHECKLIST.md` (rinominato da `PUNTI-APERTI.md`, contenuto invariato): D3. Rimandi aggiornati in `CLAUDE.md`, `piano-commit.md`, `docs/piani/PLAN-piani-da-scrivere.md`, `docs/piani/PLAN-trace-id.md`. Restano nel changelog le voci storiche.
- `CHANGELOG.md`: formato del template (D2). Un titolo `## AAAA-MM-GG` per giorno e una sottosezione `### titolo` per intervento; contenuto delle voci invariato (161 voci convertite, verificato il conteggio).
- `CLAUDE.md`: riga «Mock EF nei test unitari» (default: no); sezione «Lavoro da pianificare» con i MUST del template non rispettati (D5); sezione «Eccezioni alle regole globali» con la riga GitHub «PR no, push no, tag no, rilasci no» (D6).

**Verifica:** confronto con il template: tutti i file di `.claude/rules/` e `.claude/rules-optional/` del progetto sono uguali al template. Nel codice verificati i MUST: `Cache-Control: no-store` solo su un endpoint, `Server` non disattivato, nessuna configurazione di `IterationCount`, nessun `pageSize` massimo trovato, nessun utente DDL separato, `SECURITY.md` e runbook assenti. Build: vedi passo 7 nel piano.

**Note:** le voci della checklist che il template marca con `▲` restano come testo (D4). Il piano di allineamento è ancora aperto fino al commit.

### Regole allineate al template: moduli backend (passo 1)

**Perché:** richiesta dell'utente di aggiornare le regole di `.claude/` confrontandole con il template `claude-config` (v1.9.0; `core.md` v3.30 contro v3.20 del progetto). Piano in `docs/piani/PLAN-allineamento-regole-template.md`.

**Cosa / Dove:** copiati dal template `backend.md`, `backend-architecture.md`, `backend-app.md` (in `.claude/rules/`) e `backend-email.md`, `backend-infra.md`, `feature-workflow.md` (in `.claude/rules-optional/`). Correggono i riferimenti di sezione (per esempio `backend-architecture.md §2b`, non più `backend.md §2b`) e aggiungono le regole nuove del template (`async void`, `no-store`, fusi IANA, utente DDL per le migrazioni, `pageSize` con minimo, mock EF opzionale).

**Decisioni prese il 2026-11-06:** D1 allinea tutto; D2 changelog nel formato del template (da applicare nel passo 2); D3 `CHECKLIST.md` al posto di `PUNTI-APERTI.md` (passo 2); D4 le marcature `▲` restano; D5 i MUST nuovi non rispettati si annotano in `CLAUDE.md` (passo 6); D6 riga GitHub: no a tutto (passo 6).

**Verifica:** confronto byte per byte con il template: i sei file sono uguali. Nessun riferimento di sezione errato residuo in `backend-architecture.md`, `backend-app.md` e nei moduli opzionali. Nessuna build: modifica solo di regole Markdown, la build si verifica al passo 7.

**Note:** gli altri file (`core.md`, `security.md`, `docker.md`, `git.md`, `frontend.md`) restano sulla versione precedente fino ai passi 2-5, in attesa del «vai».


## 2026-11-03

### Splash screen della PWA più curato (loader di avvio e sfondo Android)

**Perché:** richiesta dell'utente: lo splash era quello generato dal browser (sfondo grigio con l'icona bordeaux staccata) e, tra splash e app, restava un lampo di pagina vuota perché `<app-root>` era vuoto.

**Cosa / Dove:**
- `src/SagreEventi.Web/public/manifest.webmanifest`: `background_color` da `#f4f5f7` a `#99213f` (come `theme_color`); le icone esistenti hanno già il fondo bordeaux, quindi si fondono e restano le bandierine. Nessun PNG rigenerato.
- `src/SagreEventi.Web/src/index.html`: dentro `<app-root>` un loader (bandierine in SVG inline, nome «Sagre & Eventi», barra indeterminata, testo «Caricamento in corso» per gli screen reader) che Angular sostituisce all'avvio. Script e stili inline spostati fuori.
- `src/SagreEventi.Web/src/loader.css` (nuovo, aggiunto agli `styles` di `angular.json`): stili e animazioni del loader (comparsa a cascata, oscillazione ±3°, barra che scorre); `prefers-reduced-motion` rispettato; resta bordeaux in ogni tema per continuare lo splash nativo; colori come variabili CSS.
- `src/SagreEventi.Web/public/theme-init.js` (nuovo): lo script che applica il tema prima del primo render, identico a quello che stava in `index.html`; caricato in modo sincrono nell'`<head>` e già coperto dal service worker (`/*.js`).
- `src/SagreEventi.Web/angular.json`: `src/loader.css` tra gli `styles`.

**Verifica:** `npm ci`, `npm run build` senza warning, `npm run lint` pulito; loader presente (con il CSS critico inlinato) in `dist/.../index.html` e `theme-init.js` nel manifest del service worker. Prova a vista nel browser col throttling di rete, tema chiaro e scuro e `prefers-reduced-motion`: ok (utente). Nessun unit test nuovo (solo markup, CSS e asset statici).

**Note / Da fare:**
- Non provato su un telefono reale: lo splash nativo di Android si aggiorna solo dopo aver reinstallato la PWA (voce in `PUNTI-APERTI.md`). Se le bandierine, un po' sopra il centro dell'icona `any`, sembrassero decentrate, si ridisegna solo quell'icona.
- Prima provato un `<link>` a un file in `public/`: dava un warning di build (l'inlining del CSS critico non vede i file di `public/`), per questo il CSS passa dagli `styles`.
- Possibile estensione rimandata: immagini di startup per iOS (`apple-touch-startup-image`), in `PUNTI-APERTI.md`.
- Per la CSP (`PLAN-security-headers.md`): il CSS critico inlinato da Angular e l'`onload` sul link degli stili esistevano già, il loader non aggiunge blocchi inline propri.
- Modifiche non committate, non ancora in `piano-commit.md`. Piano `PLAN-splash-screen.md` concluso e cancellato.


### `npm start` apre il browser e `short_name` allineato

**Perché:** due modifiche locali rimaste fuori da ogni commit numerato: comodità in sviluppo e nome breve della PWA più leggibile sotto l'icona.

**Cosa / Dove:** `src/SagreEventi.Web/package.json` (`start` lancia l'Angular CLI con `node` e `--open`); `src/SagreEventi.Web/public/manifest.webmanifest` (`short_name` «Sagre & Eventi», uguale a `name`, al posto di «Sagre»). Commit `692eba1`, pubblicato con la PR #31 (squash `a8e991b`) e la MR #32 (`f610826`). `README.md`: nota che `npm start` apre il browser.

**Verifica:** `npm ci`, lint pulito, build ok, manifest JSON valido.

**Note:** allineato anche `apple-mobile-web-app-title` in `src/SagreEventi.Web/src/index.html` («Sagre & Eventi», non ancora committato: punto 40c di `piano-commit.md`).


## 2026-11-02

### Piano `PLAN-periodi-temi.md` (periodi dei temi configurabili)

**Perché:** richiesta dell'utente: gestire da database, in area admin, i periodi dei temi stagionali (oggi costanti in `theme.service.ts`).

**Cosa / Dove:** nuovo `docs/piani/PLAN-periodi-temi.md`. Decisioni: Pasqua come regola configurabile (giorni prima e dopo, con avviso che le date si ricalcolano da sole); un solo periodo condiviso per Natale e Natale scuro (quattro periodi, cinque temi); lettura pubblica, scrittura solo `SoloAdmin`; fallback ai valori predefiniti nel frontend.

**Decisioni successive (stesso giorno):** scheda «Temi» in «Gestione» (solo Admin, come «Utenti»); interruttore «Attivo» per periodo; cache FusionCache L1 come per gli eventi; il branch si crea dopo aver committato le modifiche in sospeso.

**Valori iniziali (deciso dopo):** Halloween 24–31 ottobre (al posto di 15 ottobre – 2 novembre); gli altri periodi invariati; tutti attivi. Riportato nel piano e in `PUNTI-APERTI.md`.

**Ordine (deciso dopo):** i temi vengono prima del GPS; la migrazione `AddPosizioneEventi` (già nell'albero, non committata) andrà rigenerata dopo quella dei temi, con lo snapshot. Aggiornati `PUNTI-APERTI.md` e il piano.

**Allineamento dei documenti:** `PUNTI-APERTI.md` (nuova sezione «Periodi dei temi», voce nell'ordine di esecuzione e promemoria sulla riga «Cache» di `CLAUDE.md`), `piano-commit.md` (ordine deciso: prima il lavoro in sospeso; GPS non numerato elencato) e `docs/piani/PLAN-periodi-temi.md` (decisioni chiuse).

**Note:** solo documentazione, nessun codice toccato né build. Resta aperto il branch (`feature/periodi-temi`, dopo la fase 0). Piano e documenti non committati.


### Piani `PLAN-*.md` spostati in `docs/piani/`

**Perché:** richiesta dell'utente: tenere pulita la root.

**Cosa / Dove:** gli 11 file `PLAN-*.md` spostati con `git mv` dalla root a `docs/piani/` (nomi invariati, quindi i riferimenti per nome in `PUNTI-APERTI.md`, `piano-commit.md` e nei piani restano validi); aggiornata la convenzione in `CLAUDE.md` (riga sui piani e «Note per Claude»); `piano-commit.md` (nuovo punto 6e per il commit dello spostamento, note sui `PLAN-*.md`) e `PUNTI-APERTI.md` (percorso dei piani).

**Note:** i vecchi riferimenti in questo file restano storici. Nessun codice toccato, nessuna build. Spostamento non committato (rinomine in stage).


### Commit in `develop` e `main`, repository locale riallineato

**Perché:** richiesta dell'utente: svuotare il lavoro in sospeso a blocchi di cinque commit, con i branch giusti, e rimettere in ordine il repository locale.

**Cosa:** committati in locale, pubblicati dall'utente con PR in squash verso `develop` e poi `develop` → `main` (PR #14-#18, #21-#23, #25, #24 su `main`): A (`#` nelle istruzioni di `Altcha__HmacKey` in `deploy/.env.example`), 19 (riga «Rilascio» di `DEPLOY.md`), 20 (azioni GitHub aggiornate per Node 24), 22 (filtro periodo: «Tutti» al posto di «In programma» e «Anche terminati»), 36 (`since` arrotondato al minuto nella chiave di cache), 23-24 (link nella descrizione con test), 25-26 («Gestione» nel menu ⋮ con badge, test; oggetto del 25 riscritto a 65 caratteri), 27-28 (sincronizzazione automatica con test), e 6b, 6c, 6d (`CLAUDE.md`, regole in `.claude/`, undici `PLAN-*.md`). Repository locale: `git reset --mixed origin/develop` sull'albero principale, ora su `develop`; `develop` e `main` locali portati al remoto; cancellati i branch locali del lavoro (dopo verifica che il contenuto è in `develop`) e, a cura dell'utente, quelli remoti. In `git status` restano 91 voci (46 modificati, 44 nuovi, 1 cancellato), tutto lavoro ancora da committare. Eseguito in worktree temporanei da `origin/develop`, uno per branch.

**Dove:** nessun file di codice modificato nell'albero principale (i 121 file modificati o nuovi hanno lo stesso hash SHA-256 prima e dopo il reset); aggiornati `piano-commit.md`, `PUNTI-APERTI.md` e questo file. Memoria di sessione aggiornata.

**Verifica:** per ogni commit di codice, build e test nel worktree: backend 222 test (commit 36), frontend 325 (22 e 25), 331 (26), 325 (27), 333 (28), 345 (24); build senza avvisi. Il lint non è stato eseguito perché ESLint arriva col commit 40; `gitleaks` non installato (scansione per parole chiave sui piani, nessun segreto); i tag delle azioni GitHub (commit 20) non sono stati verificati e la CI non è eseguibile da qui.

**Note / da fare:** restano 17 commit numerati (29-35 email di moderazione, 37-41 conformità alle regole, 42-44 `StatiModerazione`, 45-46 README ridotto in `docs/`), il CHANGELOG (un commit o uno per voce, da decidere) e il GPS A1; per sbloccare il GPS bastano forse 32, 42 e 43, da verificare sul codice. Dopo il merge in `main` controllare che i due avvisi di `build-push.yml` spariscano. La PR di Dependabot per npm è ancora aperta sul remoto.


## 2026-11-01

### Pulizia: cancellati `docs/DEPLOY.md.bak` e `PLAN-readme-docs.md`; commit 45-46 in `piano-commit.md`

**Perché:** richiesta dell'utente: eliminare i file non più necessari e registrare il commit del nuovo README.

**Cosa:** cancellati `docs/DEPLOY.md.bak` (copia storica, tracciata in git) e `PLAN-readme-docs.md` (piano concluso, mai committato). Gli altri `PLAN-*.md` restano: hanno passi aperti. In `piano-commit.md` aggiunti il punto 45 (`docs(readme)`, da fare dopo i commit che toccano il README) e il 46 (rimozione del `.bak`); aggiornate le note.

**Dove:** `piano-commit.md`, `CHANGELOG.md`.

**Verifica:** solo documentazione, nessuna build o test. Nessun commit fatto.


### README ridotto, dettagli spostati in `docs/`

**Perché:** richiesta dell'utente: il README era troppo lungo (306 righe).

**Cosa:** le sezioni tecniche sono passate in file tematici in `docs/` (testo invariato, percorsi e link interni corretti); il README (126 righe) tiene panoramica, funzionalità, «Per iniziare», risorse, contributi e licenza, più una sezione «Documentazione» con i link. Il rimando «vedi README» di `DEPLOY.md` punta ora a `docs/sincronizzazione-pwa.md`.

**Dove:** nuovi `docs/architettura.md`, `docs/moderazione.md`, `docs/anti-bot.md`, `docs/sincronizzazione-pwa.md`, `docs/api.md`, `docs/sviluppo.md`, `docs/configurazione.md`, `docs/deployment.md`; modificati `README.md`, `DEPLOY.md`, `CHANGELOG.md`; piano in `PLAN-readme-docs.md`.

**Verifica:** solo documentazione, nessuna build o test. Controllati con una scansione di shell tutti i link e le ancore di README e `docs/` (nessuno rotto) e l'esistenza degli screenshot. Nessun commit fatto.

**Note:** `PLAN-readme-docs.md` si cancella a lavoro concluso; i file nuovi e le modifiche sono da aggiungere a `piano-commit.md` (commit `docs`).


### Piano dei commit: il punto 6d include tutti i `PLAN-*.md`

**Perché:** richiesta dell'utente: committare ogni piano presente nella root, anche se a lavoro concluso verrà cancellato, così la storia dei piani resta nel repository.

**Cosa:** in `piano-commit.md` il punto 6d (`docs(plan)`) passa da nove a undici file, con l'aggiunta di `PLAN-gps.md` e `PLAN-piani-da-scrivere.md`. Prima del commit si rieseguono la ricerca dei `PLAN-*.md` e `git status`, per includere i piani nati nel frattempo. `PLAN-piani-da-scrivere.md` è un registro e si cancella quando le sue voci sono tutte spuntate o tolte. Corretta anche la nota in fondo al file, che diceva che non esistevano `PLAN-*.md`.

**Dove:** `piano-commit.md`, `CHANGELOG.md`.

**Verifica:** solo documentazione, nessuna build o test. Nessun commit fatto.


### Registro dei piani da scrivere e delle attività senza piano

**Perché:** richiesta dell'utente, per non perdere niente.

**Cosa:** nuovo `PLAN-piani-da-scrivere.md`, un registro (non un piano di lavoro) con: cinque piani da scrivere (`IExceptionHandler`, migrazione a `OperationResults`, Options come `record`, colori con design token, Playwright e axe), sei attività senza piano (aggiornamento maggiore di Angular e PrimeNG, Prettier, campanella delle notifiche, Clean Architecture, progetto `IntegrationTests`, punti aperti dell'anti-bot), tre temi condizionati (più repliche, limite su `GetEventi`, deroghe da rivalutare) e un promemoria di ciò che è già annotato in altri piani. Ogni voce riporta i dettagli già emersi (decisioni passate, versioni verificate, coordinamenti). `PUNTI-APERTI.md` rimanda al nuovo file.

**Dove:** `PLAN-piani-da-scrivere.md` (nuovo), `PUNTI-APERTI.md`, `CHANGELOG.md`.

**Verifica:** solo documentazione, nessuna build o test. Nessun commit fatto.

**Note / da fare:** quando di una voce si scrive il piano, si spunta e si indica il file; quando l'attività si conclude, la voce si toglie. Il file andrà aggiunto al commit `docs(plan)` (6d di `piano-commit.md`) se l'utente lo vorrà committare.


### Piano del GPS completato nelle decisioni e ordine di esecuzione dei piani

**Perché:** valutazione dei punti aperti richiesta dall'utente, senza sviluppi né commit.

**Cosa:** `PLAN-gps.md` non ha più decisioni aperte (ricerca indirizzi diretta dal browser con il passaggio dal server annotato come possibile evoluzione, chi inserisce indirizzo e coordinate, filtro «vicino a me» lato client con B3 chiuso, commit dopo quelli in sospeso su `feature/gps-eventi`, condizioni d'uso e costi di Nominatim, tile OSM e Leaflet verificate sulle pagine ufficiali) e ha una fase C finale: valutazione di un'app React Native, solo valutazione. `PLAN-security-headers.md` riceve le quattro regole che servono a mappa e GPS (`img-src` per le tile OSM, `connect-src` per Nominatim, `Permissions-Policy: geolocation=(self)`, `Referrer-Policy` diverso da `no-referrer`). `PUNTI-APERTI.md` riceve la sezione «Ordine di esecuzione proposto» (fasi 0-6) e il riepilogo del GPS.

**Dove:** `PLAN-gps.md`, `PLAN-security-headers.md`, `PUNTI-APERTI.md`, `CHANGELOG.md`.

**Verifica:** solo documentazione, nessuna build o test. Nessun commit fatto.

**Note / da fare:** l'ordine è una proposta da confermare fase per fase. Piani ancora da scrivere: `IExceptionHandler`, migrazione a `OperationResults`, Options come `record`, colori con design token, Playwright e axe.


### GPS, passo A1: indirizzo e coordinate degli eventi (backend)

**Perché:** `PLAN-gps.md`, fase A (posizione degli eventi su mappa). Questo passo prepara solo dati e contratto; mappa, ricerca dell'indirizzo e form arrivano con A2 e A3.

**Cosa:** `Evento` e `EventoModel` hanno tre campi facoltativi: `Indirizzo` (massimo 200 caratteri), `Latitudine` e `Longitudine` (`decimal(9,6)`). Regole di validazione: indirizzo senza caratteri di controllo (a capo, tabulazioni, `\0`), latitudine tra −90 e 90, longitudine tra −180 e 180, al massimo 6 decimali, e le due coordinate vanno indicate insieme o per niente. L'indirizzo viene ripulito dagli spazi e, se vuoto, salvato come `NULL` (`EventoMappings.NormalizzaIndirizzo`). La lettura pubblica mostra la posizione solo per gli eventi approvati: la «lapide» di un evento ritirato non la rivela. `StessoContenuto` confronta anche i nuovi campi, così un utente senza permessi che prova a cambiare coordinate o indirizzo di un evento esistente riceve 403 e non una modifica ignorata in silenzio; il reinvio identico resta 200. Gli eventi esistenti restano senza posizione.

**Dove:** `Models/Entities/Evento.cs`, `SagreEventi.Shared/Models/EventoModel.cs`, `Models/Mapping/EventoMappings.cs`, `Validation/EventoValidator.cs`, `Models/Services/Infrastructure/AppDbContext.cs`, `Models/Services/Application/EfCoreEventiService.cs`, migrazione `20261101184810_AddPosizioneEventi` (`.cs`, `.Designer.cs`), `AppDbContextModelSnapshot.cs`; test nuovi `EventoValidatorPosizioneTests.cs` e `PosizioneEventiTests.cs`, test aggiunti in `EventoMappingsTests.cs`; `PLAN-gps.md`.

**Verifica:** build senza avvisi né errori, 386 test backend ok (56 nuovi: validatore, mapping, salvataggio, visibilità pubblica, modifica non consentita agli anonimi, 16 input ostili come latitudine fuori intervallo, coordinata singola, troppi decimali, stringhe e array al posto dei numeri, overflow `1e999`, a capo e `\0` nell'indirizzo, indirizzo oltre il limite: tutti 400 senza dettagli interni e senza salvataggio). Nessun pacchetto aggiunto, quindi nessun audit nuovo. La migrazione contiene solo le tre colonne nuove (`ALTER TABLE ... ADD`, tutte `NULL`).

**Note / da fare:** la migrazione non è ancora applicata a un SQL Server reale (la applica l'app all'avvio con `Database:MigraAllAvvio`). Il frontend ignora per ora i campi nuovi (A2). Nessun commit fatto: prima va concordato il branch (`PLAN-gps.md`, decisione 4). `/security-review` previsto a fine fase (A4).


### `CLAUDE.md` riallineato dopo il secondo aggiornamento delle regole

**Perché:** richiesta dell'utente: dopo le modifiche a `backend.md`, `core.md`, `docker.md`, `security.md`, `backend-email.md` e `backend-infra.md` (diff rispetto al commit `676ab04`), verificare che tutto sia allineato.

**Cosa:** in `CLAUDE.md`: (1) «Healthcheck» non è più una deroga, perché le regole ora prevedono l'assenza di healthcheck (verificato: nessun `HEALTHCHECK` nei Dockerfile, nessun `healthcheck` né `depends_on` nei compose); (2) nuova riga «Migrazioni»: applicate all'avvio con `Database.MigrateAsync()` e flag `Database:MigraAllAvvio`, già conforme al nuovo `backend.md` §4.4; (3) riga «Email»: Mailtrap non più previsto, default Mailpit (istanza esterna, solo sviluppo e test); (4) «Gestione errori»: `OperationResults` di Minerva è ora scelta fissa, variante AppEngine sospesa; (5) nuova riga «Primo amministratore»: deroga motivata a `backend.md` §7 (Admin ed Editor creati all'avvio da `IdentitySeedHostedService`, senza cambio password obbligatorio, deciso dall'utente dopo aver valutato il lavoro necessario); (6) nota ADR: tolto l'esempio «niente healthcheck». Nessun codice toccato.

**Pulizia:** il piano `PLAN-allineamento-regole.md` (5 passi su 5 fatti) è stato cancellato a lavoro concluso, su richiesta dell'utente. Gli altri nove `PLAN-*.md` hanno passi aperti e restano. `PUNTI-APERTI.md` e `piano-commit.md` restano (servono ancora). Deciso dall'utente che i `PLAN-*.md` aperti si committano (`docs(plan)`, su conferma): registrato in `CLAUDE.md` (riga sul piano) e in `piano-commit.md` (commit 6c e 6d, non ancora fatti).

**Dove:** `CLAUDE.md`, `README.md` (sezione «Migrazioni del database»: tolto il consiglio di disattivare `Database:MigraAllAvvio` in produzione, ora le migrazioni si applicano all'avvio come da `backend.md` §4.4), `CHANGELOG.md`, `PLAN-allineamento-regole.md`.

**Verifica:** solo documentazione, nessuna build o test.

**Seconda verifica (stesso giorno):** cercato ciò che non era né nelle regole né nei piani. Trovato e deciso uno alla volta: (a) `traceId`/`X-Trace-Id` dichiarato in `CLAUDE.md` ma assente nel codice → `PLAN-trace-id.md`; (b) security headers incompleti (solo `nosniff` e HSTS sull'API, solo `nosniff` su nginx) → `PLAN-security-headers.md`; (c) CI limitata a `build-push.yml`, repository pubblico → `PLAN-ci-supply-chain.md` a fasi; (d) client TypeScript scritti a mano → deroga motivata. `CLAUDE.md` (righe «Logging», «Client API frontend», «Security headers», «CI e supply chain») e `PUNTI-APERTI.md` (sezione «Piani nati dalla revisione delle regole», healthcheck e Data Protection aggiornati) riallineati. Nessun codice toccato.

**Note / da fare:** `backend-email.md` e `backend-infra.md` hanno di nuovo una riga vuota finale: va tolta prima di committarli (`git diff --cached --check`).


### `CLAUDE.md` allineato alle regole aggiornate di `.claude/`

**Perché:** richiesta dell'utente: rileggere le regole aggiornate (in particolare i MUST di `backend.md`, come il punto 36 sulla cartella `Interfaces/`) e rivalutare ogni deroga, mantenendola o rimuovendola. Decisioni prese una alla volta con l'utente.

**Cosa:** in `CLAUDE.md`: (1) nuova riga «Struttura delle cartelle del backend»: i MUST 36, 39, 41 (e 37, 38) non sono rispettati dal codice esistente e si allineano con un piano dedicato; (2) «Moduli opzionali»: `backend-infra` incluso solo per la sezione cache; (3) «Job in background»: aggiunto `ModerazioneHostedService`, deroga al lock distribuito di `backend.md` §5b valida con una sola replica, retry implicito tramite `NotificataIl`; (4) nuova riga «Email»: MailKit dietro `IEmailSender`, nessun outbox né coda, Mailtrap non usato; (5) «Autorizzazione»: deroga motivata alla MFA per gli admin; (6) nota «Data Protection»: chiavi da persistere nel database, non su volume; (7) nota «Immagini Docker»: tag delle immagini base da fissare, immagini dell'app `:latest` nel compose come deroga a `docker.md`; (8) elenco dei moduli di regole in testa. Le altre deroghe (Clean Architecture, healthcheck, FluentValidation, `Asp.Versioning`, Swagger UI, Scrutor, traduzioni, ADR, Prettier, nome del piano) sono confermate invariate. Nessun codice toccato.

**Dove:** `CLAUDE.md`, `CHANGELOG.md`; piani nuovi `PLAN-allineamento-regole.md`, `PLAN-allineamento-backend.md`, `PLAN-data-protection.md`, `PLAN-tag-docker.md`; `piano-commit.md`. Commit `676ab04` (branch locale `chore/claude-rules`) con i 9 file di `.claude/`; `CLAUDE.md` non ancora committato (commit 6b di `piano-commit.md`, su richiesta dell'utente).

**Verifica:** solo documentazione, nessuna build o test da eseguire.

**Da fare:** eseguire i tre piani derivati, uno step alla volta con il via libera dell'utente (attenzione ai file comuni con `PLAN-failsafe-cache.md` per `AppDbContext` e le migrazioni).


### Tabella di lookup `StatiModerazione` collegata a `Eventi.Stato`

**Perché:** richiesta dell'utente: nel database `Eventi.Stato` era un `int` senza tabella collegata, quindi i valori (0, 1, 2) non erano leggibili né protetti da vincoli. Scelta l'opzione 1: l'enum resta e si aggiunge una tabella relazionata.

**Cosa:** nuova tabella `StatiModerazione` (`Id` come `StatoModerazione`, `Nome` fino a 50 caratteri) con le righe 0 `InAttesa`, 1 `Approvato`, 2 `Rifiutato`, ricavate dall'enum con `HasData`. `Eventi.Stato` diventa chiave esterna verso `StatiModerazione.Id` (`DeleteBehavior.Restrict`, con indice `IX_Eventi_Stato`). I dati esistenti non cambiano e l'enum, il JSON e le API restano identici. Nessuna proprietà di navigazione su `Evento`. Quattro test: la tabella coincide con l'enum, uno stato non valido (99) è rifiutato, i tre stati validi si salvano, uno stato in uso non si può eliminare.

**Dove:** `Models/Entities/StatoModerazioneLookup.cs` (nuovo), `Models/Services/Infrastructure/AppDbContext.cs`, migrazione `20261101162915_AddStatiModerazione` (`.cs`, `.Designer.cs`), `AppDbContextModelSnapshot.cs`, `tests/SagreEventi.Web.Server.Tests/StatiModerazioneTests.cs` (nuovo), `README.md` (regole di dominio), `piano-commit.md` (commit 42-44). Il piano `PLAN-stati-moderazione.md` è stato cancellato a lavoro concluso.

**Verifica:** build senza avvisi né errori, 330 test backend ok, nessun pacchetto vulnerabile. Lo script SQL della migrazione (`dotnet ef migrations script`) è quello atteso; la migrazione è stata applicata dall'utente su un SQL Server reale (`update-database`) senza errori: `SELECT * FROM StatiModerazione` restituisce le tre righe e `SELECT Stato, COUNT(*) FROM Eventi GROUP BY Stato` non segnala valori fuori dalla tabella, quindi lo 0 come `Id` è accettato.

**Note:** un nuovo valore dell'enum richiede una migrazione che aggiunga la riga alla tabella, altrimenti il salvataggio fallisce per la chiave esterna. La migrazione dipende da `AddNotificaModerazione` (ancora non committata): va committata dopo il commit 32. Nessun commit fatto.


### README allineato al codice e al lavoro in sospeso

**Perché:** richiesta dell'utente di avere `README.md` e `CHANGELOG.md` allineati a tutte le modifiche, committate e no, prima del push.

**Cosa:** `README.md`: filtro periodo (tutti, in corso, in arrivo; niente eventi terminati), avviso di moderazione nel modulo, «Gestione» nel menu ⋮ con il contatore, link cliccabili nelle descrizioni, sincronizzazione automatica (ritorno in primo piano e ogni 10 minuti), controllo orario degli aggiornamenti della PWA, servizi in background (scadenza e avviso email) nella tabella dell'architettura, `global.json`, `npm run lint` e `format:check`, `TreatWarningsAsErrors`, `Directory.Packages.props` e lock file NuGet (restore `--locked-mode` nel Dockerfile). `CHANGELOG.md`: controllate le voci, una per ogni intervento del piano dei commit (nessuna mancante).

**Dove:** `README.md`, `CHANGELOG.md`. Il README è nello stato finale: ogni parte va nel commit del proprio tema (vedi `piano-commit.md`).

**Verifica:** solo documentazione; ogni affermazione è stata confrontata con il codice (opzioni di `appsettings.json`, `eventi-list.component.ts`, script di `package.json`, `Directory.Build.props`, `global.json`).


### Commit locali, integrazione in develop e main

**Perché:** richiesta dell'utente di committare il lavoro in sospeso (`piano-commit.md`), per temi e con una PR senza conflitti. Issue collegate: #3, #4, #5 (chiuse).

**Cosa:** fatti i commit 3-18 del piano: anti-bot ALTCHA (backend, test, frontend, test, documentazione), riordino della barra mobile con test, avviso di moderazione nel form con test, campi data affiancati, rimozione degli healthcheck (Dockerfile, compose, `/healthz`, documentazione), controllo degli aggiornamenti della PWA con test. Riuniti in un branch lineare da `origin/develop` (la PR #9 dell'anti-bot era già in `develop` in squash): PR #11 verso `develop` e #12 verso `main`, fatte dall'utente. Commit 23 (link nella descrizione) fatto sul suo branch `feature/link-descrizione-evento`, non ancora pubblicato. Nessuna modifica al codice oltre a quella già descritta nelle voci sotto.

**Dove:** `piano-commit.md` (stato aggiornato, regole per i branch per tema), `PUNTI-APERTI.md` (anti-bot in `main`, correzione di `deploy/.env.example`, controlli dopo il deploy).

**Verifica:** su ogni commit, in una copia pulita dell'indice: backend 219 test ok (dopo la rimozione di `HealthTests`), frontend 345 test ok sul branch dei link, `ng build` ok, nessun avviso. `docker compose config` non eseguito (docker non installato).

**Note:** in produzione serve `Altcha__HmacKey` reale nel `.env` e le immagini vanno ripubblicate. Le tre righe di istruzioni di `deploy/.env.example` per Altcha sono senza `#` (correzione da fare). Restano 23 commit, dal 19 in poi.


## 2026-10-31

### OperationResults: migrazione del codice esistente rimandata a un piano dedicato

**Perché:** decisione dell'utente (opzione 2) dopo la verifica del pacchetto.

**Cosa:** `PUNTI-APERTI.md`: la voce riporta la decisione (dopo i commit, branch proprio, da coordinare con `IExceptionHandler` e con la riorganizzazione di cartelle e tipi) e il punto «Piani dedicati» passa a 7 lavori. Nessuna modifica al codice. Nota: la riga «Gestione errori» di `CLAUDE.md` dice ancora «per il codice nuovo»; va estesa quando parte il piano di migrazione.

**Verifica:** solo documentazione.


### Verifica di OperationResults (Minerva): pacchetto, namespace, licenza

**Perché:** richiesta dell'utente (attività «Adozione di `OperationResults`», passo di sola verifica). Nessuna issue collegata.

**Cosa:** ricerca su NuGet e lettura di nuspec, README e commenti XML. Esito: `OperationResultTools` e `OperationResultTools.AspNetCore.Http` 1.0.39, MIT, `net10.0`, core senza dipendenze, namespace `OperationResults` e `OperationResults.AspNetCore.Http`; repository attivo e non archiviato. `CLAUDE.md` (riga «Gestione errori») e `PUNTI-APERTI.md` aggiornati. Nessun pacchetto installato, nessuna modifica al codice.

**Verifica:** solo documentazione. Non verificati: vulnerabilità note e deprecazione (la lettura della registrazione NuGet non è andata a buon fine); da controllare al primo uso.


### Lock distribuito del job di chiusura eventi: non applicabile

**Perché:** l'utente ha chiarito che il deploy è uno solo, senza repliche; il job è già idempotente.

**Cosa:** `PUNTI-APERTI.md`: voce chiusa, con l'indicazione di riaprirla insieme agli altri temi sulle repliche (Altcha anti-replay, Data Protection, cache L1) se un giorno cambierà il deploy. Nessuna modifica al codice.

**Verifica:** solo documentazione.


### Conformità del codice: tutti gli scostamenti decisi, piano concluso

**Perché:** ultime decisioni dell'utente (opzione 1): Prettier resta un piano dedicato dopo i commit (8d); l'audit npm (passo 9) non richiede decisioni perché si risolve con l'aggiornamento maggiore di Angular, già in elenco.

**Cosa:** `PUNTI-APERTI.md`: il punto «Conformità» e quello sugli scostamenti sono chiusi; nuovo punto «Piani dedicati nati dalla conformità» con i 6 lavori da fare dopo i commit. `PLAN-conformita-deroghe.md` cancellato (concluso). Riepilogo: deroghe in `CLAUDE.md` per validazione, versionamento API, Swagger UI, registrazione dei servizi, traduzioni frontend (e nessun `.nvmrc`); piani dedicati per `IExceptionHandler`, cartelle e tipi, Options come `record`, colori, Playwright/axe, Prettier; fatta la regola ESLint sui confini tra feature.

**Verifica:** solo documentazione.


### Frontend: Playwright e axe rimandati a un piano dedicato

**Perché:** decisione dell'utente (opzione 1) sul punto 8c.

**Cosa:** `PUNTI-APERTI.md`: la voce riporta la decisione e i punti da risolvere (licenze, browser, backend di prova, CI). `PLAN-conformita-deroghe.md`: 8c spuntato. Nessuna modifica al codice.

**Verifica:** solo documentazione.


### Frontend: regola ESLint sui confini tra feature

**Perché:** decisione dell'utente (opzione 1) sul punto 8b. Prima della modifica nessuna feature importava da un'altra (0 violazioni, verificato con una ricerca).

**Cosa:** `src/SagreEventi.Web/eslint.config.js`: `no-restricted-imports` per ogni cartella di `src/app/features/*` (l'elenco si legge dal file system, quindi una feature nuova è coperta da sola): vietati gli import da `features/` e dalle altre feature, ammessi `core/` e `shared/`. `PUNTI-APERTI.md` e `PLAN-conformita-deroghe.md` aggiornati.

**Verifica:** `eslint "src/**/*.{ts,html}"` senza errori; un file di prova con un import verso un'altra feature è stato segnalato (poi cancellato), l'import verso `core/` no.

**Note — `.nvmrc` ritirato:** nel passo 8a avevo creato `.nvmrc` con `22`, ma lo strumento nvm del PC dell'utente lo legge, cerca un Node 22 che non è installato (c'è il 24.22.1) e fa fallire ogni comando `node`. File cancellato lo stesso giorno; `engines` in `package.json` era già presente. Decisione dell'utente (opzione 1): nessun `.nvmrc`, bastano `engines` e il Dockerfile (`PUNTI-APERTI.md` aggiornato).


### Frontend, colori: design token rimandati a un piano dedicato

**Perché:** decisione dell'utente (opzione 1) sul punto 7.

**Cosa:** `PUNTI-APERTI.md`: la voce riporta la decisione. `PLAN-conformita-deroghe.md`: passo 7 spuntato. Nessuna modifica al codice.

**Verifica:** solo documentazione.


### Deroga: frontend senza libreria di traduzione

**Perché:** decisione dell'utente (opzione 1) sul punto 6: l'app è solo in italiano; la libreria e l'estrazione dei testi non sono giustificate finché non serve l'inglese.

**Cosa:** `CLAUDE.md`: nuova riga «Traduzioni frontend» nella tabella «Scelte architetturali». `PUNTI-APERTI.md` e `PLAN-conformita-deroghe.md` aggiornati. Nessuna modifica al codice.

**Verifica:** solo documentazione.


### Options come `record`: conversione rimandata a un piano dedicato

**Perché:** decisione dell'utente (opzione 2) sul punto 5.

**Cosa:** `PUNTI-APERTI.md`: la voce riporta la decisione e l'avvertenza sui test che modificano le Options dopo la creazione. `PLAN-conformita-deroghe.md`: passo 5 spuntato. Nessuna modifica al codice.

**Verifica:** solo documentazione.


### Deroga: registrazione dei servizi senza Scrutor

**Perché:** decisione dell'utente (opzione 1) sul punto 4: i servizi sono pochi e le righe esplicite sono chiare e verificate dal compilatore.

**Cosa:** `CLAUDE.md`: nuova riga «Registrazione dei servizi» nella tabella «Scelte architetturali». `PUNTI-APERTI.md` e `PLAN-conformita-deroghe.md` aggiornati. Nessuna modifica al codice.

**Verifica:** solo documentazione.


### Deroga: nessuna Swagger UI in Development

**Perché:** decisione dell'utente (opzione 1) sul punto 3c: il documento OpenAPI basta ed è verificato dai test; una UI richiederebbe un pacchetto in più.

**Cosa:** `CLAUDE.md`: nuova riga «Swagger UI» nella tabella «Scelte architetturali». `PUNTI-APERTI.md` e `PLAN-conformita-deroghe.md` aggiornati (passo 3 chiuso). Nessuna modifica al codice.

**Verifica:** solo documentazione.


### Deroga: API senza versionamento

**Perché:** decisione dell'utente (opzione 1) sul punto 3b: l'API serve solo la PWA, deployata insieme al backend, quindi non ci sono client esterni da non rompere.

**Cosa:** `CLAUDE.md`: nuova riga «Versionamento API» nella tabella «Scelte architetturali». `PUNTI-APERTI.md` e `PLAN-conformita-deroghe.md` aggiornati. Nessuna modifica al codice.

**Verifica:** solo documentazione.


### API: `IExceptionHandler` globale rimandato a un piano dedicato

**Perché:** decisione dell'utente (opzione 1) sul punto 3a: un handler globale garantisce per codice che fuori da Development non escano stack trace né messaggi di eccezione.

**Cosa:** `PUNTI-APERTI.md`: la voce API riporta la decisione. `PLAN-conformita-deroghe.md`: passo 3 aperto con sotto-punti 3a (deciso), 3b e 3c. Nessuna modifica al codice.

**Verifica:** solo documentazione.


### Cartelle e tipi: riorganizzazione rimandata a un piano dedicato

**Perché:** decisione dell'utente (opzione 2) sul secondo scostamento rimandato: interfacce in `Interfaces/`, DTO in `Requests/` e `Responses/` come `record`.

**Cosa:** `PUNTI-APERTI.md`: la voce riporta la decisione (piano dedicato, dopo i commit in sospeso, branch proprio). `PLAN-conformita-deroghe.md`: passo 2 spuntato. Nessuna modifica al codice.

**Verifica:** solo documentazione.


### Deroga: validazione senza FluentValidation

**Perché:** decisione dell'utente (opzione 1) sul primo degli scostamenti rimandati dalla verifica di conformità. Il validatore attuale funziona ed è coperto dai test; un pacchetto in più per un solo validatore non serve.

**Cosa:** `CLAUDE.md`: nuova riga «Validazione» nella tabella «Scelte architetturali». `PUNTI-APERTI.md`: voce segnata come deroga. Creato `PLAN-conformita-deroghe.md` (un passo per scostamento; da cancellare a fine decisioni).

**Verifica:** solo documentazione.


### PUNTI-APERTI: xunit.v3 e IntegrationTests uniti in un solo punto

**Perché:** richiesta dell'utente. Nessuna issue collegata.

**Cosa:** `PUNTI-APERTI.md`: i punti «Progetto `IntegrationTests`» e «Migrazione a `xunit.v3`» diventano un solo punto con due passi separati (1: `xunit.v3` sul progetto esistente; 2: nuovo progetto `IntegrationTests` su SQL Server di prova, da decidere prima l'istanza).

**Verifica:** solo documentazione.


### Conformità: chiusura (passi 6 e 7)

**Perché:** chiudere il lavoro `PLAN-conformita.md`: decisione sull'uso di Prettier e registro degli scostamenti rimandati. Nessuna issue collegata.

**Cosa:** `CLAUDE.md`: Prettier configurato ma non imposto (nessuna riformattazione generale). `PUNTI-APERTI.md`: nuovo punto con gli scostamenti rimandati (validazione, cartelle e DTO, `IExceptionHandler`/versionamento/Swagger, Scrutor, Options `record`, traduzioni, colori, strumenti frontend, audit npm in sviluppo), ciascuno da valutare: gestire o segnare come deroga. Cancellati `PLAN-conformita.md` e il piano di chiusura.

**Verifica:** solo documentazione; i controlli di build e test sono nelle voci precedenti.

**Note:** le modifiche di conformità fatte (TimeProvider, classi `sealed`, commenti XML, using, expression body, `TreatWarningsAsErrors`, `Directory.Packages.props`, `global.json`, lock file NuGet, ESLint/Prettier) non sono ancora in `piano-commit.md`: da aggiungere quando si pianificano i commit.


### Conformità, passo 6 (parte 1): ESLint e Prettier nel frontend

**Perché:** `frontend.md` §2 vuole `angular-eslint` e Prettier. Piano `PLAN-conformita.md`. Nessuna issue collegata.

**Cosa:** nuove devDependencies (tutte MIT): `eslint` ^9.39.5, `typescript-eslint` ^8.72.1, `angular-eslint` ^21.4.0 (serie 21, compatibile con Angular 21), `prettier` ^3.9.10. Nuovi `eslint.config.js` (raccomandazioni TypeScript e Angular, accessibilità dei template, `no-explicit-any` come errore), `.prettierrc.json` (apici singoli, 140 colonne, fine riga automatica), `.prettierignore`; script npm `lint`, `format:check`, `format`. `CLAUDE.md`: licenza `Python-2.0` aggiunta alla lista ammessa (serve a `argparse` 2.0.1, dipendenza di ESLint). `ics.spec.ts`: il test non fa più `link = this` ma legge l'elemento da `mock.contexts` (unico errore di ESLint).

**Verifica:** `npm run lint` senza errori né avvisi, 359 test frontend ok, `tsc` senza errori, controllo licenze npm ok con la lista aggiornata.

**Note:** Prettier (`npm run format:check`) segnala 82 file su 83: il codice esistente non è formattato con Prettier; non riformattato. L'audit npm in sviluppo passa da 16 a 33 moderate (stessa `minimatch` vecchia, GHSA-g3hv-75wg-m249, anche nelle dipendenze dei nuovi strumenti); in produzione 0. Mancano ancora: regola di ESLint per i confini tra feature (`frontend.md` §2), `.nvmrc`/`engines`, Playwright.


### Frontend: rootDir esplicito nei tsconfig

**Perché:** dopo la correzione precedente, VS Code segnalava su `tsconfig.spec.json`: «The common source directory is './src'. The 'rootDir' setting must be explicitly set» (il TypeScript dell'editor è più nuovo di quello del progetto, 5.9.3, e con `outDir` vuole `rootDir`). Segnalato dall'utente. Nessuna issue collegata.

**Cosa:** `tsconfig.app.json`, `tsconfig.spec.json`, `tsconfig.worker.json`: aggiunto `"rootDir": "./src"` accanto a `outDir`.

**Verifica:** `tsc --noEmit` senza errori sui tre progetti, `ng build` ok, 359 test frontend ok. Non provato in VS Code (riavviare il server TypeScript).


### Frontend: tsconfig a riferimenti per l'editor

**Perché:** aprendo il frontend in VS Code comparivano decine di errori falsi sui test (`Cannot find name 'expect'`, `it`, `vi`, `describe`). L'editor usa `tsconfig.json`, che non ha i tipi `vitest/globals` (stanno solo in `tsconfig.spec.json`, usato da `ng test`). Esisteva già prima di questo lavoro; segnalato dall'utente. Nessuna issue collegata.

**Cosa:** `src/SagreEventi.Web/tsconfig.json`: aggiunti `"files": []` e `"references"` verso `tsconfig.app.json`, `tsconfig.spec.json` e `tsconfig.worker.json`, così l'editor sceglie la configurazione giusta per ogni file. Opzioni e `ng build`/`ng test` invariati.

**Verifica:** `tsc --noEmit` senza errori per ciascuno dei tre progetti (prima, sul `tsconfig.json` radice: 1014 errori), `ng build` ok, 359 test frontend ok. Non provato in VS Code: da riavviare il server TypeScript (comando «TypeScript: Restart TS Server»).


### Conformità, passo 5 (parte 4): lock file NuGet

**Perché:** `backend.md` §2 vuole i `packages.lock.json` committati. Piano `PLAN-conformita.md`. Nessuna issue collegata.

**Cosa:** `Directory.Build.props`: `RestorePackagesWithLockFile`; generati `src/SagreEventi.Shared/packages.lock.json`, `src/SagreEventi.Web.Server/packages.lock.json`, `tests/SagreEventi.Web.Server.Tests/packages.lock.json`; `src/SagreEventi.Web.Server/Dockerfile`: copia dei lock accanto ai `.csproj` e `dotnet restore --locked-mode`; `.github/workflows/build-push.yml`: `dotnet restore SagreEventi.sln --locked-mode`.

**Verifica:** `dotnet restore --locked-mode` in locale ok, build senza avvisi, 324 test backend ok. **Docker non provato** (non installato qui): la prima build dell'immagine e il primo run della pipeline lo confermeranno.

**Note:** quando si aggiorna un pacchetto (anche con Dependabot) il restore in modalità bloccata fallisce finché non si rigenerano i lock con `dotnet restore SagreEventi.sln --force-evaluate` e si committano. Va tenuto presente per l'audit e per gli aggiornamenti maggiori di `PUNTI-APERTI.md`. I 4 lock file vanno nel commit con `Directory.Build.props` (condiviso con altri lavori).


### Conformità, passo 5 (parte 3): global.json

**Perché:** `backend.md` §2 vuole l'SDK fissato in `global.json`. Piano `PLAN-conformita.md`. Nessuna issue collegata.

**Cosa:** nuovo `global.json` (`version` 10.0.100, `rollForward` `latestFeature`: accetta gli SDK 10.0.x più recenti, rifiuta 9 e 11); aggiunto ai «Solution Items» di `SagreEventi.sln`. Il Dockerfile e il workflow (`dotnet-version: 10.0.x`) non cambiano: restano compatibili.

**Verifica:** SDK in uso 10.0.403, build senza avvisi.

**Note:** resta da decidere solo i lock file.


### Conformità, passo 5 (parte 2): Central Package Management

**Perché:** `backend.md` §2 vuole le versioni dei pacchetti in `Directory.Packages.props`. Piano `PLAN-conformita.md`. Nessuna issue collegata.

**Cosa:** nuovo `Directory.Packages.props` (`ManagePackageVersionsCentrally`, 13 `PackageVersion` con le versioni di prima); tolto `Version` dai `PackageReference` di `SagreEventi.Web.Server.csproj` e `SagreEventi.Web.Server.Tests.csproj`; file aggiunto ai «Solution Items» di `SagreEventi.sln`; `src/SagreEventi.Web.Server/Dockerfile`: `COPY Directory.Build.props Directory.Packages.props ./` prima del `restore` (senza il file il restore nel container fallirebbe).

**Verifica:** build senza avvisi, 324 test backend ok. **Immagine Docker non provata**: Docker non è installato su questa macchina; la prima build dell'immagine (GitHub Actions o locale) dirà se il restore funziona.

**Note:** restano da decidere `global.json` e i lock file.


### Conformità, passo 5 (parte 1): TreatWarningsAsErrors

**Perché:** `backend.md` §2 vuole `TreatWarningsAsErrors`. Piano `PLAN-conformita.md`. Nessuna issue collegata.

**Cosa:** `Directory.Build.props`: `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` per tutta la soluzione.

**Verifica:** build Debug e Release senza avvisi, 324 test backend ok.

**Note:** da ora un nuovo avviso (anche un avviso di sicurezza dei pacchetti, `NuGetAudit`) rompe la build, compresa quella del workflow GitHub Actions e quella del Dockerfile (`dotnet publish`). Restano da decidere `Directory.Packages.props`, `global.json` e i lock file.


### Dettaglio evento: niente scorrimento orizzontale su telefono

**Perché:** nella versione deployata, un evento con un indirizzo web lungo nella descrizione allargava la colonna del dettaglio oltre lo schermo (barra orizzontale, layout non adattato). Nel codice committato `.dettaglio-descrizione` non aveva `overflow-wrap`. Segnalato dall'utente; nessuna issue collegata.

**Cosa:** `styles.css`: `.dettaglio-corpo` ha una colonna `minmax(0, 1fr)` anche su telefono (prima la larghezza dipendeva dal contenuto), `overflow-wrap: anywhere` su `.dettaglio-principale h1` e `.dettaglio-dati dd`. Il `overflow-wrap` sulla descrizione era già stato aggiunto con la funzione dei link (non ancora committata).

**Verifica:** `ng build` ok, 359 test frontend ok (un test jsdom non misura il layout). **Da verificare dopo il deploy** su telefono con un evento con link lungo, nome lungo e città lunga senza spazi.

**Note:** la modifica a `styles.css` va nel commit 23 (link) insieme al resto del file, condiviso con altri lavori.


### Conformità, passo 4: using, expression body, CancellationToken

**Perché:** `backend.md` §2 (using ordinati e senza inutilizzati, expression body, `CancellationToken`). Piano `PLAN-conformita.md`. Nessuna issue collegata.

**Cosa:** `dotnet format style --diagnostics IDE0005`: nessun `using` inutilizzato; riordinati gli `using` in 6 file (`IdentitySeeder`, `IdentityServices`, `ServiceCollectionExtensions`, `AppDbContext`, `ApiFactory`, `OpenApiTests`; in `ServiceCollectionExtensions` gli alias vanno dopo gli altri). `EfCoreEventiService`: `GetDaRivedereAsync` e `GetConclusiAsync` ora con expression body (erano le uniche con un solo `return`). Commenti pubblici: nessuno in italiano.

**Verifica:** build senza warning, 324 test backend ok, `dotnet format style` senza errori. `dotnet format whitespace` ha rimesso in colonna un inizializzatore in `ScadenzaEventiTests.cs`: modifica annullata perché estranea.

**Note:** `IdentitySeeder.SeedIdentityAsync` è l'unico metodo asincrono pubblico senza `CancellationToken`: gira una volta all'avvio, fuori da una richiesta; lasciato così. Il formattatore di spazi segnala altri scostamenti in file già esistenti, non toccati.


### Conformità, passo 3: commenti XML in inglese

**Perché:** `core.md` §5b vuole commenti XML su tutti i tipi e i membri pubblici, esclusi i membri ovvi. Piano `PLAN-conformita.md`. Nessuna issue collegata.

**Cosa:** aggiunti 40 commenti `<summary>` su endpoint (costanti dei limiti e delle policy, record di richiesta e risposta), `Extensions/*`, `Ruoli`, `Policies`, `ApplicationUser`, `EventoMappings`, `IEventiService`, Options di cache e scadenza, `Program`. Provato a togliere `NoWarn 1591`: 70 warning, di cui la maggior parte su proprietà di entità e Options, migrazioni generate e override, esclusi dalla regola; `NoWarn 1591` ripristinato (nessun cambio al `.csproj`).

**Verifica:** build senza warning, 324 test backend ok.

**Note:** i commenti ai metodi pubblici in italiano o assenti (regola di `CLAUDE.md`) non sono stati rivisti sistematicamente: da verificare nel passo 4.


### Conformità, passo 2: classi sealed

**Perché:** `backend.md` §3 vuole `sealed` sulle classi non pensate per l'ereditarietà. Piano `PLAN-conformita.md`. Nessuna issue collegata.

**Cosa:** `sealed` su `EventiHostedService`, `ModerazioneHostedService`, `EfCoreEventiService`, `AppDbContext`, `FusionCacheOptions`, `FusionCacheEntryOptions`, `ScadenzaEventiOptions`. Lasciate com'erano `Program` (usato da `WebApplicationFactory`), `Evento` (entità EF) e `ApplicationUser` (Identity). Le Options restano `class` e non `record`: binding più delicato, vantaggio minimo.

**Verifica:** build senza warning, 324 test backend ok.


### Conformità, passo 1: TimeProvider al posto di DateTime.UtcNow

**Perché:** `backend.md` §2 vuole `TimeProvider` iniettato, per test deterministici. Piano `PLAN-conformita.md`. Nessuna issue collegata.

**Cosa:** `EventiHostedService` e `EfCoreEventiService` ricevono `TimeProvider` (già registrato come singleton) e usano `GetUtcNow().UtcDateTime` (stesso valore e `Kind` di prima). `ScadenzaEventiTests.cs`: costruttore aggiornato.

**Verifica:** build senza warning, 324 test backend ok. Nessun `DateTime.UtcNow` rimasto nel progetto server.


### Aggiornamenti maggiori aggiunti a PUNTI-APERTI

**Perché:** richiesta dell'utente dopo l'audit dei pacchetti. Nessuna issue collegata.

**Cosa:** `PUNTI-APERTI.md`, sezione «Attività possibili»: Angular e PrimeNG 22, migrazione a `xunit.v3`, altri strumenti di sviluppo in ritardo (Vitest, jsdom, TypeScript).

**Verifica:** solo documentazione, nessuna build necessaria.


### Audit dei pacchetti

**Perché:** controllo di routine dopo le ultime modifiche (MailKit e altro), scelto dall'utente tra le attività senza piano. Nessuna issue collegata.

**Cosa:** nessuna modifica al codice. NuGet: `dotnet list package --vulnerable --include-transitive` e `--deprecated`. npm: `npm audit` e `npm outdated`.

**Verifica:**
- NuGet: nessun pacchetto vulnerabile. Deprecato solo `xunit` 2.9.3 (test, motivo «Legacy», alternativa `xunit.v3`).
- npm: `npm audit --omit=dev` 0 vulnerabilità. `npm audit` completo: 16 moderate, tutte nella catena di `@angular/cli` (`minimatch` <11.0.1, GHSA-g3hv-75wg-m249, denial of service) e solo in sviluppo; la correzione richiede `@angular/cli` 22 (breaking).
- npm outdated: Angular 21.2.x contro 22.2.x, PrimeNG 21.1.10 contro 22.1.4, Vitest 4 contro 5, TypeScript 5.9.3 contro 7, jsdom 27 contro 30.

**Note:** nessuna azione presa. Gli aggiornamenti maggiori (Angular 22, PrimeNG 22, `xunit.v3`) sono lavori da pianificare a parte.


### Controllo licenze: eseguito e scelte registrate in CLAUDE.md

**Perché:** decisione dell'utente (opzione 1): controllo a mano prima delle release, eccezioni elencate. Nessuna issue collegata.

**Cosa:** eseguiti `nuget-license` 4.0.18 (110 pacchetti, transitive incluse) e `license-checker-rseidelsohn` 5.0.1 (circa 470 pacchetti), installati fuori dal repository. `CLAUDE.md`: comandi, lista delle licenze ammesse ed eccezioni per nome; `PUNTI-APERTI.md`: punto chiuso.

**Verifica:** nessuna licenza fuori lista a parte le eccezioni (due librerie native Microsoft, due pacchetti di dati Creative Commons, due riconosciuti male dagli strumenti). I comandi con le esclusioni non sono stati rieseguiti per intero.

**Note:** la modifica a `CLAUDE.md` va nel commit 6. Nessun codice toccato.


### ADR: scelta registrata in CLAUDE.md

**Perché:** decisione dell'utente (opzione 1): nessun ADR per le deroghe. Nessuna issue collegata.

**Cosa:** `CLAUDE.md` («Note per Claude»); `PUNTI-APERTI.md` (punto chiuso).

**Verifica:** solo documentazione, nessuna build necessaria.

**Note:** la modifica a `CLAUDE.md` va nel commit 6.


### Digest Docker: scelta registrata in CLAUDE.md

**Perché:** decisione dell'utente (opzione 1): niente `tag@sha256`. Nessuna issue collegata.

**Cosa:** `CLAUDE.md` («Note per Claude»); `PUNTI-APERTI.md` (punto chiuso).

**Verifica:** solo documentazione, nessuna build necessaria.

**Note:** i tag attuali non sono di versione completa (`10.0`, `22-alpine`, `stable-alpine`, `:latest` nel compose): annotato, nessuna modifica. La modifica a `CLAUDE.md` va nel commit 6.


### Data Protection: scelta registrata in CLAUDE.md

**Perché:** decisione dell'utente (opzione 1): nessuna cifratura a riposo delle chiavi Data Protection. Nessuna issue collegata.

**Cosa:** `CLAUDE.md` (sezione «Note per Claude»: scelta e avviso sulla persistenza condivisa delle chiavi, oggi non configurata); `PUNTI-APERTI.md` (punto chiuso).

**Verifica:** solo documentazione, nessuna build necessaria.

**Note:** la modifica a `CLAUDE.md` va nel commit 6 (`chore(claude)`).


### Cache di GetEventi: `since` arrotondato al minuto

**Perché:** la chiave di cache `eventi_cache_key:{since.Ticks}` dipendeva da `since`, scelto dal client: chiavi illimitate. Scelta dell'utente: opzione 1. Nessuna issue collegata.

**Cosa:** `EfCoreEventiService.GetEventiAsync` arrotonda `since` per difetto al minuto (`ArrotondaAlMinuto`, pubblico e statico) prima di usarlo come chiave e come filtro. Il client può ricevere al massimo un minuto di eventi già visti, che il merge gestisce. Contratto API invariato. Nuovo `ArrotondamentoSinceTests.cs`.

**Verifica:** build senza warning, 324 test backend ok.

**Note:** un limite di richieste su `GetEventi` (opzione 2) resta da valutare solo se servirà. Fatto su `feature/notifica-email-moderazione` (nessun commit): commit proposto in `piano-commit.md`.


### Cache: scelte registrate in CLAUDE.md

**Perché:** decisione «Regole sulla cache» di `PUNTI-APERTI.md`: `backend-infra.md` (non incluso) chiede di approvare per iscritto durata, fail-safe e invalidazione. Nessuna modifica al codice.

**Cosa:** `CLAUDE.md`: la riga «Cache» della tabella elenca le scelte approvate dall'utente (FusionCache L1, nessun L2, durata 5 minuti, fail-safe massimo 5 minuti con throttling di 5 e jitter di 30 secondi, invalidazione per tag `eventi` dopo conclusione, scrittura e revisione, coerenza eventuale fino a 5 minuti con più repliche); la nota «Per Claude» chiede conferma per ogni nuova cache o configurazione avanzata diversa. `PUNTI-APERTI.md`: decisione chiusa e nuovo punto aperto sulla chiave di cache scelta dal client (`since`).

**Verifica:** solo documentazione, nessuna build necessaria.


### Email ai moderatori, passi 5-8: servizio dati, job, test e documentazione

**Perché:** completare l'avviso via email ai moderatori (piano `PLAN-notifica-email-moderazione.md`, passi 5-8; i passi 1-4 sono nella voce precedente). Nessuna issue collegata.

**Cosa:**
- Passo 5: `IEventiService`/`EfCoreEventiService`: `GetNotificaModerazioneAsync()` (id delle segnalazioni in attesa non ancora notificate + totale delle in attesa, stesso criterio del contatore «Gestione») e `SegnaNotificateAsync()` (imposta `NotificataIl` solo sulle in attesa non ancora notificate, non tocca `DataOraUltimaModifica`: idempotente). Nuovo `NotificaModerazione` (record).
- Passo 6: `HostedServices/ModerazioneHostedService.cs` (`BackgroundService` + `PeriodicTimer` + `IOptionsMonitor`, come `EventiHostedService`), registrato in `ServiceCollectionExtensions.cs`. A ogni giro: se non ci sono segnalazioni nuove non fa nulla; altrimenti legge gli utenti Admin ed Editor (`GetUsersInRoleAsync`, senza doppioni né indirizzi vuoti) e manda **una mail di testo per destinatario** con solo i numeri e il link `{App:PublicBaseUrl}/gestione/revisione`. Se almeno una mail è consegnata segna le segnalazioni come notificate (senza dipendere dal token di arresto, per non rinotificare); se tutte falliscono non segna nulla e riprova al giro dopo. Un destinatario che fallisce non blocca gli altri; nei log solo numeri e tipo di errore, mai indirizzi, password o testo delle segnalazioni.
- Correzioni emerse dai test: `MailKitEmailSender` e `SmtpOptionsValidator` accettavano indirizzi senza dominio (`noreply`), ora rifiutati; `AppOptionsValidator` rifiuta spazi e caratteri di controllo in `App:PublicBaseUrl`.
- Test (91 nuovi, 310 in totale): `EmailOptionsTests` (validatori di Smtp, Moderazione, App), `MailKitEmailSenderTests` (destinatario e oggetto ostili con a capo, virgole, nomi visualizzati; server irraggiungibile senza perdite di password o contenuto; annullamento), `NotificaModerazioneTests` (servizio dati e job su SQLite con `FakeEmailSender`: nessuna mail senza segnalazioni, una mail per moderatore, testo ostile mai nella mail, invio parziale, fallimento totale e nuovo tentativo, nessun moderatore, non-moderatori esclusi, annullamento, testo singolare/plurale e link), `FakeEmailSender`. `ApiFactory.cs`: job disattivato e `IEmailSender` finto, così nessun test invia mail vere.
- Passo 8: `README.md` (sezione «Avviso via email ai moderatori» e righe di configurazione), `DEPLOY.md` (variabili `Smtp__*`, `App__PublicBaseUrl`, `Moderazione__AvvisoIntervalloMinuti`, caselle reali per gli utenti creati all'avvio, primo giro con tutte le segnalazioni già in attesa).

**Verifica:** build senza warning, 310 test backend ok (219 prima). `dotnet list package --vulnerable --include-transitive`: nessuna vulnerabilità. Licenze: MailKit, MimeKit e BouncyCastle.Cryptography (transitive) MIT (nuspec su NuGet). Copertura sul codice nuovo: validatori e opzioni 100%, `ModerazioneHostedService` 100% sul ciclo (non coperti `ExecuteAsync` e il timer, come per `EventiHostedService`), `MailKitEmailSender` 100% sui controlli; **non coperta la consegna riuscita a un vero SMTP** (connessione, autenticazione, invio), perché nei test non si usa un server di posta. Revisione di sicurezza fatta (vedi note).

**Note:**
- Revisione di sicurezza (inline sulle modifiche): nessuna iniezione di header (indirizzo singolo senza spazi né controlli, oggetto senza controlli), corpo costruito solo da numeri e da un URL di configurazione validato, nessun dato delle segnalazioni nella mail, TLS con validazione del certificato sempre attiva (nessun callback), credenziali e indirizzi mai nei log, query parametrizzate, un solo invio per giro per moderatore (il flusso di segnalazioni non può inondare le caselle).
- **SMTP e TLS:** Mailpit (`Smtp__Security=None`) solo in sviluppo; in produzione un SMTP reale con TLS (SMTPS, porta 465, `SslOnConnect`), come chiarito dall'utente dopo la prima stesura (nessuna deroga a `backend-email.md`). Su richiesta dell'utente `SmtpOptionsValidator` rifiuta `Smtp:Security=None` e `StartTlsWhenAvailable` (che ripiega sul testo in chiaro) fuori da Development (l'API non parte; test per Production, Staging e Testing, accettati in Development). Per scritto in `README.md` e `DEPLOY.md`: se il divieto crea problemi con un provider di posta, si apre una issue e si gestisce con uno sviluppo ad hoc.
- Da verificare dopo il deploy: con l'SMTP reale configurato, una segnalazione anonima deve produrre una sola mail ai moderatori entro l'intervallo (in sviluppo si può provare con Mailpit).
- Job pensato per una sola replica (nessun lock distribuito): con più repliche ogni replica manderebbe la propria mail.


### Sincronizzazione automatica: al ritorno in primo piano e ogni 10 minuti

**Perché:** approvando una segnalazione dal PC, sul telefono con l'app già aperta l'evento compariva solo premendo il pulsante di sincronizzazione (l'app si sincronizzava solo all'avvio, al ritorno della connessione e a mano). Scelta dell'utente: ritorno in primo piano più controllo ogni 10 minuti. Nessuna issue collegata. Su richiesta dell'utente non è stato scritto un piano completo: ne è esistito uno minimo (regola `core.md` §6.15), poi cancellato.

**Cosa:**
- `core/sincronizzazione-automatica.service.ts` (nuovo): ascolta `visibilitychange` e un timer di 10 minuti; chiama `store.sincronizza()` solo se la pagina è visibile, si è online e sono passati almeno 5 minuti dall'ultimo tentativo o dall'ultima sincronizzazione riuscita (anche manuale). Dopo un errore non ritenta prima dei 5 minuti, per non martellare un server in difficoltà; in sfondo e offline non fa nulla. All'avvio non sincronizza una seconda volta (lo fa già `AppComponent`).
- `app.component.ts`: avvio del servizio con `inject(...)`, come `ErroreNavigazioneService`; `app.component.spec.ts`: il finto `EventiStore` espone `ultimaSincronizzazione`.
- `sincronizzazione-automatica.service.spec.ts` (nuovo, 8 test con orologio simulato): nessuna sincronizzazione all'avvio, al ritorno in primo piano dopo 5 minuti, non entro 5 minuti, ogni 10 minuti, non in sfondo, non offline, sincronizzazione manuale conteggiata, ritentativo dopo errore solo dopo l'intervallo minimo.

**Verifica:** `npm run build` ok, `npm test` 359 test ok. Nessuna nuova dipendenza né modifica al backend (`GetEventi` non ha limiti di richieste).

**Note:** la sincronizzazione automatica invia anche le modifiche locali non ancora inviate (come quella manuale); l'elenco può cambiare mentre lo si guarda quando arrivano eventi nuovi. Da verificare dopo il deploy: approvare una segnalazione dal PC e controllare che compaia sul telefono, riaprendo l'app o dopo circa 10 minuti con l'app aperta.


### «Gestione» nel menu ⋮ con il numero sui tre puntini

**Perché:** richiesta dell'utente: tenere più pulita la barra in alto su desktop (arriverà anche la mail ai moderatori) e far capire a admin ed editor che ci sono segnalazioni da moderare. Nessuna issue collegata. La campanella delle notifiche (sempre visibile, con «Nessuna notifica» quando è vuota) è un prossimo sviluppo, annotato in `PUNTI-APERTI.md`.

**Cosa:**
- `app.component.ts`: `linkRiservati` diviso in `linkMie` e `linkGestione`. «Gestione (N)» esce dalla barra desktop e sta nel menu ⋮ a tutte le larghezze (prima solo su mobile); «Le mie» resta nella barra desktop e nel menu solo su mobile (`solo-mobile`). Nuovi `daModerare` (segnalazioni in attesa, 0 per chi non può moderare) ed `etichettaMenu` (nome accessibile del pulsante: «Menu, N segnalazioni da moderare», «Menu» se zero).
- `app.component.html`: il pulsante ⋮ è dentro `.menu-con-badge` e mostra un contatore (`.menu-badge`, decorativo, `aria-hidden`) solo per chi modera e solo se N > 0.
- `styles.css`: stile del contatore con i colori del tema; `white-space: nowrap` su `.nav-link`, così «Le mie» e «Gestione» non vanno più a capo.
- `app.component.spec.ts`: aggiornati i test della barra desktop e del menu; 5 test nuovi sul contatore (numero, singolare, assente con 0, assente se il conteggio non è noto, mai per chi non può moderare).

**Verifica:** `npm run build` ok, `npm test` 351 test ok. Nessuna nuova dipendenza né modifica al backend.

**Note:** controllo visivo a 360 px e desktop da fare a cura dell'utente (posizione e leggibilità del contatore sul ⋮, in tutti i temi). Le verifiche «Da verificare dopo il deploy» in `PUNTI-APERTI.md` sono state aggiornate di conseguenza.


### Link nella descrizione dell'evento: testo cliccabile e pulsante «Apri il programma»

**Perché:** richiesta dell'utente: un indirizzo scritto nella descrizione si vedeva come una stringa lunga e non cliccabile. Scelta (dopo una simulazione): nel testo il link mostra il nome del sito; nel box delle azioni un solo pulsante, per il primo link. Nessuna issue collegata.

**Cosa:**
- `core/link-utils.ts` (nuovo): `segmentaTesto()` spezza il testo in segmenti di testo e di link, `primoLink()` restituisce il primo. Diventano link solo gli indirizzi assoluti `http`/`https` (verificati con `URL`); altri schemi (`javascript:`, `data:`, `mailto:`, `ftp:`, `file:`), indirizzi con credenziali, rotti o oltre 2000 caratteri restano testo; la punteggiatura finale resta fuori dal link; gli a capo si conservano.
- `evento-detail.component.ts/.html`: la descrizione è disegnata con `@for`/`@if` (nessun `innerHTML`, il testo resta escapato); ogni link è un `<a>` con il nome del sito (senza `www.`), `target="_blank"`, `rel="noopener noreferrer"` e l'indirizzo completo nel `title`; nel box, tra «Apri la mappa» e «Condividi», il pulsante «Apri il programma ↗» per il primo link (assente se non ci sono link; gli altri link restano solo nel testo).
- `styles.css`: stile di `.link-descrizione`, `overflow-wrap: anywhere` sulla descrizione e `.icona-dopo` per l'icona dopo il testo del pulsante.
- Test: `link-utils.spec.ts` (14, tra cui schemi vietati, credenziali, markup ostile, nessun carattere perso) e `evento-detail.component.spec.ts` (6: link con nome del sito e `rel`, pulsante sul primo link, più link, nessun link, `javascript:`, HTML mai interpretato).

**Verifica:** `npm run build` ok, `npm test` 344 test ok. Nessuna nuova dipendenza, nessuna modifica al backend, il testo salvato non cambia.

**Note:** controllo visivo a 360 px e desktop da fare a cura dell'utente (colori e a capo dei link lunghi). Le card dell'elenco e l'agenda non cambiano.


### Filtro periodo: tolta «Anche terminati» e «In programma» diventa «Tutti»

**Perché:** richiesta dell'utente: il termine «anche» non era chiaro. La voce (valore `tutti`) mostrava tutti gli eventi, ma i terminati non sono quasi mai nell'elenco: il server li marca come conclusi (`EventoConcluso`) e il client li scarta alla sincronizzazione (`eventi-store.service.ts`). Un filtro «Terminati» sarebbe stato quasi sempre vuoto, quindi, su scelta dell'utente, la voce è stata tolta (nessun «Tutti»). Poi «In programma» (che era l'unione di «In corso» e «In arrivo») è stata rinominata «Tutti», per chiarezza; l'ordine delle voci è Tutti, In corso, In arrivo.

**Cosa:** `eventi-list.component.ts`: tipo `Periodo` senza il vecchio `'tutti'`, rimossa l'opzione «Anche terminati», e valore `'programma'` (etichetta «In programma») rinominato `'tutti'` (etichetta «Tutti»); `eventi-list.component.html`: il testo dello stato vuoto non parla più di eventi terminati («...oppure cambia il periodo»).

**Verifica:** `npm run build` ok, `npm test` 324 test ok.

**Note:** se in futuro serve lo storico dei terminati, va pianificata la conservazione degli eventi conclusi (server e client).


### Email ai moderatori, passi 1-4: MailKit, opzioni, invio e colonna `NotificataIl`

**Perché:** avvisare via email gli admin/editor delle segnalazioni da moderare (piano `PLAN-notifica-email-moderazione.md`, passi 1-4 su 8; il job, i test e la documentazione sono i passi 5-8). Nessuna issue collegata.

**Cosa:**
- Branch `feature/notifica-email-moderazione` da `develop` (il lavoro non committato lo ha seguito).
- Passo 1: pacchetto `MailKit` 4.18.2 (licenza MIT verificata su NuGet e sul repository ufficiale, compatibile con net10.0; porta con sé `MimeKit`) in `SagreEventi.Web.Server.csproj`. `dotnet list package --vulnerable --include-transitive`: nessuna vulnerabilità.
- Passo 2: `Options/{SmtpOptions,SmtpOptionsValidator,ModerazioneOptions,ModerazioneOptionsValidator,AppOptions,AppOptionsValidator}.cs`, registrati con `ValidateOnStart` in `ServiceCollectionExtensions.cs`. `Smtp` (host, porta, `Security`, utente/password opzionali ma insieme, mittente validato con un parser), `Moderazione:AvvisoIntervalloMinuti` (60, minimo 5), `App:PublicBaseUrl` (URL assoluto `https`, senza credenziali, query o frammento). Gli host/URL segnaposto sono rifiutati fuori da Development e Testing. Segnaposto in `appsettings.json` e variabili `App__*`, `Smtp__*`, `Moderazione__*` in `deploy/.env.example`.
- Passo 3: `Models/Services/Application/{IEmailSender,EmailMessage,EmailSendException}.cs` e `Models/Services/Infrastructure/MailKitEmailSender.cs`. Testo semplice; destinatario accettato solo come indirizzo singolo senza spazi, ritorni a capo, virgole o `<>`; oggetto senza caratteri di controllo (`ArgumentException`); validazione del certificato TLS sempre attiva; timeout 30 s; ogni errore di trasporto diventa `EmailSendException` senza password né corpo nel testo; rispetta il `CancellationToken`.
- Passo 4: `Evento.NotificataIl` (`DateTime?`) e migrazione `AddNotificaModerazione` (solo `AddColumn` nullable; le segnalazioni già in attesa risultano non notificate e saranno notificate al primo giro). Snapshot aggiornato.
- `tests/.../ApiFactory.cs`: valori di prova per `Smtp:Host` e `App:PublicBaseUrl` (i test `Production` avviano l'host con la validazione completa).

**Verifica:** build senza warning e 219 test ok (nessun test nuovo: i test dei passi 2-4 sono nel passo 7).

**Note:** l'app ora **non parte fuori da Development** senza `Smtp__Host` e `App__PublicBaseUrl` reali (da scrivere in `DEPLOY.md`, passo 8). I valori SMTP di Mailpit li fornisce l'utente. Il build normale è bloccato dal processo `SagreEventi.Web.Server` (PID 7680) dell'utente: per build, test e `dotnet ef` ho usato una cartella `artifacts` temporanea, senza fermarlo.


### Menu in basso su mobile: Home, Eventi, Segnala, Agenda, Info

**Perché:** richiesta dell'utente: «Segnala» al centro tra Eventi e Agenda e «Informazioni» nella barra, solo su mobile; il desktop resta com'è.

**Cosa:** `app.component.ts`: nuova lista `linkMobile` con le 5 voci nell'ordine richiesto («Segnala» con il «+» evidenziato, «Info» con `aria-label` «Informazioni»); `linkRiservati` (le voci «Le mie» e «Gestione», che compaiono solo ad alcuni utenti) è condivisa tra la barra desktop e il menu ⋮. `app.component.html`: la barra mobile scorre `linkMobile`. `styles.css`: barra a 5 colonne `minmax(0, 1fr)` (sempre su una riga); su `/eventi/nuovo` «Eventi» non si accende insieme a «Segnala» (regola `:has()`); le voci «Le mie» e «Gestione» del menu ⋮ portano la classe `solo-mobile` e sono nascoste da 900 px in su. «Informazioni» resta anche nel menu ⋮. Nuovo `app.component.spec.ts`.

**Verifica:** `npm run build` ok, `npm test` 324 test ok (7 nuovi sul menu: ordine e link delle voci mobile, «Segnala» evidenziata, `aria-label` di «Info», 5 voci anche con «Le mie» e «Gestione» attive, barra desktop invariata, voci del menu ⋮ e classe `solo-mobile` nel DOM del popup). Controllo visivo dell'utente con i dev tools su mobile (~480 px): le 5 voci stanno su una riga, «Segnala» è centrale ed evidenziata, «Eventi» spenta sul form.

**Note:** controllo a 360 e 320 px fatto dall'utente (ok). **Da verificare dopo il deploy:** il menu ⋮ con «Le mie» e «Gestione» (servono un account con permessi e una segnalazione propria) e il desktop (barra in alto invariata, nessuna voce «Le mie»/«Gestione» doppia nel menu ⋮). A 320 px la colonna è circa 56 px: l'etichetta «Info» è stata scelta per questo.


### GitHub Actions su Node 24 (warning «Node.js 20 is deprecated» di `build-push.yml`)

**Perché:** il workflow finiva bene ma mostrava due warning perché sei action dichiaravano ancora Node 20 (GitHub le forzava a Node 24 e la forzatura è destinata a sparire).

**Cosa:** `.github/workflows/build-push.yml`: `actions/checkout` v4→v7, `actions/setup-node` v4→v7, `actions/setup-dotnet` v4→v6, `docker/setup-buildx-action` v3→v4, `docker/login-action` v3→v4, `docker/build-push-action` v6→v7. Verificato su `action.yml` di ciascun tag che dichiara `using: node24`. Le note di rilascio non mostrano cambiamenti che toccano questo workflow (nessun `global.json`, nessun `packageManager` in `package.json`, `pull_request` e non `pull_request_target`, nessuna delle variabili Docker rimosse; gli input usati non cambiano). Piano: `PLAN-github-actions-node24.md`.

**Verifica:** solo lettura delle note e dei file `action.yml`; il workflow **non è stato eseguito**.

**Note:** da controllare con un'esecuzione su GitHub (una PR verso `main` non pubblica immagini): i warning devono sparire e il job finire. Se un'action nuova si comporta male si rimette il tag precedente.


### Aggiornamento della PWA: controllo periodico e invito ad aggiornare dopo un rifiuto anti-bot

**Perché:** il service worker controllava le novità solo all'avvio e alla navigazione, quindi una PWA lasciata aperta poteva restare vecchia per giorni; e un client vecchio, senza la prova anti-bot, vedeva solo «Il server ha risposto con errore 400.» senza sapere di dover aggiornare.

**Cosa:** `aggiornamento-app.service.ts`: `checkForUpdate()` ogni ora e quando l'app torna in primo piano (`visibilitychange`, al massimo una volta ogni 5 minuti), nuovo metodo pubblico `controlla()` (offline ed errori ignorati, nessun controllo con il service worker spento). `eventi-store.service.ts`: `provaRifiutata()` riconosce il 400 con campo `altcha` (usata anche per il nuovo tentativo); in quel caso il messaggio dice di aggiornare l'app con l'icona in alto e lo store chiama `controlla()`, così toast e icona compaiono se esiste una versione nuova. `DEPLOY.md`: corretto l'ordine di rilascio (API e web insieme; prima era scritto «web prima dell'API», che non evitava il problema perché anche un web nuovo con API vecchia non invia).

**Verifica:** `npm run build` ok, `npm test` 324 test ok (8 nuovi: controllo orario, ritorno in primo piano con limite di 5 minuti, pagina in background, service worker spento, errore ignorato; messaggio sul 400 anti-bot, nessun effetto sugli altri errori).

**Note:** non provato su un dispositivo reale (richiede un deploy con due versioni successive). Il toast «Nuova versione disponibile» dura 8 secondi: se l'utente lo perde resta l'icona in alto. Un client che non ha mai rilevato la nuova versione (service worker non ancora aggiornato) continua a fallire finché non viene riavviato.


### Cancellati i piani conclusi (anti-bot, avviso, date, healthcheck)

**Perché:** richiesta dell'utente: i `PLAN-*.md` conclusi si cancellano anche se i commit non sono ancora stati fatti, perché i commit mancanti sono in `piano-commit.md`.

**Cosa:** cancellati `PLAN-protezione-bot-altcha.md`, `PLAN-avviso-moderazione.md`, `PLAN-date-affiancate.md`, `PLAN-rimozione-healthcheck.md`. Le decisioni valide del piano anti-bot (protocollo v1, Web Worker al posto del widget, verifica al sync, nessuna esenzione, limiti, prova manuale da fare) sono ora in `PUNTI-APERTI.md`. `CLAUDE.md`: la regola dice che il piano si cancella anche prima dei commit. Resta `PLAN-menu-mobile.md` (passo 4 aperto). Le voci più vecchie di questo file che citano i piani cancellati restano come storia.

**Note:** nessun codice toccato, nessun commit.


### Rimossi gli healthcheck (Docker e endpoint `/healthz`)

**Perché:** richiesta dell'utente: al momento non servono. Nel deploy reale il `depends_on` del compose era già commentato.

**Cosa:** `HEALTHCHECK` tolto da `src/SagreEventi.Web.Server/Dockerfile` e `src/SagreEventi.Web/Dockerfile`; `depends_on` (`condition: service_healthy`) tolto da `deploy/docker-compose.yml`; `app.MapHealthChecks("/healthz")` da `Program.cs` e `AddHealthChecks()` da `ServiceCollectionExtensions.cs`; test `HealthTests.cs` cancellato. `README.md` (riga `/healthz` e frase sul web che parte con l'API `healthy`), `DEPLOY.md` (controlli di stato: ora `docker ps` e una chiamata a `GetEventi` attraverso il proxy), `CLAUDE.md` e `PUNTI-APERTI.md` (tolta la voce sullo strumento per l'healthcheck). `docs/DEPLOY.md.bak` lasciato com'è (storico). Piano: `PLAN-rimozione-healthcheck.md`.

**Verifica:** `dotnet test` 219 test ok (220 meno quello cancellato), nessun avviso, compilato in una cartella di output separata perché il normale `artifacts/` è bloccato da un processo `SagreEventi.Web.Server` già in esecuzione sul PC. `docker compose config` non eseguito (Docker non disponibile da questa shell).

**Note:** deroga a `core.md` §5 (`/health/live`, `/health/ready`) e `docker.md` (healthcheck nel compose): non ancora annotata in `CLAUDE.md`. Le immagini già pubblicate su Docker Hub hanno ancora l'HEALTHCHECK: vanno ripubblicate (a cura dell'utente).


### Form di segnalazione: avviso che l'evento sarà visibile solo dopo la moderazione

**Perché:** il form è aperto a chiunque e l'utente scopriva la moderazione solo dopo l'invio (toast). Un avviso prima dell'invio chiarisce che la segnalazione non è pubblica subito e scoraggia spam e contenuti non idonei.

**Cosa:** `evento-form.component.html`: riquadro `p-message` informativo sopra i pulsanti con il testo «La segnalazione sarà visibile a tutti solo dopo la verifica degli amministratori, per evitare spam e contenuti non idonei.» `evento-form.component.ts`: nuovo `computed` `daModerare` (nuova segnalazione di chi non può moderare), usato anche da `salva()` al posto della condizione duplicata. Il riquadro non compare per Admin ed Editor (pubblicano subito) né nella modifica di un evento. Il testo non nomina «Le mie» né i dispositivi: la copia «in attesa» vive solo sul dispositivo che ha inviato. Piano: `PLAN-avviso-moderazione.md`.

**Verifica:** `npm run build` ok, `npm test` 316 test ok (4 nuovi in `evento-form.component.spec.ts`: riquadro presente sopra i pulsanti con il testo esatto; assente per chi può moderare; assente in modifica con e senza permessi).

**Note:** controllo visivo fatto dall'utente con i dev tools su mobile (screenshot): riquadro sopra «Segnala l'evento», icona e testo a capo bene, ben leggibile; non controllato su desktop. Nessuna chiave di traduzione: l'app non ha un sistema di traduzione, i testi sono in italiano nei template.


### Form di segnalazione: «Primo giorno» e «Ultimo giorno» affiancati anche su mobile

**Perché:** richiesta dell'utente: ridurre lo scroll del form su smartphone, dove le due date stavano una sotto l'altra.

**Cosa:** `src/SagreEventi.Web/src/styles.css`, regola `.campo-coppia`: due colonne `minmax(0, 1fr)` sempre (prima solo da 600 px in su), con spazio di 0,75 rem su mobile e 1,35 rem da 600 px per dare più larghezza al testo della data. Nessun cambiamento ai template. Piano: `PLAN-date-affiancate.md`.

**Verifica:** `npm run build` ok. Nessun test automatico: è solo CSS e jsdom non calcola il layout. Controllo visivo fatto dall'utente con i dev tools del browser: layout ok.

**Note:** le larghezze esatte provate nei dev tools non sono state annotate; a 320 px lo spazio resta al limite (stima dal CSS).


### Anti-bot sul frontend, documentazione e verifiche (passi 5-7 di `PLAN-protezione-bot-altcha.md`)

**Perché:** completare la protezione: senza il client che invia `X-Altcha` il backend rifiuterebbe ogni segnalazione.

**Cosa:** `core/altcha-solver.ts` (risolve la challenge ALTCHA v1 con `crypto.subtle`), `core/altcha.worker.ts` (la esegue in un Web Worker), `core/altcha.service.ts` (chiede la challenge, usa il worker, ripiega sul thread principale se il worker non parte). `EventiApiService`: `getChallenge()` e `updateEventi(eventi, altcha?)` con header `X-Altcha`. `EventiStore.invia()`: una prova nuova per ogni lotto da 20 e un solo nuovo tentativo se il server la rifiuta (400 con campo `altcha`). `angular.json` (`webWorkerTsConfig`), `tsconfig.worker.json`, `tsconfig.app.json`. Nessuna nuova dipendenza npm. `README.md` (sezione «Protezione anti-bot», endpoint, configurazione), `DEPLOY.md` (`Altcha__HmacKey`, ordine di rilascio).

**Verifica:** `npm run build` ok (il worker è in `ngsw.json`, quindi disponibile offline), `npm test` 305 test ok (11 nuovi: solver, header, nuovo tentativo, offline). Backend: 0 pacchetti NuGet vulnerabili (transitivi inclusi). `npm audit --omit=dev`: 0; `npm audit` completo: 16 avvisi moderati, tutti di sviluppo (nessun pacchetto cambiato in questo intervento). Passo 6: nessuna CSP in nginx né in `index.html`, `/api` non è nei `dataGroups` di `ngsw-config.json` e `GetChallenge` risponde `no-store`: nessuna modifica necessaria.

**Note:** non verificato nel browser reale (tempo di risoluzione su telefoni lenti, offline → online). Controllo licenze non eseguito: nessun pacchetto aggiunto.


### Tracciamento di commit e punti aperti, piani conclusi cancellati

**Perché:** richiesta dell'utente: tenere traccia dei commit mancanti e dell'alternativa Altcha + honeypot, e non lasciare in giro i `PLAN-*.md` non più necessari.

**Cosa:** `piano-commit.md` riscritto con tutti i commit ancora da fare (fix filtro, anti-bot backend e test, configurazione di Claude, changelog da decidere). `PUNTI-APERTI.md`: nuova sezione «Anti-bot» (Altcha + honeypot, riuso con più repliche, esenzione utenti, taratura della difficoltà). `CLAUDE.md`: regola di cancellare i `PLAN-*.md` conclusi e di tenere `piano-commit.md`. Cancellato `PLAN-allineamento-claude-md.md` (concluso; la storia è nella voce «`CLAUDE.md` allineato» qui sotto, dove il file è citato). `PLAN-protezione-bot-altcha.md` resta: mancano i passi 5-7.

**Note:** nessun codice toccato, nessun commit.


### Anti-bot sul backend: proof of work (ALTCHA v1) su `UpdateEventi` (passi 1-4 di `PLAN-protezione-bot-altcha.md`)

**Perché:** impedire invii automatici (bot e script) delle segnalazioni da `/eventi/nuovo`; la protezione deve stare nel server, perché l'API è chiamabile senza Angular.

**Cosa:** nuovo `GET /api/Eventi/GetChallenge` (anonimo, rate limit `Eventi:RichiesteChallengeAlMinuto`, `Cache-Control: no-store`) che emette una challenge firmata; `PUT /api/Eventi/UpdateEventi` richiede l'header `X-Altcha` (soluzione in base64 JSON) a tutti i chiamanti e, se manca, è scaduta, falsificata o già usata, risponde 400 (campo `altcha`) prima di toccare il contenuto. Verifica scritta in C# senza librerie (nessuna .NET ufficiale): formato del salt rigido, confronti a tempo costante, scadenza, riuso impedito con memoria per processo. File: `Models/Services/Application/{IAltchaService,AltchaService,AltchaChallenge,AltchaVerificationResult}.cs`, `Options/{AltchaOptions,AltchaOptionsValidator}.cs`, `Endpoints/EventiEndpoints.cs`, `Extensions/ServiceCollectionExtensions.cs`, `appsettings.json` (sezione `Altcha` con chiave segnaposto), `deploy/.env.example` (`Altcha__HmacKey`). Test: `AltchaServiceTests.cs`, `AltchaApiTests.cs`, `AltchaTestHelper.cs`; `ApiFactory.cs` aggiunge una prova valida alle `PUT UpdateEventi` dei test esistenti tramite `IStartupFilter` di test (opt-out con l'header `X-Test-Skip-Altcha`).

**Verifica:** build senza warning, 220 test ok (66 anti-bot: soluzione valida, riuso e riuso concorrente, scadenza, firma alterata, chiave diversa, salt non emesso dal server, numero fuori range, payload ostili/enormi/malformati, rate limit; validatore delle opzioni). Copertura righe del codice nuovo 100%. Nessun nuovo pacchetto. **Non fatto:** frontend, nginx/service worker, README/DEPLOY, `/security-review` (passi 5-7).

**Note:** l'API non parte fuori da Development/Testing senza `Altcha__HmacKey` reale (rifiuta anche i valori che iniziano con `CHANGE-ME`). **Non mettere il backend in produzione prima del frontend (passo 5)**: oggi il form web non invia ancora la prova e le segnalazioni verrebbero rifiutate. Decisioni prese senza conferma (nessuna esenzione per utenti autenticati, riuso per processo, difficoltà 300000, validità 10 min) elencate nel piano. Nessun commit.


### Filtro «periodo» degli eventi: da pulsanti a tendina

**Perché:** bug emerso dopo il deploy: su smartphone le 4 voci («In programma», «In corso», «In arrivo», «Anche terminati») in riga, con `flex: 0 0 auto`, superavano i 360 px e allargavano il layout, compromettendo la navigazione.

**Cosa:** `eventi-list.component.html`: `p-selectbutton` sostituito da `p-select` (stessi valori, `ariaLabel` «Filtra per periodo»), posizionata prima dell'ordinamento (città, periodo, ordine). `eventi-list.component.ts`: tolto `SelectButtonModule`. `styles.css`: `.filtri-periodo` condivide la regola di città e ordine (`flex: 0 1 12.5rem; min-width: 10rem`).

**Verifica:** `npm run build` ok, `npm test` 294 test ok. **Non verificato:** l'aspetto a 360 px e a ≥ 800 px nel browser.

**Note:** per questa modifica, su richiesta dell'utente, nessun `PLAN-<nome>.md` dedicato. Nessun commit.


### `CLAUDE.md` allineato alle regole in `.claude/`, `CHANGES.md` rinominato in `CHANGELOG.md`

**Perché:** l'utente ha aggiunto le regole in `.claude/rules/` e `.claude/rules-optional/` e ha chiesto di allinearvi `CLAUDE.md`; le scelte di progetto sono state confermate una per volta.

**Cosa:** `CLAUDE.md`: riferimenti a `CHANGELOG.md`, commit locali solo con conferma (git.md) al posto di «mai commit», convenzione `PLAN-<nome>.md`, nuove sezioni «Scelte architetturali» (Clean Architecture come obiettivo, SQL Server + EF Core, `OperationResults` di Minerva, Identity con ruoli e policy, ASVS 2, logging standard, FusionCache L1, job, OpenAPI solo in Development, backup sul server, git flow con `develop`, moduli opzionali) e «Note per Claude». `CHANGES.md` rinominato in `CHANGELOG.md`; aggiornato il riferimento in `SagreEventi.sln`. Nuovo `PLAN-allineamento-claude-md.md`. Le vecchie voci che citano `CHANGES.md` restano com'erano (storico).

**Note:** nessun codice toccato, nessuna build necessaria. Il rename risulta in git come file eliminato + nuovo (da committare insieme). Da decidere: Data Protection, digest Docker, healthcheck, ADR. Nessun commit.


### `DEPLOY.md` allineato al compose unico, `README.md` tradotto in italiano

**Perché:** richiesta dell'utente: backup di `DEPLOY.md` e allineamento al compose unico; `README.md` e `CHANGES.md` devono essere in italiano.

**Cosa:** copia di backup di `DEPLOY.md` prima delle modifiche, conservata come storico in `docs/DEPLOY.md.bak`. `DEPLOY.md`: spiegati i due modi di avvio (compose unico consigliato / due compose separati), immagini pubbliche e `linux/amd64`, passo 1 con `curl` dei due file senza clonare, passo 2 con la subnet diversa nei due casi, passo 3 con `docker compose pull/up -d`, aggiornamenti e comandi utili anche per il compose unico, tre nuove righe nei problemi frequenti (variabile mancante, subnet in conflitto, architettura ARM); tolta la frase «il workflow non è mai stato eseguito» (le immagini sono su Docker Hub). `README.md`: tradotto interamente dall'inglese (titoli compresi: i link dell'indice ora puntano a `#panoramica`, `#funzionalità`, `#architettura`, `#per-iniziare`, `#sviluppo`). `CHANGES.md`: già in italiano, nessuna traduzione necessaria.

**Note:** `DEPLOY.md` resta più lungo del necessario sul punto «Comandi utili». Nessun test di build (solo documentazione). Nessun commit.


### Deploy con un solo compose dalle immagini di Docker Hub

**Perché:** l'utente ha pubblicato `angelo87dock/sagreeventi-api` e `-web`: il deploy non deve più partire dai due compose separati.

**Verifica prima di scrivere:** via API di Docker Hub i due repository sono pubblici, con tag `latest` e SHA del commit, solo `linux/amd64`; il pull anonimo del manifest `latest` risponde 200. Nginx del container web risolve `sagreeventi-api:8080` col DNS Docker, quindi basta una rete comune. **Non verificato:** l'avvio vero dei container (sul PC non c'è Docker né WSL).

**Cosa:** nuovo `deploy/docker-compose.yml` (api + web, rete propria con subnet fissa presa da `ForwardedHeaders__KnownNetworks__0`, web parte quando l'API è `healthy`, `DOCKERHUB_USERNAME` di default `angelo87dock`). `deploy/.env.example`: default utente Docker Hub e subnet `172.29.250.0/24`. `README.md`: sezione Deployment riscritta (immagini, quick start col compose unico, compose separati come alternativa) e riga in Architecture.

**Note:** `DEPLOY.md` non aggiornato (descrive ancora i due compose). I due compose separati restano. Da provare su un host Docker con `docker compose config` e `up -d`. Nessun commit.


## 2026-10-30

### PWA, step 5: documentazione, nginx e `PLAN-pwa.md` rimosso

**Perché:** ultimo step del piano PWA, con il via dell'utente (che ha chiesto anche di cancellare il piano a lavoro concluso).

**Cosa:** `src/SagreEventi.Web/nginx.conf`: location esatte con `Cache-Control: no-cache` per `ngsw.json`, `ngsw-worker.js`, `safety-worker.js`, `worker-basic.min.js`. Prima `ngsw-worker.js` rientrava nella regola dei `.js` con cache di un anno (`immutable`): i client non avrebbero visto le nuove versioni. `DEPLOY.md`: nuova sezione «PWA: installazione, offline e aggiornamenti» (HTTPS, solo build di produzione, file da non mettere in cache, come si aggiorna, controlli con `curl`), voce nella verifica finale, due righe nei problemi frequenti. `README.md`: punto «Installable (PWA)» nelle funzionalità e sezione «Progressive web app» con i tre screenshot di `docs/screenshots/`. Cancellato `PLAN-pwa.md` (tutti gli step conclusi; la storia resta qui).

**Note:** non ho potuto validare il `nginx.conf` con `nginx -t` (nessun nginx locale usato): la sintassi aggiunta è semplice, ma conviene un `docker exec sagreeventi-web nginx -t` dopo il prossimo deploy. Nessun commit.


### Toast rosso quando una pagina non si può caricare (offline)

**Perché:** offline, aprire una pagina non ancora scaricata (con `ng serve`, senza service worker) non dava nessun segnale all'utente, solo l'errore in console.

**Cosa:** nuovo `core/errore-navigazione.service.ts` (+ `.spec.ts`, 3 test): ascolta `NavigationError` del router e mostra un toast `error` che resta finché l'utente non lo chiude (`sticky`): «Sei offline» se `!store.online()`, altrimenti «Pagina non caricata». Avviato da `AppComponent` (`inject` nel costruttore). Build ok, 294 test ok.

**Note:** in produzione con il service worker le pagine sono in cache, quindi il caso è raro. Resta lo step 5 (documentazione e README). Nessun commit.


### Sync: icona wifi barrato quando l'app è offline

**Perché:** nello screenshot offline per il README non si capiva che mancasse la rete (l'icona restava `pi-sync`).

**Cosa:** `sync-status.component.html`: con `!store.online()` mostra `pi-wifi` (classe `sync-senza-rete`) al posto di `pi-sync`; `styles.css`: diagonale che barra l'icona (`::after`) e ambra più chiaro sui temi scuri (`.app-dark .sync.is-offline`). Il badge delle modifiche da inviare resta. Screenshot in `docs/screenshots/`: nuovo `pwa-online-home.png` per il confronto, `pwa-offline-home.png` rifatto con la nuova icona (nella prova l'evento `offline` è emesso a mano: l'emulazione di Puppeteer non cambia `navigator.onLine`). Build e 291 test ok.

**Note:** resta lo step 5 (documentazione e README). Nessun commit.


### Mobile: toast e titolo sistemati, screenshot rifatti

**Perché:** i due difetti emersi nello step 4 (toast tagliati e sopra la barra in basso; titolo "Sagre & Eventi" su due righe con sync + aggiornamento). Gli screenshot per il README ora sono corretti.

**Cosa:** `src/SagreEventi.Web/src/styles.css` (dopo «Navigazione mobile»): `.brand-nome` su una riga; sotto 900px gap ridotti e `.p-toast.p-toast-bottom-right` a tutta larghezza (0.75rem ai lati) a 5rem dal fondo, sopra la barra; sotto 420px titolo un po' più piccolo. Build ok. `docs/screenshots/pwa-offline-home.png` e `pwa-aggiornamento.png` rifatti a 390px con backend finto che risponde 200 (niente toast 503).

**Note:** la voce qui sotto, sui difetti negli screenshot, è superata. Resta lo step 5 (documentazione e README). Nessun commit.


### Screenshot della PWA salvati per il README

**Perché:** richiesta dell'utente: conservare gli screenshot della prova per integrarli nel `README.md` durante lo step 5.

**Cosa:** nuova cartella `docs/screenshots/` con `pwa-offline-home.png` (home aperta con la rete spenta) e `pwa-aggiornamento.png` (icona di aggiornamento e toast). Copie degli originali nella scratchpad; il `README.md` non è ancora stato toccato.

**Note:** in entrambi gli screenshot compaiono i due difetti emersi nello step 4 (toast tagliati a sinistra e sopra la barra in basso; titolo su due righe nello screenshot dell'aggiornamento) e un toast d'errore 503 dovuto al backend finto della prova: se si sistemano, conviene rifarli prima di pubblicarli nel README. Nessun commit.


### PWA, step 4: prova end-to-end (nessuna modifica al codice)

**Perché:** step 4 di `PLAN-pwa.md`: verificare in un browser vero service worker, offline e aggiornamento.

**Come:** build di produzione servita da un piccolo server statico su `localhost:8080` (fallback SPA, `/api` simulato con 503, `ngsw.json`/`index.html` senza cache) e Chrome pilotato con `puppeteer-core` (viewport 390×800), tutto nella scratchpad, fuori dal repository.

**Risultati (tutti ok):** manifest collegato e app installabile secondo Chrome (nessun errore di installabilità); service worker attivo e pagina controllata; cache `ngsw:` create. Con la rete spenta: home, `/eventi` (rotta lazy), `/informazioni` si aprono; icone e `config.json` serviti dalla cache; font di PrimeIcons disponibile. Aggiornamento: con una «versione B» (index.html e `ngsw.json` modificati) l'icona `pi-download` e il toast compaiono; il clic ricarica sulla versione B e l'icona sparisce.

**Note sulla prova:** un controllo preliminare («prima dell'aggiornamento la pagina è A») è fallito, ma è un limite del test (`fetch('/')` dalla pagina riceveva già la B mentre l'aggiornamento era in corso), non dell'app. Un primo tentativo era fallito perché il profilo di Chrome era in un percorso troppo lungo (cache non apribile): problema dell'ambiente di prova.

**Problemi emersi (da decidere):** (1) su mobile (390 px) i toast escono tagliati a sinistra e coprono la barra di navigazione in basso; (2) con le icone sync e aggiornamento il titolo «Sagre & Eventi» va a capo su due righe. Non risolti, nessun commit.


### PWA, step 3: avviso di nuova versione (`PLAN-pwa.md`)

**Perché:** richiesta dell'utente: avvisare quando il service worker ha scaricato una nuova versione, con un'icona nella topbar (non solo un toast).

**Cosa:** nuovo `core/aggiornamento-app.service.ts`: ascolta `SwUpdate.versionUpdates` (solo `VERSION_READY`, solo se il service worker è attivo), espone il signal `disponibile` e mostra un toast informativo di 8 s; `aggiorna()` attiva la versione e ricarica la pagina (anche se l'attivazione fallisce). `app.component.html`/`.ts`: icona `pi-download` (cerchio pieno nel colore principale) a destra del sync, visibile solo se `disponibile()`, con `aria-label`/`title` «Aggiornamento disponibile: clicca per aggiornare». `styles.css`: classe `.aggiornamento`. `aggiornamento-app.service.spec.ts`: 6 test (stato iniziale, versione pronta, altri eventi ignorati, service worker spento, attivazione + ricarica, ricarica anche se l'attivazione fallisce).

**Verifica:** `ng build` ok senza warning; 291/291 test verdi. Il comportamento reale con un service worker vero si prova nello step 4; l'aspetto dell'icona non l'ho visto nel browser.

**Note:** nessun controllo periodico degli aggiornamenti per un'app lasciata aperta a lungo: il service worker verifica all'avvio e a ogni navigazione. Nessun commit.


### PWA, step 1 e 2: icone, manifest, service worker (`PLAN-pwa.md`)

**Perché:** richiesta dell'utente: rendere l'app una PWA installabile con uso offline; piano in `PLAN-pwa.md`, step 1 e 2 approvati.

**Cosa (step 1):** `public/icons/`: `icon-192.png`, `icon-512.png` (angoli arrotondati), `icon-maskable-512.png` (sfondo pieno, festone nella zona sicura), `apple-touch-icon.png` (180), generate dal `favicon.svg` con uno script usa-e-getta (`sharp`, fuori dal repo). `manifest.webmanifest`: `id`, `scope`, `orientation`, `categories`, icone SVG + PNG (any e maskable), scorciatoia «Segnala un evento» (`/eventi/nuovo`). `src/index.html`: `apple-touch-icon`, meta `mobile-web-app-capable` / `apple-mobile-web-app-*`; lo script che applica il tema prima del primo render ora conosce tutti i temi (prima solo `dark`: Halloween e Natale scuro avrebbero fatto un lampo chiaro).

**Cosa (step 2):** `@angular/service-worker@21.2.25` (dipendenza); nuovo `ngsw-config.json`: gruppo `app` in prefetch (JS, CSS, index, manifest, favicon), gruppo `assets` lazy (icone, font di PrimeIcons, immagini), `dataGroups` con `/config.json` in strategia freshness (rete prima, timeout 3 s, poi cache), `navigationUrls` che esclude `/api` e i file con estensione; `angular.json`: `serviceWorker: "ngsw-config.json"` solo nella configurazione `production`; `app.config.ts`: `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' })`. Le chiamate `/api` non passano dalla cache del service worker: i dati restano gestiti dallo store offline-first.

**Verifica:** `ng build` ok senza warning: `ngsw.json` generato con 42 file in prefetch, icone/font tra gli asset lazy; 285/285 test verdi. Non ho ancora provato il service worker in un browser (step 4).

**Da fare:** step 3 (avviso «Nuova versione disponibile»), 4 (prova end-to-end con rete spenta), 5 (documentazione e cache HTTP di `ngsw.json`). Finché manca lo step 3, dopo un deploy gli utenti vedono la nuova versione solo alla visita successiva. Nessun commit.


### Temi Pasqua e Ferragosto

**Perché:** richiesta dell'utente: aggiungere solo Pasqua e Ferragosto (Capodanno ed Epifania scartati: si sovrapporrebbero al Natale e avrebbero finestre troppo brevi).

**Cosa:** `core/theme.service.ts`: temi `pasqua` e `ferragosto` (chiari, solo classe propria); `STAGIONI` ora è una tabella di funzioni (`periodo(da, a)` per i periodi fissi): Ferragosto 1–20 agosto, Pasqua dalla Domenica delle Palme (7 giorni prima) al lunedì dell'Angelo (1 giorno dopo); nuova funzione esportata `pasqua(anno)` (algoritmo di Meeus/Jones/Butcher). `app.component.ts`: voci «Tema Pasqua» (icona `icona-uovo`) e «Tema Ferragosto» (`icona-ombrellone`), in ordine di calendario. `styles.css`: icone SVG-maschera `.icona-uovo` (uovo con fascia a zigzag) e `.icona-ombrellone`; blocchi `html.app-pasqua` (pastelli: primario lilla `#7048b8`, giallo pulcino, verde prato) e `html.app-ferragosto` (sabbia chiara e mare: primario turchese `#0a7c8c`, corallo, giallo sole). `theme.service.spec.ts`: Pasqua calcolata per 2024-2027, confini delle finestre, test che la finestra segua la Pasqua dell'anno, classi dei due temi.

**Verifica:** `ng build` ok senza warning; 285/285 test verdi. App non aperta nel browser: palette, icone a 16 px e contrasti sono scelti a occhio, da controllare a schermo (i due temi sono visibili solo cambiando la data del dispositivo: 1–20 agosto o attorno a Pasqua).

**Note:** la Pasqua 2027 cade il 28 marzo. Nessun commit.


### Temi Halloween e Natale solo nel loro periodo

**Perché:** richiesta dell'utente: i temi stagionali devono essere visibili solo a ridosso delle festività.

**Cosa:** `core/theme.service.ts`: tabella `STAGIONI` (Halloween 15 ottobre – 2 novembre; Natale chiaro e scuro 1 dicembre – 6 gennaio, a cavallo d'anno) e funzione esportata `inStagione(tema, oggi = new Date())`. `iniziale()`: un tema stagionale salvato ma fuori periodo non viene applicato e si ricade sulla preferenza del sistema (chiaro/scuro); un valore sconosciuto resta «chiaro». `app.component.ts`: `vociTema` mostra solo i temi per cui `inStagione` è vero. `theme.service.spec.ts`: la data è fissata con `vi.useFakeTimers({ toFake: ['Date'] })` (30 ottobre di default, 20 dicembre per i test di Natale); nuovi test sui confini delle date (11 casi) e sul ritorno alla preferenza di sistema fuori stagione.

**Verifica:** `ng build` ok senza warning; 267/267 test verdi. App non aperta nel browser.

**Note:** la disponibilità si valuta al caricamento dell'app: se resta aperta a cavallo della fine del periodo, il tema in uso non cambia finché non si ricarica. La scelta salvata non viene cancellata fuori stagione, quindi l'anno dopo il tema ricompare. Nessun commit.


### Temi Natale definitivi e icone SVG uniformi per i temi stagionali

**Perché:** richiesta dell'utente: tenere Halloween e Natale (chiaro e scuro) e avere icone tutte simili, monocromatiche, al posto dell'emoji.

**Cosa:** `styles.css`: le classi `.icona-zucca` e `.icona-albero` usano un SVG disegnato a mano come maschera CSS (`mask` / `-webkit-mask` con data URI, `background-color: currentColor`): prendono il colore del testo come le icone PrimeIcons, anche in hover e voce attiva; sostituiscono l'emoji 🎃. Tolti i marcatori `TEMP preview` dai blocchi `html.app-natale` / `html.app-natale-scuro` (ora commenti descrittivi). `app.component.ts`: Natale chiaro e scuro usano `icona-albero` (era `pi-gift`). `theme.service.spec.ts`: Natale nei temi salvati e due test sulle classi (`app-natale` senza `app-dark`; `app-natale-scuro` con `app-dark`).

**Verifica:** `ng build` ok senza warning; 254/254 test verdi. App non aperta nel browser: da controllare che zucca e albero si leggano bene a 16 px (sono disegni semplici fatti a mano) e che i colori dei temi siano leggibili.

**Ritocco dimensioni (segnalazione dell'utente: le icone sembravano più piccole di sole e luna):** `.icona-zucca` / `.icona-albero` con `font-size: 1rem` (come `.pi`, invece di ereditare la dimensione del testo) e riquadro dell'icona da `1em` a `1.2em`. Valori a occhio, da verificare a schermo.

**Note:** le maschere CSS sono supportate dai browser moderni (con prefisso `-webkit-` dove serve). Nessun commit.


### Tolto il tema seppia; zucca 🎃 per Halloween

**Perché:** richiesta dell'utente: la seppia somigliava troppo al Natale chiaro; usare l'emoji della zucca per Halloween.

**Cosa:** `core/theme.service.ts`: rimossi `'sepia'` da `Tema`, `TEMI`, `CLASSI_TEMA` e il signal derivato `seppia`. `app.component.ts`: tolta la voce «Tema seppia»; Halloween usa la classe `icona-zucca` al posto di `pi-star-fill`. `styles.css`: rimosso il blocco `.app-seppia`; aggiunta `.icona-zucca::before { content: '🎃' }`, così l'emoji sta nello stesso elemento delle icone PrimeIcons, nel menu e nel pulsante, con lo stesso allineamento. `theme.service.spec.ts`: test riadattati ai temi rimasti (scuro, classi per dark/halloween/light) + test che un valore salvato `sepia` torni al tema chiaro (gli utenti che l'avevano scelto).

**Verifica:** `ng build` ok senza warning; 250/250 test verdi. App non aperta nel browser.

**Note:** l'anteprima Natale (voci in `TEMI_MENU`, blocchi `TEMP preview` in `styles.css`) è ancora provvisoria. Nessun commit.


### Tema Halloween definitivo (e anteprima Natale)

**Perché:** richiesta dell'utente: tenere Halloween; vedere un tema Natale in versione chiara e scura.

**Cosa (definitivo, Halloween):** `core/theme.service.ts`: `Tema` esteso; elenco `TEMI_SCURI` (i temi che usano le superfici scure di PrimeNG: dark, halloween, natale-scuro) e mappa `CLASSI_TEMA` (classe `app-<tema>` per ogni palette), effect generico al posto dei toggle singoli. `app.component.ts`: voce «Tema Halloween» in `TEMI_MENU` (icona `pi-star-fill`, segnaposto: PrimeIcons non ha una zucca). `styles.css`: blocco `html.app-halloween` (viola scuro, testo crema, primario arancio zucca; il prefisso `html.` serve a prevalere sulle variabili che PrimeNG inietta). `theme.service.spec.ts`: halloween nei temi salvati + test su classe `app-dark`/`app-halloween` (+1 test).

**Cosa (anteprima provvisoria, Natale):** in `ThemeService` i valori `natale` e `natale-scuro`; in `TEMI_MENU` «Tema Natale chiaro» / «Tema Natale scuro» (icona `pi-gift`); in `styles.css` due blocchi marcati `TEMP preview` (`html.app-natale`: crema, rosso e verde abete; `html.app-natale-scuro`: verde notte con primario oro). Per Natale non ci sono ancora test né voce definitiva in questa nota.

**Verifica:** `ng build` ok senza warning; test verdi. App non aperta nel browser. Nessun commit.


### Tema seppia definitivo

**Perché:** richiesta dell'utente: rendere definitivo il tema seppia mostrato in anteprima.

**Cosa:** `core/theme.service.ts`: il servizio gestisce `Tema = 'light' | 'dark' | 'sepia'` (signal `tema`, `scuro` e `seppia` derivati); nuovo `imposta(tema)` al posto di `alterna()` (rimosso), persistenza in `localStorage` come prima (valore sconosciuto → chiaro; senza scelta salvata segue il sistema chiaro/scuro); l'effect applica `app-dark` / `app-seppia` al `<html>`. `app.component.ts`: tolto il codice di anteprima (segnale, `DOCUMENT`, `applicaSeppia`...); costante `TEMI_MENU` con le tre voci, `vociTema` e `temaCorrente` derivati da essa. `app.component.html`: icona e `aria-label` del pulsante dal tema corrente. `styles.css`: blocco `.app-seppia` (variabili `--bg`, `--card`, `--ink`, `--ink-soft`, `--line*` e due variabili PrimeNG per contenuto e campi), marcatore TEMP tolto. `core/theme.service.spec.ts` riscritto per tre temi (+2 test).

**Verifica:** `ng build` ok senza warning; 247/247 test verdi. App non aperta nel browser.

**Note:** colori fissi nel CSS che non seguono le variabili (es. arancio/rosso dello stato sync) non sono stati rivisti nel tema seppia. Nessun commit.


### Topbar: margini tra i gruppi

**Perché:** richiesta dell'utente: più spazio tra «Segnala» e sync e tra tema e menu `⋮`, senza altri divisori per ora.

**Cosa:** `styles.css`: `.cta-desktop { margin-right: 0.5rem }` (gap totale ≈ 1rem dopo «Segnala»); nuova `.menu-azioni { margin-left: 0.25rem }` applicata al `p-button` `⋮` in `app.component.html`.

**Verifica:** `ng build` ok senza warning. App non aperta nel browser: i valori sono un primo tentativo da ritoccare a vista (il `p-menu` popup è un elemento in più nel flex e può aggiungere un gap suo). Nessun commit.

**Secondo ritocco:** `.topbar-sep` margin-inline `0.75rem 0` (era `0.6rem` per lato): il pulsante del tema ha ~0.75rem di spazio interno prima dell'icona, mentre il sync ha il bordo visibile, quindi per un'aria visivamente uguale ai due lati (≈1.25rem) il margine va tutto dal lato del sync.

**Ritocco (dopo lo screenshot dell'utente):** `.cta-desktop` margin-right 0.75rem; `.topbar-sep` margin-inline da 0.25rem a 0.6rem. Lo spazio tra tema e `⋮` era già sufficiente e non è stato toccato.


### Tema: da pulsante con label a menu «Tema chiaro / Tema scuro»

**Perché:** richiesta dell'utente (dopo l'anteprima): scelta esplicita del tema con un menu, icona che riflette il tema attuale.

**Cosa:** `app.component.html`: il pulsante del tema ora mostra solo `pi-sun` (tema chiaro) o `pi-moon` (tema scuro) e apre un `p-menu` popup (`menuTema`). `app.component.ts`: `vociTema` (computed) con «Tema chiaro» / «Tema scuro», la voce attiva ha `styleClass` `voce-attiva`; `impostaTema()` chiama `ThemeService.alterna()` solo se il tema richiesto è diverso dall'attuale (il servizio non è cambiato). `styles.css`: rimosse le regole `.btn-tema` (label nascosta su mobile), aggiunta `.p-menu .voce-attiva .p-menu-item-label` (grassetto + colore primario).

**Verifica:** `ng build` ok senza warning; 245/245 test verdi. Nessun test per il menu; app non aperta nel browser.

**Note:** possibile evoluzione: voce «Automatico» (segue il sistema), che richiederebbe un metodo esplicito in `ThemeService`. Nessun commit.


### Topbar: menu a tre puntini con Accedi/Esci e Informazioni

**Perché:** richiesta dell'utente: raccogliere accesso e informazioni in un menu con i testi, per una topbar più pulita. Il tema resta nella topbar.

**Cosa:** `app.component.html`: tolti il link «Accedi», il pulsante «Esci» e l'icona «Informazioni»; aggiunti un `p-button` `pi-ellipsis-v` (`ariaLabel` «Menu», `aria-haspopup`) e un `p-menu` popup (`appendTo="body"`). `app.component.ts`: `MenuModule` negli `imports` e `voci` (`computed<MenuItem[]>`): «Accedi» (`/login`) oppure «Esci (email)» (chiama `esci()`), poi «Informazioni» (`/informazioni`). `styles.css`: rimossa `.btn-icona`, ora inutilizzata. Ordine topbar: Segnala · sync | tema · menu.

**Verifica:** `ng build` ok senza warning; 245/245 test verdi. Nessun test sul menu (il progetto non ha spec per `AppComponent`); app non aperta nel browser.

**Da fare:** provare nel browser apertura/chiusura del menu, voce attiva, login/logout. Nessun commit.


### Pulsante sync alto come le altre icone

**Perché:** richiesta dell'utente: uniformare le dimensioni nella topbar.

**Cosa:** `styles.css`: `.sync` da 2.25rem a 2.5rem (larghezza e altezza), come `.btn-icona`.

**Verifica:** `ng build` ok senza warning. App non aperta nel browser. Nessun commit.


### Sync spostato dopo il divisorio della topbar

**Perché:** richiesta dell'utente: il sync è ora un'icona come le altre, meglio nel gruppo di strumenti.

**Cosa:** `app.component.html`: `<app-sync-status />` spostato da prima di «Segnala» a dopo il divisorio; ordine: Segnala | sync · tema · accedi/esci · informazioni.

**Ripensamento (stesso giorno):** su richiesta dell'utente il sync è stato rimesso prima del divisorio, subito dopo «Segnala»: ordine finale Segnala · sync | tema · accedi/esci · informazioni.

**Verifica:** `ng build` ok senza warning. App non aperta nel browser. Nessun commit.


### Badge numerico sull'icona di sync

**Perché:** richiesta dell'utente: mostrare «N da inviare» senza dover aprire il tooltip.

**Cosa:** `sync-status.component.html`: `<span class="sync-badge">` (aria-hidden, il numero è già nell'`aria-label`) con `store.daInviare()`, visibile solo se > 0, «99+» oltre 99. `styles.css`: `.sync` con `position: relative`; `.sync-badge` pallino con colore primario in alto a destra.

**Verifica:** `ng build` ok senza warning. App non aperta nel browser. Nessun commit.


### Stato sync: solo icona e toast in caso di errore

**Perché:** richiesta dell'utente: l'indicatore con testo («Aggiornato») diventa solo icona; gli errori di sincronizzazione vengono segnalati con un avviso.

**Cosa:** `shared/sync-status.component.html`: tolto il testo; `aria-label` e `title` ora «stato breve · dettaglio» (es. «Aggiornato · Ultima sincronizzazione alle 15:30»). `sync-status.component.ts`: `effect` che alla comparsa di `erroreSync` mostra un toast `error` («Sincronizzazione non riuscita» + dettaglio, 8 s) con il `MessageService` già registrato (il `p-toast` è in `app.component.html`). `styles.css`: `.sync` diventa un cerchio 2.25rem; rimossa la regola `.sync-testo`. Restano i colori: arancio offline, rosso errore.

**Verifica:** `ng build` ok senza warning; 245/245 test verdi. Nessun test per il nuovo effect; app non aperta nel browser.

**Note:** il numero di modifiche «N da inviare» si legge solo nel tooltip. Se ogni sync automatico fallisce, il toast può ripresentarsi a ogni tentativo. Nessun commit.


### Topbar: separatore dopo «Segnala» e icona utente per «Accedi»

**Perché:** richiesta dell'utente (dopo la mia valutazione): distinguere l'azione principale dal gruppo di icone e rendere più chiara l'icona di accesso.

**Cosa:** `app.component.html`: `<span class="topbar-sep">` (`aria-hidden`) tra «Segnala» e il tema; «Accedi» usa `pi-user` invece di `pi-sign-in`. `styles.css`: `.topbar-sep` (linea verticale 1px × 1.5rem, `--line-strong`), visibile solo da 900px come «Segnala».

**Verifica:** `ng build` ok senza warning. App non aperta nel browser. Nessun commit.


### Riordino della topbar e «Accedi» solo icona

**Perché:** richiesta dell'utente: ridurre l'ingombro e spostare «Informazioni» in fondo, dopo «Segnala».

**Cosa:** `app.component.html`, `topbar-azioni`: nuovo ordine sync · Segnala · Tema (icona + label) · Accedi/Esci · Informazioni. «Accedi» è ora solo icona (`btn-icona`, `aria-label` e `title` «Accedi»).

**Verifica:** `ng build` ok senza warning. App non aperta nel browser.

**Note:** la richiesta poteva leggersi in più modi; ho messo Informazioni all'estrema destra, dopo Accedi/Esci. Nessun commit.


### Label sul pulsante del tema

**Perché:** richiesta dell'utente: aggiungere una label all'icona del tema.

**Cosa:** `app.component.html`: `[label]` «Tema scuro» / «Tema chiaro» (la modalità a cui si passa, coerente con l'`aria-label`) e `styleClass="btn-tema"` sul `p-button`; `styles.css`: `.btn-tema .p-button-label` nascosta sotto i 900px (resta la sola icona, per non affollare la topbar mobile) e visibile da 900px.

**Verifica:** `ng build` ok senza warning. App non aperta nel browser: da controllare che il selettore sulla label di PrimeNG agisca davvero. Nessun commit.


### Footer tolto, «Informazioni» come icona nella topbar

**Perché:** richiesta dell'utente: il footer era ridotto a una riga e il nome app è già nella topbar.

**Cosa:** `app.component.html`: rimosso `<footer>`; in `topbar-azioni`, tra il tema e Accedi/Esci, link `pi-info-circle` a `/informazioni` (`aria-label`/`title` «Informazioni», `routerLinkActive="attivo"`). `styles.css`: rimosse le regole `.footer*`; aggiunte `.btn-icona` (2.5rem tondo) e `.btn-icona.attivo`; `main` senza i 140px riservati al footer nel `min-height` e `padding-bottom` mobile da 5rem a 6rem, perché la barra in basso non copra la fine delle pagine.

**Verifica:** `ng build` ok senza warning; 245/245 test verdi. App non aperta nel browser.

**Da fare:** controllare su mobile stretto (≤480px) che la topbar non sia affollata e che la barra in basso non copra il fondo delle pagine. Nessun commit.


### «Informazioni»: Licenza e Codice sorgente in due blocchi

**Perché:** richiesta dell'utente: spaziare meglio la sezione e separare licenza e codice sorgente.

**Cosa:** `informazioni.component.html`: due `<section>` («Licenza» con pulsante «Leggi la licenza» → `LICENSE`; «Codice sorgente» con «Repository su GitHub»); nuovo `informazioni.component.css` (griglia `auto-fit` min 18rem, due colonne su desktop e una su mobile; ogni blocco è una card come il resto dell'app, con gap verticale); `styleUrl` aggiunto al componente.

**Verifica:** `ng build` ok senza warning. App non aperta nel browser. Nessun commit.


### «Informazioni» a tutta larghezza

**Perché:** richiesta dell'utente: il testo non deve essere limitato a circa 2/3 dello spazio.

**Cosa:** `informazioni.component.html`: tolta `pagina-stretta` (max 760px) dal contenitore e aggiunta `larga` al paragrafo introduttivo (come in revisione e amministrazione), che toglie il limite di 60ch.

**Verifica:** `ng build` ok. App non aperta nel browser. Nessun commit.


### Pagina «Informazioni» (licenza e GitHub)

**Perché:** richiesta dell'utente: raccogliere licenza e link a GitHub in una pagina dedicata, per topbar e footer più puliti. Nessun file di piano, su sua indicazione.

**Cosa:** nuovo `features/informazioni/informazioni.component.{ts,html}` (rotta lazy `/informazioni` in `app.routes.ts`, titolo «Informazioni · Sagre & Eventi»): descrizione dell'app, link alla licenza MIT (`blob/main/LICENSE`) e pulsante «Repository su GitHub». `app.component.html`: tolta l'icona GitHub dalla topbar; il footer ora è una riga «Sagre & Eventi · Informazioni» (il testo descrittivo è passato nella pagina); `styles.css`: rimosse `.btn-icona`, `.footer-link`, `.badge-licenza`, ormai inutilizzate.

**Verifica:** `ng build` ok senza warning; 245/245 test verdi. Nessuno spec per il nuovo componente (come per le altre pagine, che non ne hanno). App non aperta nel browser.

**Note:** la pagina non è nel menu di navigazione, solo nel footer. Nessun commit.


### Icona GitHub spostata nella topbar

**Perché:** richiesta dell'utente: il logo GitHub, solo icona e con link, nella topbar invece che nel footer.

**Cosa:** `app.component.html`: link `pi-github` (solo icona, `aria-label`/`title` «Codice sorgente su GitHub») in `topbar-azioni`, tra il tema e Accedi/Esci; tolto dal footer, dove resta solo il badge MIT. `styles.css`: nuova classe `.btn-icona` (2.5rem tondo).

**Verifica:** `ng build` ok senza warning. App non aperta nel browser.

**Da fare:** controllare su mobile stretto (≤480px) che la topbar non sia affollata. Nessun commit.


### Footer: icona GitHub e badge licenza MIT

**Perché:** richiesta dell'utente: sostituire la riga testuale «Open source con licenza MIT. Codice sorgente» con elementi più riconoscibili.

**Cosa:** `app.component.html`: nel footer due link affiancati, `pi-github` + «Codice sorgente» (repository) e un badge «Open source · MIT» (`pi-lock-open`, `aria-label` con testo completo) che porta a `blob/main/LICENSE` su GitHub. `styles.css`: nuove regole `.footer-link` e `.badge-licenza` (flex con wrap, badge arrotondato con bordo `--line`). Icone locali di PrimeIcons, nessuna risorsa esterna (la PWA resta offline).

**Verifica:** `LICENSE` presente alla radice del repo; classi icona presenti in `primeicons.css`; `ng build` ok senza warning. Test non rieseguiti (modifica solo di template/CSS), app non aperta nel browser.

**Note:** il link al `LICENSE` assume il ramo `main`. Nessun commit.


### Tolti i pulsanti «Segnala un evento» dagli stati vuoti

**Perché:** richiesta dell'utente (seguito della voce sotto): con le liste vuote si vedevano ancora 2-3 pulsanti uguali (topbar, hero, stato vuoto).

**Cosa:** rimosso il pulsante dall'`<app-empty-state>` di home («Nessun evento in programma»), `eventi-list` («Ancora nessun evento») e agenda («L'agenda è vuota»); resta il testo di invito. In `eventi-list.component.ts` tolto `RouterLink` (import e array `imports`), ormai inutilizzato (warning NG8113). Restano: «Segnala» nella topbar desktop, «+» mobile, pulsante dell'hero in home.

**Verifica:** `ng build` senza warning; 245/245 test verdi. App non aperta nel browser.

**Note:** nessun commit.


### Tolti i pulsanti «Segnala un evento» dalle intestazioni di eventi e agenda

**Perché:** richiesta dell'utente: eliminare la ridondanza con il «Segnala» sempre visibile (topbar desktop, «+» mobile). Il pulsante nella topbar è stato mantenuto.

**Cosa:** rimosso il link nell'`<header class="pagina-testa">` di `features/eventi/eventi-list/eventi-list.component.html` e `features/agenda/agenda.component.html`. Restano i pulsanti negli stati vuoti e quelli della home. `RouterLink` negli `imports` serve ancora (stato vuoto / link alle voci).

**Verifica:** `ng build` ok, nessun warning. Test non eseguiti, app non aperta nel browser.

**Da fare:** controllare a vista che l'intestazione con solo il titolo sia ben allineata (`.pagina-testa`). Nessun commit.


### Formato `x.component.*` (correzione di `x.page.*`)

**Perché:** richiesta dell'utente: il formato giusto è `x.component.ts` / `.html` / `.css`, non `x.page.*`; piano `PLAN-rinomina-component.md` (3 step), poi eliminato a lavoro finito.

**Cosa:** in `src/SagreEventi.Web/src`: tutti i 16 componenti rinominati (11 pagine in `features/`, `shared/empty-state|evento-card|festone|sync-status`, `app`) con `.ts`/`.html`/`.css` `x.component.*`; `templateUrl`/`styleUrl` aggiornati; classi con suffisso `Component` (`AgendaPage` → `AgendaComponent`, `EmptyState` → `EmptyStateComponent`, `App` → `AppComponent`, ecc.); selettori delle 11 pagine senza `-page` (`app-agenda`; quelli di `shared/` e `app-root` invariati); import e array `imports` dei componenti, `app.routes.ts` (percorsi e nomi di classe) e `main.ts` (bootstrap) aggiornati. `README.md` (frase sulla struttura) e `COMMITS-DA-FARE.md` allineati. I file `*.spec.ts` non c'entrano e non sono cambiati.

**Verifica:** nessun residuo di `.page`, `*Page` o `-page` nei sorgenti; `ng build` produzione (AOT, `strictTemplates`) e `tsc` sui test ok; 245/245 test verdi. Confronto con la build di prima della rinomina: non più identica byte per byte, come atteso (cambiano i nomi delle classi esportate dai chunk delle rotte, i selettori e i nomi minificati). Il confronto strutturale (nomi minificati e alias neutralizzati) lascia 2 chunk su 14 con differenze nella sola riga di `import{...}` (il numero di alias `a as b` dipende dai nomi minificati): non ho potuto dimostrare l'identità completa, ma non ho trovato differenze di altro tipo. Non ho aperto l'app nel browser.

**Da fare a mano:** nel template di regole esterno le regole del frontend citano `x.page.*` e il selettore `app-<nome>-page`: vanno corrette in `x.component.*` e `app-<nome>`. Nessun commit.


### Tolte «Project scope (v1)» e «About» dal README

**Perché:** richiesta dell'utente (dopo «What's next»).

**Cosa:** `README.md`: rimosse le sezioni «Project scope (v1)» (In scope / Out of scope) e «About». Il commento HTML con i topic del repository GitHub, che stava in fondo a «About», è rimasto in fondo al file (non visibile). Il README ora termina con Resources, Contributing e License. Nessun link interno puntava alle sezioni tolte (l'indice in cima non le citava).

**Note:** i limiti di cui parlava «Out of scope» (nessuna registrazione pubblica, nessuna cancellazione di eventi) restano descritti in Overview, Features e API. Solo documentazione. Nessun commit.


### Tolta la sezione «What's next» dal README

**Perché:** richiesta dell'utente.

**Cosa:** `README.md`: rimossa la sezione «What's next» (5 voci) dalla parte «Project scope (v1)», che ora finisce con «Out of scope». Nessun link interno puntava alla sezione.

**Note:** solo documentazione. Nessun commit.


### Verifica del `README.md`

**Perché:** richiesta dell'utente: controllare che il README sia aggiornato e completo.

**Cosa:** riletto per intero e confrontato con `appsettings.json`, il codice delle opzioni, i file `.csproj`/`package.json` e la struttura reale. Già coerenti: architettura, tabella dei progetti, workflow, sezione di deploy, comandi di build e test. Corretto: aggiunta la chiave `Eventi:RichiesteStatiAlMinuto` (30, limite per IP di `GetStati`, presente in `appsettings.json` e nel codice ma assente dalla tabella); «What's next» non prometteva più test della logica di sync già scritti (ora: test di pages e componenti condivisi); tra i prerequisiti Docker con Compose v2, solo per il deploy.

**Note:** solo documentazione. L'avviso «Docker non provato su un host reale» resta vero e resta. Nessun commit.


### Allineamento di `DEPLOY.md` e `COMMITS-DA-FARE.md`

**Perché:** richiesta dell'utente: i due file dovevano riflettere lo stato attuale.

**Cosa:** `DEPLOY.md`: «Aggiornamenti successivi» usava ancora `up -d --build` (avrebbe costruito in locale ignorando le immagini scaricate), ora `pull` + `up -d`, con una nota sull'alternativa di costruire dal repository; percorso del `cp` in `sites-available/` corretto rispetto alla cartella `deploy/`; passo 1 precisa che per il deploy bastano i file di `deploy/`. `COMMITS-DA-FARE.md`: intestazione e titolo del commit 1 aggiornati, elenco di ciò che contiene (inclusi `npm audit fix` e le due correzioni di `ics.ts` e interceptor), virgola mancante sistemata.

**Note:** solo documentazione. Nessun commit.


### Rimossi i piani completati

**Perché:** richiesta dell'utente: togliere i `.md` non più utili.

**Cosa:** eliminati `PLAN-test-frontend.md` e `PLAN-separazione-template.md` (piani completati, mai committati: non recuperabili da git). Il dettaglio resta nelle voci di questo file. Tolti da `COMMITS-DA-FARE.md` (elenco di `git status` e `git add` del commit di documentazione).

**Note:** restano `CLAUDE.md`, `CHANGES.md`, `README.md`, `DEPLOY.md` e `COMMITS-DA-FARE.md` (da cancellare dopo i commit). Nessun commit.


### `npm audit fix` sul frontend

**Perché:** `CLAUDE.md` chiede pacchetti senza vulnerabilità note; `npm audit` segnalava 2 vulnerabilità su `undici` (1 alta, 1 moderata), portate da `@angular/build`. Scelta dell'utente: provare `npm audit fix`.

**Cosa:** solo `src/SagreEventi.Web/package-lock.json`: `undici` 7.29.1 → 7.30.1, `@angular/build` 21.2.28 → 21.2.29 (più `@angular-devkit/core` e `architect` 21.2.29). `package.json` invariato, nessuna major.

**Verifica:** `npm audit`: 0 vulnerabilità; 245/245 test, build di produzione e `tsc` sui test ok. Nessun commit.


### Interceptor: niente token verso URL protocol-relative

**Perché:** difetto segnalato dai test (step 5 del piano test): con `apiBaseUrl` vuoto un URL `//host/...` riceveva il token Bearer. Decisione dell'utente: correggere.

**Cosa:** `src/SagreEventi.Web/src/app/core/auth.interceptor.ts`: il token si aggiunge solo se l'URL inizia con `${apiBaseUrl}/` **e non** con `//`. `auth.interceptor.spec.ts`: il test `it.fails` è diventato un normale `it`.

**Verifica:** 245/245 test verdi (nessun `expected fail`), build di produzione e `tsc` sui test ok. Nessun commit.


### Separazione template/stili (piano `PLAN-separazione-template.md` completato) e cartelle di `features/eventi`

**Perché:** richiesta dell'utente: struttura uniforme, `.ts` / `.html` / `.css` separati per tutti i componenti con template inline.

**Fatto:** i 16 componenti (11 pages in `features/`, `app.ts`, 4 in `shared/`): `template:` → `templateUrl`, `styles:` → `styleUrl`, file `.html`/`.css` accanto al `.ts` con lo stesso nome base; solo l'indentazione di 4 spazi tolta. Estrazione con uno script fuori dal repository (verifica backslash, `${`, `<pre>`).

**Verifica:** a ogni step la build di produzione senza hash (`--output-hashing none`) è **identica byte per byte** alla baseline presa prima di iniziare (`diff -r` vuoto); 244 test verdi. Il confronto è sensibile: una modifica di prova a un template lo ha fatto fallire (ripristinata).

**Dettagli:** `.css` creato per `gestione`, `mie-segnalazioni`, `amministrazione`, `revisione` (gli unici con `styles`). In `evento-form.page` il literal conteneva `\\'` (barra rovesciata raddoppiata davanti all'apostrofo in `'Segnala l\'evento'`): nel `.html` è diventato `\'`, cioè la stessa espressione Angular; lo script converte solo `\\` in `\` e rifiuta ogni altra sequenza di escape. I due `<textarea>` (`evento-form`, `revisione`) non hanno contenuto tra i tag.

**Cartelle:** su richiesta (opzione 1) le tre pagine di `features/eventi/` sono in `eventi-list/`, `evento-detail/`, `evento-form/` (stesso nome dei file); aggiornati 14 import relativi (`../../../core|shared`) e i 4 `import()` di `app.routes.ts`. Dopo questo spostamento la build non è più identica alla baseline iniziale: cambiano i nomi dei chunk e in un chunk due nomi di variabili minificate (`v`/`g` scambiati); gli step 12-16 sono stati confrontati con la nuova baseline e sono identici.

**Note:** `README.md` (frase sulla struttura dei componenti), `COMMITS-DA-FARE.md` (commit 1 ora comprende anche la separazione e le sottocartelle). Nessun `template:`/`styles:` inline rimasto; 16 `.html` e 4 `.css`; build di produzione e 244 test verdi. Nessun commit.


### Test frontend, step 5-8 (piano `PLAN-test-frontend.md` completato)

**Perché:** richiesta dell'utente: completare i test di `core/`, poi fermarsi.

**Cosa:** nuovi spec in `src/SagreEventi.Web/src/app/core/`: `auth.interceptor.spec.ts`, `eventi-store.service.spec.ts` (persistenza, `crea`/`aggiorna`, selettori, push a blocchi da 20, edit durante l'invio, modifiche protette, pull/`unisci`, esiti a blocchi da 50, errori senza dettagli interni, concorrenza, online/offline), `eventi-api.service.spec.ts`, `revisione.service.spec.ts`, `admin-utenti.service.spec.ts` (con `messaggioErroreApi` e id ostili codificati), `theme.service.spec.ts`. Totale con gli step 0-4: 244 test + 1 `it.fails`. `.github/workflows/build-push.yml`: il job `web` esegue `npm ci` + `npm test` (Node 22) prima di costruire l'immagine. `README.md` (Build and test, tabella Architecture), `DEPLOY.md` (sezione workflow), `COMMITS-DA-FARE.md` (commit 1 con rinomina + test; `PLAN-test-frontend.md` nel commit di documentazione).

**Problema trovato, NON corretto:** `auth.interceptor.ts` con `apiBaseUrl` vuoto accetta ogni URL che inizia per `/`, quindi un URL protocol-relative (`//host/...`) riceverebbe il token Bearer. Oggi nessun codice costruisce URL così (i servizi usano sempre `/api/...`), ma è una difesa mancante. Il test è marcato `it.fails`: passa finché il difetto c'è e diventerà rosso quando lo si corregge (allora va trasformato in `it`). Fix possibile: scartare gli URL che iniziano con `//`.

**Verifica:** 244 test verdi con `TZ` = UTC, Asia/Kolkata, America/Los_Angeles; `ng build` produzione ok; `tsc` sui test pulito; mutazioni temporanee sullo store (limite 20, `>=` nel conflitto, controllo del timestamp) rilevate dai test e poi ripristinate; copertura 100% righe (branch 99,25%). Il workflow non è stato eseguito. `models.ts` (solo tipi) non ha spec.

**Note:** nessun commit. Prossimo passo richiesto dall'utente (non iniziato): separare `.ts`, `.html` e `.css` delle pages.


### Test frontend, step 0-4 (piano `PLAN-test-frontend.md`)

**Perché:** richiesta dell'utente: test `*.spec.ts` per la logica di `core/`; eseguiti gli step 0-4 su 8.

**Cosa:** infrastruttura: `vitest` 4, `jsdom` 27, `@vitest/coverage-v8` in `devDependencies`; target `test` (`@angular/build:unit-test`, runner vitest) in `angular.json`; nuovo `tsconfig.spec.json`; script `npm test` e `npm run test:coverage` (solo informativo); `coverage` ignorato in `.gitignore` e `.dockerignore`. Spec in `src/SagreEventi.Web/src/app/core/`: `evento-utils.spec.ts` (54), `ics.spec.ts` (15), `config.service.spec.ts`, `permessi.service.spec.ts`, `auth.service.spec.ts` (25): 119 test.
**Bug corretto:** `ics.ts`, `esc`: il `;` non veniva escapato (`'\;'` in JS è `;`), ora `'\\;'` (RFC 5545). Il test scritto prima falliva.

**Verifica:** 119/119 verdi anche con `TZ` = UTC, America/Los_Angeles, Asia/Kolkata, Pacific/Auckland; `ng build` produzione ok; `tsc` sul tsconfig dei test pulito. `npm audit`: 2 vulnerabilità (`undici`) già presenti, portate da `@angular/build`, non dai pacchetti aggiunti.

**Note:** mancano gli step 5-8 (interceptor, store, servizi HTTP, CI e documentazione); il workflow GitHub non esegue ancora `npm test`. Nessun commit.


### Rinomina SagreEventi.Web.Angular in SagreEventi.Web

**Perché:** richiesta dell'utente.

**Cosa:** cartella `src/SagreEventi.Web.Angular` spostata in `src/SagreEventi.Web` (contenuto invariato). Riferimenti aggiornati in `.github/workflows/build-push.yml` (context), `deploy/docker-compose.angular.yml` (build), `src/SagreEventi.Web/Dockerfile` (commenti), `README.md`, `DEPLOY.md`, `COMMITS-DA-FARE.md` (ora con il commit di rinomina). Le voci storiche di questo file citano ancora il vecchio nome. Il nome del progetto Angular in `angular.json` (`sagre-eventi-web`) e il percorso `dist/sagre-eventi-web` non cambiano; la cartella non è nella soluzione `.sln`.

**Note:** nessuna build eseguita (né `ng build` né `docker build`). Da fare a mano: chiudere `ng serve`/IDE che puntano al vecchio percorso. `.github/copilot-instructions.md` cancellato dall'utente di proposito (si usa Claude, non Copilot): la cancellazione va nel commit 2 di `COMMITS-DA-FARE.md`. Nessun commit.


### Allineamento dei file .md

**Perché:** richiesta dell'utente: documentazione coerente con workflow Docker Hub e rimozione dello stack a 4 container.

**Cosa:** `README.md`: riga del workflow nella tabella Architecture, paragrafo su immagini Docker Hub, secret e aggiornamento con `pull`/`up -d`. `DEPLOY.md`: nuova sezione «Workflow GitHub», prerequisito immagini, `DOCKERHUB_USERNAME` nel `.env`, passi con `pull` + `up -d` al posto di `--build`, aggiornamenti e tabella problemi. `COMMITS-DA-FARE.md`: riscritto in 5 commit (rimosso `docker-compose.template.yml`, aggiunti workflow e rimozioni).

**Note:** solo documentazione. Nessun commit.


### Rimosso lo stack Docker a 4 container

**Perché:** richiesta dell'utente: con i due compose separati in `deploy/`, `docker-compose.yml` non serve più; scelta «elimina tutto ciò che diventa orfano».

**Cosa:** eliminati `docker-compose.yml`, `.env.example` (root, usato solo da quel compose) e `deploy/nginx/` (Dockerfile e template del proxy). Tolte le voci `deploy/certs/` da `.gitignore` e `.dockerignore` e i due file da `SagreEventi.sln`. `README.md`: tolta la riga `deploy/nginx`, la riga `docker-compose.template.yml` (file inesistente) e la sezione dello stack a 4 container (variabili `.env`, certificato); «Deployment» ora descrive solo i due container e il workflow Docker Hub. Commento in `src/SagreEventi.Web.Angular/Dockerfile` aggiornato.

**Note:** perse le modifiche locali non committate a `docker-compose.yml` (sqlserver commentato, subnet 172.18.0.0/24); il file resta in git. Non c'è più uno stack locale con SQL Server in Docker. `DEPLOY.md` descrive ancora `up --build` invece di `pull`. Nessuna build eseguita, nessun commit.


### Workflow GitHub Actions: build e push su Docker Hub

**Perché:** richiesta dell'utente: build delle immagini API e Angular da GitHub e pubblicazione sul suo Docker Hub (deploy sul server a mano).

**Cosa:** nuovo `.github/workflows/build-push.yml`: job `api` (build + test .NET 10, poi immagine) e `web` (immagine Angular). Su PR solo build; su push a `main` (o manuale) push di `<user>/sagreeventi-api|web` con tag `latest` e SHA. `deploy/docker-compose.server.yml` e `docker-compose.angular.yml`: aggiunto `image: ${DOCKERHUB_USERNAME}/...:latest` accanto a `build:`. `deploy/.env.example`: variabile `DOCKERHUB_USERNAME`.

**Note:** build Docker senza cache (`no-cache: true`, nessuna cache GHA). Workflow non eseguito. Secret del repo: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (access token Docker Hub con permesso di scrittura). Sul server: `DOCKERHUB_USERNAME` in `deploy/.env`, poi `docker compose -f ... pull && up -d` (`docker login` se i repository sono privati). Nessun commit.


### Deploy con due container dietro nginx dell'host

**Perché:** richiesta dell'utente: deploy separato di Angular e API partendo dal template compose esistente, con nginx dell'host e certbot, API non esposta.

**Cosa:** nuovi `deploy/docker-compose.template.yml` (template originale), `deploy/docker-compose.angular.yml` (`127.0.0.1:5417:8080`), `deploy/docker-compose.server.yml` (context = root repo, `env_file: .env`, nessuna porta), `deploy/.env.example` (sezioni Angular e API), `deploy/sites-available/myhost.mydomain.ext` (virtual host dell'host), `DEPLOY.md` (procedura). `src/SagreEventi.Web.Angular/nginx.conf`: aggiunti `map` su `X-Forwarded-Proto` e `location ^~ /api/` verso `sagreeventi-api:8080` (resolver Docker `127.0.0.11`). `README.md`: sezione di deploy a due container e righe nella tabella Architecture.

**Note:** nulla provato su un host Docker reale, nessuna build eseguita. Le porte 5417 (Angular) e 5738 (API, poi tolta) erano casuali. Tolti i rimandi a `TEST-MANUALI.md` e `SOSPESI.md` (file già cancellati a fine sviluppo) da `README.md` e `SagreEventi.sln`. Nessun file inutile trovato da eliminare. Nessun commit.


## 2026-10-25

### Commit del lavoro e rimozione dei file di piano

**Perché:** richiesta dell'utente: committare in più commit per area (push e PR a cura dell'utente) e togliere i piani, ormai completati.

**Cosa:** 8 commit su `main`: rimozione Blazor, OpenAPI nativo, entità e moderazione, Identity, endpoint Minimal API, Docker, documentazione, rimozione dei piani. Eliminati `PLAN-migrazione-backend.md` e `PLAN-moderazione-eventi.md`; tolti i riferimenti da `SagreEventi.sln`, `README.md` (struttura) e `SOSPESI.md`. Il dettaglio dei piani resta in questo file e in git (commit `55e9cea` e precedenti).

**Note:** i commit intermedi probabilmente non compilano da soli (codice intrecciato); lo stato finale sì. `CLAUDE.md` chiede ancora di salvare i piani in `PLAN-<nome>.md`: la regola vale per i piani futuri. Nessun push.


### Nuovo SOSPESI.md

**Perché:** richiesta dell'utente: salvare in un file dedicato ciò che resta sospeso dopo i piani.

**Cosa:** `SOSPESI.md` (prove manuali Docker/browser/SQL Server, azioni di configurazione e dati, limiti noti); aggiunto ai Solution Items di `SagreEventi.sln`. Solo documentazione.


### README allineato allo stato attuale

**Perché:** richiesta dell'utente. Il README era già quasi allineato; mancavano esempio JSON e struttura.

**Cosa:** `README.md`: esempio JSON con `stato` (solo output) e limiti di lunghezza dei campi; «Project structure» con `Endpoints/`, `Extensions/`, `HostedServices/`, `Migrations/`, `PLAN-*.md`, `TEST-MANUALI.md`, `CHANGES.md`, feature `segnalazioni` e `gestione`.

**Note:** solo documentazione, nessun codice toccato.


## 2026-10-23

### Revisione eventi: scheda «Conclusi» solo per l'Admin

**Perché:** richiesta dell'utente: oltre a In attesa, Rifiutati e Approvati, l'Admin deve poter vedere anche gli eventi conclusi/scaduti.

**Cosa:** nuovo `GET /api/Eventi/Revisione/Conclusi` (`RevisioneEndpoints`, policy `SoloAdmin` oltre a quella del gruppo; Editor → 403, anonimo → 401): tutti gli eventi con `EventoConcluso` in qualunque stato (scaduti e ritirati), con nota di rifiuto, per data di fine decrescente, massimo 200. `IEventiService.GetConclusiAsync` + `EfCoreEventiService`. Angular: `RevisioneService.conclusi()`; `revisione.page.ts` mostra la scheda «Conclusi» solo se `eAdmin()`, in sola lettura (niente checkbox né azioni), con colonne Stato e Nota. Nessuna modifica al modello EF. Test: 2 nuovi in `EventiApiTests` (accesso solo Admin; contenuto in ogni stato, aperti esclusi). `README.md`: riga endpoint e frase nella sezione Moderation.

**Note:** 154/154 test, `ng build --configuration production` ok. La build della soluzione intera non è stata rifatta perché l'API era in esecuzione (file `.exe` bloccato): test eseguiti con `-p:UseAppHost=false`. Riavviare l'API per vedere la scheda. Non toccati `appsettings*.json`.


### Documentazione (README) e test manuali

**Perché:** ultimo step del piano; il README descriveva ancora l'avvio senza Docker e non citava proxy, header inoltrati, `/healthz` e test.

**Cosa:** `README.md`: sezione «Tests» (`dotnet test`, controllo pacchetti vulnerabili), sezione «Docker» (4 servizi, `.env`, certificato, `docker compose up --build`, variabili, sicurezza del proxy, avviso «non ancora provato»), tabella configurazione con `ForwardedHeaders:*`, `AllowedHosts`, `Cors:Origins` (voci vuote ignorate) e variabili d'ambiente con `__`, riga `/healthz` negli endpoint, struttura del progetto con `deploy/`, `tests/`, compose, voci «scope» e «What's next» aggiornate. Nuovo `TEST-MANUALI.md`: checklist delle prove da fare a mano (preparazione, build, HTTPS, frontend, login, limiti nginx 413/XFF/host, persistenza, segreti, deploy senza Docker). `SagreEventi.sln`: `TEST-MANUALI.md` nei Solution Items.

**Note:** solo documentazione, nessun codice toccato. **Piano completato (step 0-9).** Resta da fare a mano `TEST-MANUALI.md`.


### Docker con nginx dedicato (file scritti, immagini non provate)

**Perché:** deploy in Docker con nginx come reverse proxy in un container dedicato, stessa origine (decisione presa con S4).

**Cosa:** 4 servizi in `docker-compose.yml`: `sqlserver` (volume, healthcheck), `api` (porta 8080 solo `expose`, migrazioni all'avvio, seed Admin da `.env`, `AllowedHosts=SERVER_NAME`, `ForwardedHeaders__KnownNetworks__0` = subnet fissa 172.28.0.0/24 della rete `interna`), `web` (Angular + `nginxinc/nginx-unprivileged`, fallback SPA, cache dei file con hash), `proxy` (`deploy/nginx`: HTTPS TLS1.2/1.3 con certificati montati da `deploy/certs`, 80→301 a HTTPS, `/api/`→`api:8080`, `/`→`web:8080`, `client_max_body_size 5m`, `X-Forwarded-For $remote_addr` (non `$proxy_add_x_forwarded_for`: il valore del client non passa mai), HSTS e header di sicurezza, `limit_req` grossolano). Dockerfile API: multi-stage sdk→aspnet, utente non root, healthcheck solo con bash su `/healthz`. Codice: `AddHealthChecks` + `MapHealthChecks("/healthz")`; CORS ignora le origini vuote (in Docker `Cors__Origins__0=""` azzera l'origine di esempio) e le legge in modo pigro. `.gitignore`: `deploy/certs/`, `.env`. Test nuovi: `HealthTests`, `CorsTests` (3).

**Note:** build 0 errori e 0 avvisi, 152/152 test, `ng build --configuration production` e `dotnet publish` ok. **Docker non è installato qui: immagini, compose e nginx.conf NON sono stati costruiti né provati** (sintassi scritta a mano). Da fare a mano: certificato (vedi `.env.example`), `.env`, `docker compose up --build`, poi le prove nel piano (413 oltre 5 MB, XFF falso, host errato). Prossimo: 9 (README).


### Nullable reference types abilitati

**Perché:** regola di `CLAUDE.md` ("Nullable reference types abilitati"); `Shared` e `Web.Server` avevano `<Nullable>disable</Nullable>`.

**Cosa:** `<Nullable>enable</Nullable>` in `SagreEventi.Shared.csproj` e `SagreEventi.Web.Server.csproj`. Annotazioni oneste: `string?` per `MotivoRifiuto` (DTO ed entità), `RevisionatoDa`, `RifiutaEventiRequest.Motivo`, `motivo` di `IEventiService.RifiutaAsync`/`EfCoreEventiService`, `ids` di `GetStati`, campi dei body admin (`CreaUtenteRequest`/`ModificaUtenteRequest`, `Valida`) e `ValidaIds`; `= string.Empty` per le stringhe sempre valorizzate (`Id`, `NomeEvento`, `CittaEvento`, `DescrizioneEvento`, `StatoEventoModel.Id`), `= new()` in `FusionCacheOptions`. Tolti i `?.` ridondanti sul body non nullable negli endpoint admin e revisione. Test: corretti i 4 avvisi preesistenti in `AdminUtentiTests`; `SicurezzaInputTests` ha 11 casi nuovi (body senza campi o con `null` → 400, evento con testi `null` → 400) e il token Admin è ottenuto una volta per factory (limite di 10 login/minuto).

**Verifica:** `dotnet ef migrations has-pending-model-changes` prima e dopo: nessuna modifica al modello, nessuna nuova migrazione. Contratto JSON invariato.

**Note:** build 0 errori e 0 avvisi, 148/148 test. Prossimo: 8 (Docker con nginx), poi 9.


### Test con input malevoli, escape JSON e nosniff (chiude lo step 7-sec)

**Perché:** ultimo punto della verifica sicurezza di CLAUDE.md: provare l'API con input ostili e non solo con quelli attesi.

**Cosa:** nuovo `SicurezzaInputTests` (17 casi): SQL injection (campi evento, id, `GetStati`, `since`, login, revisione, id utente), payload `<script>` solo come dato JSON, body malformati / `[null]` / data non valida → 400 senza stack trace né nomi interni, email con newline o malformata rifiutata, id utente con path traversal → 404. Il test sullo script ha trovato che le risposte JSON non escapavano `<`/`>`: `ServiceCollectionExtensions` imposta `JsonOptions.Encoder = JavaScriptEncoder.Default` (escape; per i client JSON nulla cambia) e `Program.cs` aggiunge `X-Content-Type-Options: nosniff` a tutte le risposte. Piano: 7-sec completato.

**Note:** build 0 errori, 138/138 test. Non coperto dai test: limite del corpo di 5 MB (Kestrel, non simulabile con il test server). Prossimo: 7-quater (nullable), poi 8 (Docker, con nginx) e 9.


### Politica password, id di GetStati, AllowedHosts (step 7-sec)

**Perché:** verifica sicurezza di CLAUDE.md: password minime di soli 6 caratteri, id di `GetStati` senza lunghezza massima, `AllowedHosts` aperto.

**Cosa:** `IdentityServices`: `Password.RequiredLength = MinPasswordLength` (10; restano le regole predefinite di Identity su maiuscole/minuscole/cifre/simboli), vale per `/api/admin/utenti` e per gli endpoint `/api/auth`. `EventiEndpoints.GetStatiAsync`: `400` se un id supera `EventoModel.MaxIdLength` (100). `AllowedHosts` non modificato (`appsettings.json` non si tocca): in produzione si imposta con la variabile d'ambiente, annotato nel piano per lo step 8. Test: password troppo corta (`AdminUtentiTests`), troppi id / id troppo lunghi / id al limite (`EventiApiTests`).

**Note:** build 0 errori, 121/121 test. Le password già esistenti non sono toccate: la regola vale per le nuove. Resta S6 (test con input malevoli).


### Supporto al reverse proxy nginx (step 7-sec)

**Perché:** in produzione davanti all'API ci sarà nginx (Docker): senza gestire gli header `X-Forwarded-*` tutti i client risultano lo stesso IP (i rate limit per IP li bloccherebbero a gruppi) e lo schema HTTPS non è visibile (HSTS/redirect).

**Cosa:** backend: `ServiceCollectionExtensions.ConfiguraForwardedHeaders` (X-Forwarded-For e -Proto, `ForwardLimit` 1; proxy fidati da `ForwardedHeaders:KnownProxies` e `ForwardedHeaders:KnownNetworks` in CIDR; senza configurazione vale solo il loopback e gli header sono ignorati, quindi nessuno spoofing dell'IP) e `app.UseForwardedHeaders()` come primo middleware in `Program.cs`. Frontend: `config.service.ts` ora ha `apiBaseUrl` di default `""` (stessa origine, come nginx che serve il frontend e inoltra `/api`); `public/config.json` era già `""`. Nuovo `ForwardedHeadersTests` (proxy fidato: limite per client reale; non fidato: header ignorato). Piano: S4 segnato fatto, topologia nginx descritta nello step 8.

**Note:** build 0 errori, 117/117 test, `ng build` ok. In compose servirà `ForwardedHeaders__KnownNetworks__0` con la subnet Docker (step 8). Nessuna modifica ad `appsettings*.json`. Restano S5-S6.


### HSTS fuori da Development (step 7-sec)

**Perché:** verifica sicurezza di CLAUDE.md: mancava l'header `Strict-Transport-Security`, che impedisce ai browser di tornare su HTTP.

**Cosa:** `Program.cs`: `app.UseHsts()` fuori da Development, prima di `UseHttpsRedirection` (opzioni predefinite: 30 giorni; l'header viene emesso solo su richieste HTTPS e non per localhost). Nuovo `HstsTests` (Production → header con `max-age`; Development → nessun header).

**Note:** build 0 errori, 115/115 test. Dietro un proxy che termina l'HTTPS servirà `ForwardedHeaders` (S4/step 8) perché il server veda lo schema HTTPS. Restano S4-S6.


### Niente utenti seed con password di esempio fuori da Development (step 7-sec)

**Perché:** `appsettings.json` contiene Admin/Editor con password note (`Admin!12345`, `Editor!12345`): su un server dove nessuno le sostituisce sarebbero stati creati account con credenziali pubbliche.

**Cosa:** `IdentitySeeder.CreaUtenteAsync` non crea l'utente se l'ambiente non è Development e la password è una di quelle di esempio; scrive un avviso nel log (senza la password). Nessuna modifica ad `appsettings*.json`. Nuovo `SeedSicurezzaTests` (Production/Testing → utente non creato; Development → creato; password propria in Production → creato).

**Note:** build 0 errori, 113/113 test. Attenzione: chi avvia in Production senza `appsettings.local.json` o variabili d'ambiente non avrà più Admin/Editor di esempio (voluto). Restano S3-S6.


### Lunghezze massime sui campi dell'evento (step 7-sec)

**Perché:** verifica sicurezza di CLAUDE.md: l'insert anonimo accettava testi di dimensione arbitraria (colonne `nvarchar(max)`, solo il limite di 5 MB per richiesta) e un `Id` oltre 450 caratteri dava 500.

**Cosa:** `[StringLength]` su `EventoModel` con costanti pubbliche (`MaxIdLength` 100, `MaxNomeLength` 200, `MaxCittaLength` 100, `MaxDescrizioneLength` 4000, gli stessi limiti del form Angular); applicati dal validatore esistente → `400`. Nessuna migrazione né modifica al DB. Piano: nuovo step 7-sec (S1-S6) prima di 7-quater. Test in `EventiApiTests`: campi oltre il limite rifiutati (4 casi), campi esattamente al limite accettati.

**Note:** build 0 errori, 109/109 test. Restano S2-S6 (password di esempio, HSTS, ForwardedHeaders, politica password/AllowedHosts/id di GetStati, test con input malevoli), ognuno dopo il "vai".


### Commenti interni `//` tradotti in inglese

**Perché:** completare l'allineamento delle lingue dei commenti richiesto dall'utente (dopo i commenti XML).

**Cosa:** tradotti in inglese i commenti `//` italiani in `EventoModel`, `AdminUtentiEndpoints`, `EventiEndpoints`, `RevisioneEndpoints`, `IdentitySeeder`, `IdentityServices`, `OpenApiServices`, `ServiceCollectionExtensions`, `EventiHostedService`, `EfCoreEventiService`, `Program` e nei test (`AdminUtentiTests`, `ApiFactory`, `EventiApiTests`, `ScadenzaEventiTests`). Solo commenti: nessuna modifica al comportamento. Non toccati Angular e Migrations.

**Note:** build 0 errori, 104/104 test. Gli avvisi nullable nei test (`AdminUtentiTests`) sono preesistenti e rientrano nello step 7-quater. Verifica sicurezza (CLAUDE.md) eseguita solo in lettura: esiti riportati all'utente, nessuna correzione applicata.


### Commenti XML in inglese sui metodi pubblici

**Perché:** regola di CLAUDE.md: i metodi pubblici hanno un commento in inglese; quelli presenti in italiano vanno tradotti.

**Cosa:** aggiunti `/// <summary>` in inglese ai metodi pubblici che ne erano privi (`Map*Endpoints`, `Add*Services`, `ToEntity`, `Intervallo`, `StartAsync`/`StopAsync`, `ExecuteAsync`, `Main`, `GetFusionCacheDefaultOptions`) e `/// <inheritdoc />` sulle implementazioni di `IEventiService` in `EfCoreEventiService`; tradotti in inglese i commenti XML italiani esistenti (endpoint, `Extensions`, `EventoMappings`, `EventoValidator`, `ScadenzaEventiOptions`, `EventiHostedService`, `Evento`, `Ruoli`/`Policies`, `IEventiService`, `RevisioneModels`, `StatoModerazione`). Solo commenti: nessuna modifica al comportamento.

**Note:** i commenti `//` interni e i test restano com'erano; build 0 errori/0 avvisi, 104/104 test.


### Scadenza automatica, rifiuto senza comunicazione, home a tutta larghezza

**Perché:** la conclusione di un evento non è più una scelta degli utenti ma la decide il server; un rifiuto non va comunicato a chi ha segnalato (la nota resta solo come storico per lo staff); testo della home a tutta larghezza.

**Backend:**
- `HostedServices/EventiHostedService.cs` riscritto come `BackgroundService` con `PeriodicTimer` (un ciclo alla volta, parte subito, errori registrati senza fermarlo). Intervallo da `Eventi:ScadenzaIntervalloMinuti` (default 60, frazioni ammesse) letto con `IOptionsMonitor` + `OnChange`: vale anche a caldo. Nuova `Options/ScadenzaEventiOptions.cs`; registrazione in `ServiceCollectionExtensions.cs` (`Configure` + `AddHostedService`, alias di `using` per evitare il conflitto col namespace `Options`).
- `EfCoreEventiService`: `ConcludiScadutiAsync` (aggiornamento mirato `ExecuteUpdateAsync`: solo gli eventi non ancora conclusi con `DataFineEvento` < oggi UTC, imposta `DataOraUltimaModifica`, invalida la cache) al posto di `GetEventiScadutiAsync` + `UpdateEventoAsync` (rimossi da `IEventiService`). Un evento già concluso sul server è ignorato in `UpdateEventiAsync` da tutti, Admin compreso; `ApplyFrom` non copia più `EventoConcluso` dal client e `StessoContenuto` non lo confronta.
- Rifiuto: `Motivo` facoltativo in `RevisioneEndpoints` (max 500 se presente; vuoto → `MotivoRifiuto = null`). `GetStatiAsync` restituisce `InAttesa` per un evento rifiutato e non espone più la nota: rimosso `MotivoRifiuto` da `StatoEventoModel` (`SagreEventi.Shared`).
- Test: `ScadenzaEventiTests.cs` (nuovo: conclusione dei soli scaduti, timestamp, non rielaborazione, conteggio, pull incrementale + cache, evento in attesa scaduto, servizio in background con intervallo a caldo), `EventiApiTests.cs` (client non può concludere, concluso non modificabile né riapribile, rifiuto senza motivo, ritiro senza motivo, `GetStati` nasconde il rifiuto), `EventoMappingsTests.cs`.

**Angular:** rimossi "Segna come concluso" (`chiediConclusione`), `EventiStore.concludi` e `rimuoviSegnalazione`; `mie-segnalazioni.page.ts` mostra sempre «In attesa di approvazione» (niente tag «Rifiutata», motivo, «Rimuovi dal dispositivo»); dettaglio evento: un `Rifiutato` locale appare come in attesa; `revisione.page.ts`: nota facoltativa (pulsante sempre attivo, testo aggiornato, colonna «Nota»); `core/models.ts`, `revisione.service.ts` (motivo vuoto non inviato). Home: tolto `max-width: 46ch` da `.hero-testo` in `styles.css`. `README.md` aggiornato.

**Verifica:** `dotnet build` 0 errori, `dotnet test` 104/104, `ng build` ok. Non provato nel browser né su SQL Server reale (`ExecuteUpdateAsync` provato solo su SQLite).

**Note/da fare:** `Eventi:ScadenzaIntervalloMinuti` non è in `appsettings.json` (non toccato per vincolo): vale il default 60. Una segnalazione rifiutata resta «in attesa» per sempre sul dispositivo di chi l'ha fatta (scelta voluta). Le vecchie copie locali con stato `Rifiutato` sono mostrate come in attesa e riallineate alla prossima sincronizzazione. Restano 8 (Docker) e 9 (documentazione).


### Revisione e Amministrazione raggruppate in "Gestione"

**Perché:** un Admin aveva 7 voci nella barra mobile; le due sezioni di gestione ora sono una sola voce con schede.

**Dove:** `features/gestione/gestione.page.ts` (nuovo, barra schede Revisione (n) / Utenti, Utenti solo Admin), `app.routes.ts` (`/gestione` con figlie `revisione` e `utenti`; `/revisione` e `/amministrazione` ora sono redirect), `app.ts` (voce unica "Gestione (n)" per chi può modificare), `README.md` (percorsi).

**Verifica:** `ng build` ok. Non provato nel browser.

**Aggiunta:** testo introduttivo di Revisione e Utenti a tutta larghezza: `.pagina-intro` aveva `max-width: 60ch`; nuova classe `.larga` in `styles.css` (`max-width: none`) applicata solo a queste due pagine.


### Sezione Amministrazione (gestione utenti)

**Perché:** finora gli utenti si creavano solo dal seed; l'Admin deve poterli gestire dall'interfaccia.

**Backend:**
- `Endpoints/AdminUtentiEndpoints.cs` (nuovo, registrato in `Program.cs`), gruppo `/api/admin` con policy `SoloAdmin` (nuova in `Models/Identity/Ruoli.cs` e `IdentityServices.cs`): `GET ruoli` (sola lettura, Admin/Editor fissi), `GET utenti`, `POST utenti` (email, password, ruoli → 201), `PUT utenti/{id}` (email = anche username, password opzionale, `ruoli` sostituisce l'insieme), `DELETE utenti/{id}` (204).
- Validazione: email valida ≤256, ruoli solo quelli esistenti, regole password di Identity (400 con ValidationProblem; email duplicata → 400). Salvaguardie → 409: non cancellarsi, non togliersi Admin, non rimuovere/cancellare l'ultimo Admin. Un cambio di ruoli aggiorna il security stamp (il refresh token vecchio non vale più).
- `tests/.../AdminUtentiTests.cs` (nuovo): 401/403 su ogni endpoint, creazione e validazioni, modifica (login con nuova email/password), 404, salvaguardie, cancellazione. **82/82** test.

**Angular:** `core/admin-utenti.service.ts` (client + `messaggioErroreApi`), `features/amministrazione/amministrazione.page.ts` (tabella, dialog crea/modifica con multiselect ruoli, conferma di eliminazione), guard `richiedeAdmin` in `permessi.service.ts`, rotta `/amministrazione`, voce di menu solo per Admin (`app.ts`). `README.md` aggiornato.

**Verifica:** `dotnet build` 0/0, `dotnet test` 82/82, `ng build` ok. Non provato nel browser.

**Note/da fare:** gli access token già emessi restano validi fino a scadenza anche dopo un cambio ruolo o una cancellazione (la durata è quella di Identity, 1 ora); i refresh token no. Non esistono endpoint separati per assegnare/revocare un ruolo: lo fa il `PUT` con l'elenco completo. Restano 7-ter, 8, 9.


### Ritiro dalla pagina di revisione e chiusura

**Perché:** completare il piano: poter ritirare un evento già approvato dall'interfaccia e documentare il flusso.

**Dove:**
- `features/revisione/revisione.page.ts`: nuova scheda "Approvati" (eventi pubblici dello store locale) con "Ritira…" (dialog con motivo, usa `Revisione/Rifiuta` → tombstone); dopo il ritiro sincronizza e ricarica.
- `README.md`: sezione "Moderation", voci "Report/Review", nuovi endpoint in tabella, tolta la voce da "What's next".

**Verifica:** `ng build` ok, `dotnet build` ok, `dotnet test` 58/58. Id eventi = `crypto.randomUUID` (non indovinabili per `GetStati`). Giro a mano nel browser e prova su SQL Server reale NON fatti.

**Note/da fare:** dopo la migrazione approvare gli eventi esistenti da `/revisione`. La scheda Approvati dipende dallo store locale (serve essere sincronizzati).


### Pagina di revisione in Angular

**Perché:** Editor e Admin devono poter approvare o rifiutare le segnalazioni (e approvare in blocco gli eventi esistenti, tutti `InAttesa`) dall'interfaccia.

**Dove (Angular):**
- `core/revisione.service.ts` (nuovo): client di `GET Revisione/DaRivedere`, `POST Revisione/Approva|Rifiuta`; signal `inAttesa` per il contatore.
- `features/revisione/revisione.page.ts` (nuovo, rotta `/revisione` con guard `richiedeModifica`): schede In attesa / Rifiutati, `p-table` con selezione multipla (max 100 per richiesta), Approva, Rifiuta con dialog del motivo (obbligatorio, max 500); dopo ogni azione ricarica la lista e mostra un toast. Nei Rifiutati si può ri-approvare.
- `app.ts`: voce di menu "Revisione (n)" solo per chi può modificare; il contatore si aggiorna all'avvio, al cambio ruolo e al ritorno online. `app.routes.ts`, `core/models.ts` (`motivoRifiuto`, `EsitoRevisione`).

**Verifica:** `ng build` ok. Non provato nel browser.

**Note/da fare:** il ritiro di un evento già approvato non ha ancora un pulsante (l'endpoint c'è); il contatore non si aggiorna in tempo reale. M6: chiusura e nota nel README.


### Angular store/segnalazione + `403` per modifiche non autorizzate

**Perché:** (a) decisione dell'utente: modificare un evento esistente senza ruolo deve dare `403` invece di essere ignorato con `200`; (b) chi segnala un evento deve vederlo "in attesa" sul proprio dispositivo e conoscerne l'esito.

**Backend:**
- `EfCoreEventiService.UpdateEventiAsync` ora restituisce `bool`: `false` se il payload contiene una modifica vera a un evento esistente senza policy `PuoModificare` (i nuovi eventi della richiesta sono inseriti comunque). Un re-invio identico a quanto salvato (`StessoContenuto`) resta innocuo, così un retry dopo risposta persa non dà errore. `EventiEndpoints.UpdateEventiAsync` risponde `403` (ProblemDetails). `IEventiService` aggiornata.
- Test: 3 test esistenti ora attendono `403`, nuovo test del re-invio identico (58/58).

**Angular:**
- `core/models.ts`: `Evento.stato`, `StatoModerazione`, `EsitoModerazione`, `EventoLocale.mio`/`motivoRifiuto`. `eventi-api.service.ts`: `getStati(ids)`.
- `eventi-store.service.ts`: `crea` marca `mio` e `stato` (InAttesa, o Approvato se l'utente può modificare); `eventi()` mostra solo gli approvati (o senza stato, dati legacy); nuovo `mieSegnalazioni`; `aggiornaStati()` dopo il pull chiama `GetStati` (blocchi da 50) per le mie non approvate, errori ignorati; `unisci` conserva `mio` e prende `stato` dal server; `rimuoviSegnalazione(id)`.
- `evento-form.page.ts`: messaggio "Sarà visibile a tutti dopo la revisione". `evento-detail.page.ts`: avviso In attesa/Rifiutata con motivo.
- Nuova pagina `features/segnalazioni/mie-segnalazioni.page.ts` (rotta `/segnalazioni`) con badge e rimozione delle rifiutate; voce di menu "Le mie" (`app.ts`, `link` ora `computed`) visibile solo se ci sono segnalazioni in sospeso.
- `README.md` e `PLAN-migrazione-backend.md` allineati alla decisione 403.

**Verifica:** `dotnet build` 0/0, `dotnet test` 58/58, `ng build` ok. Non provato nel browser.

**Note/da fare:** M5 (pagina `/revisione`) per approvare dall'interfaccia. Un evento rifiutato non genera notifiche: l'autore lo scopre alla sincronizzazione.


### Endpoint di revisione e `GetStati`

**Perché:** permettere a Editor/Admin di approvare, rifiutare o ritirare gli eventi segnalati, e a chi ha segnalato di conoscere l'esito.

**Dove:**
- `Endpoints/RevisioneEndpoints.cs` (nuovo), gruppo `/api/Eventi/Revisione` con policy `PuoModificare` (401 anonimo, 403 senza ruolo): `GET /DaRivedere?stato=InAttesa|Rifiutato` (default InAttesa, più vecchi per primi, max 200, `Approvato` → 400), `POST /Approva {ids}`, `POST /Rifiuta {ids, motivo}` (max 100 id, id non vuoti, motivo obbligatorio max 500). Risposta `{modificati}`; id sconosciuti o già nello stato richiesto sono ignorati. Registrato in `Program.cs`.
- `EfCoreEventiService` / `IEventiService`: `GetDaRivedereAsync`, `ApprovaAsync`, `RifiutaAsync`, `GetStatiAsync`. Ogni revisione imposta `RevisionatoDa` (email dal claim), `DataRevisione`, nuovo `DataOraUltimaModifica` (cursore di sync) e invalida la cache. Rifiutare un evento approvato lo ritira: `Rifiutato` + `EventoConcluso` (tombstone, i client lo eliminano). Approvare un rifiutato/ritirato azzera il motivo e ricalcola `EventoConcluso` (vero solo se `DataFineEvento` è passata).
- `EventiEndpoints.cs`: `GET /api/Eventi/GetStati?ids=` anonimo (1–50 id), rate limit policy `stati` (`Eventi:RichiesteStatiAlMinuto`, default 30, in `ServiceCollectionExtensions.cs` e `appsettings.json`). Restituisce solo `{id, stato, motivoRifiuto}` (motivo solo se rifiutato).
- `SagreEventi.Shared/Models/RevisioneModels.cs` (nuovo): `StatoEventoModel`, `ApprovaEventiRequest`, `RifiutaEventiRequest`, `RevisioneEsito`.
- `EventiApiTests.cs`: 15 test nuovi (401/403, elenco, approvazione singola/multipla con cache invalidata, validazioni, rifiuto con motivo, ritiro con tombstone, GetStati).

**Verifica:** `dotnet build` 0 errori/0 avvisi; `dotnet test` 57/57 (3 esecuzioni). Non provato su SQL Server né dal browser.

**Note/da fare:** la UI non esiste ancora (M4 segnalazione, M5 revisione): finché non c'è, gli eventi esistenti si approvano solo via API. Un evento ritirato e poi riapprovato con data già passata resta concluso (coerente con la futura scadenza automatica 7-ter).


### Insert come InAttesa/Approvato e `GetEventi` filtrato

**Perché:** gli eventi segnalati dagli anonimi non devono essere visibili finché non revisionati.

**Dove:**
- `EfCoreEventiService.ApplicaAsync`: un evento nuovo nasce `Approvato` se chi scrive ha la policy `PuoModificare`, altrimenti `InAttesa`; lo stato non viene mai dal payload e un update di un revisore non lo cambia.
- `EfCoreEventiService.GetEventiAsync`: usa `EventoMappings.VisibilePubblico` (`Approvato`, oppure `Rifiutato` + `EventoConcluso`) e `ToDtoPubblico`. Gli `InAttesa` e i `Rifiutato` non conclusi non escono mai, nemmeno se scaduti.
- **Tombstone:** un evento ritirato (Rifiutato + concluso, impostato in M3) esce solo con id e date, con nome/città/descrizione vuoti e senza motivo, così il client lo elimina ma non riceve il contenuto rifiutato. La cache resta una sola (la lettura è uguale per tutti).
- Test (42/42): anonimo/senza ruolo → InAttesa, Editor/Admin → Approvato, stato inviato dal client ignorato, update del revisore non cambia lo stato, GET senza InAttesa/Rifiutati, GET con approvati, tombstone senza contenuto, InAttesa scaduto non esce. I test esistenti che leggevano dopo un insert anonimo ora inseriscono come Editor. `ClientConRuoloAsync` mette in cache il token per ruolo (il login ha il limite 10/min per IP, con più test andava in 429).

**Verifica:** `dotnet build` 0/0, `dotnet test` 42/42 (3 run). Non provato su SQL Server né nel browser.

**Note/da fare:** da ora gli eventi esistenti nel DB (tutti `InAttesa` dopo la migrazione) spariscono dal sito finché non c'è la revisione (M3/M5); lato Angular l'evento appena segnalato non compare più nella lista dell'autore fino a M4. Prossimo: M3 (endpoint di revisione e `GetStati`), in attesa del "vai".


### Modello dati e migrazione `AddModerazione`

**Perché:** primo step di `PLAN-moderazione-eventi.md`: serve uno stato di revisione per nascondere gli eventi non approvati (il filtro è in M2, per ora il comportamento pubblico è invariato).

**Dove:**
- `Shared/Models/StatoModerazione.cs` (nuovo): enum `InAttesa=0 / Approvato / Rifiutato`, serializzato come stringa (`[JsonConverter]`). `EventoModel`: `Stato` e `MotivoRifiuto` (solo output, il server li ignora in ingresso).
- `Web.Server/Models/Entities/Evento.cs`: `Stato`, `MotivoRifiuto` (max 500), `RevisionatoDa` (max 256, email), `DataRevisione`. `AppDbContext`: lunghezze massime.
- `EventoMappings`: `ToDto` proietta `Stato`/`MotivoRifiuto`; `ToEntity`/`ApplyFrom` non li copiano mai dal client.
- Migrazione `20261023114159_AddModerazione`: 4 colonne su `Eventi`, `Stato` int NOT NULL default 0 → **tutti gli eventi esistenti diventano `InAttesa`** (decisione del piano). `has-pending-model-changes` pulito. **Non applicata**: parte da sola all'avvio (`Database:MigraAllAvvio`).
- Test `EventoMappingsTests` (3): 32/32 in totale.

**Note/da fare:** appena applicata la migrazione gli eventi esistenti restano visibili fino a M2 (poi spariscono dal pubblico finché non approvati da M3/M5). L'Angular riceve il nuovo campo `stato` e lo ignora. Prossimo: M2 (insert come InAttesa/Approvato e filtro su `GetEventi`), in attesa del "vai".


### README aggiornato (Identity, ruoli, seed, limiti, CORS, solo API)

**Dove:** `README.md`: intro e scope (login Admin/Editor, niente registrazione pubblica), tecnologie, tabella endpoint (`/api/auth/*`, limiti del PUT, timestamp deciso dal server), quickstart con `appsettings.local.json` e seed all'avvio, tabella configurazione (`Identity:*`, `Database:MigraAllAvvio`, `Eventi:*`, `Cors:Origins`), nota CORS/proxy, "What's next" con moderazione e 7-bis/7-ter.


### Rimozione del client Blazor (backend solo API)

**Perché:** il frontend è solo Angular; il server non deve più ospitarlo.

**Dove:**
- Eliminata la cartella `src/SagreEventi.Web.Client` (tracciata in git: recuperabile) e tolta da `SagreEventi.sln`; aggiunto `PLAN-moderazione-eventi.md` tra i Solution Items.
- `Web.Server.csproj`: rimossi `ProjectReference` al Client e il pacchetto `Microsoft.AspNetCore.Components.WebAssembly.Server`. `Program.cs`: rimossi `UseWebAssemblyDebugging`, `UseBlazorFrameworkFiles`, `UseStaticFiles`, `MapFallbackToFile`. `launchSettings.json`: tolto `inspectUri` di Blazor.
- `SagreEventi.Shared`: eliminato `Models/EventiStore.cs`; tolto `SupportedPlatform browser` dal csproj.
- README e commenti Angular: tolti i riferimenti a Blazor.

**Verifica:** `dotnet build` 0 errori/0 avvisi, `dotnet test` 29/29, `ng build` ok. Il server alla radice (`/`) ora risponde 404: l'UI è su Angular.

**Note/da fare:** il README descrive ancora l'app come "senza account né autenticazione" (non aggiornato per Identity); `.github/copilot-instructions.md` non citava Blazor. Restano da decidere: 403 vs "ignora con 200"; prossimo step (moderazione M1, 7-bis, 7-ter), in attesa del "vai".


### Correzioni da analisi bug (cursore, id duplicati, Bearer null, limiti)

**Perché:** un client poteva avvelenare il cursore di sync con `DataOraUltimaModifica` futura; id duplicati davano 500; l'insert anonimo era senza limiti.

**Dove:**
- `EfCoreEventiService.UpdateEventiAsync`: `DataOraUltimaModifica = UtcNow` deciso dal server su insert e update (il valore del client serve solo al confronto "più recente vince"); dedup per id nel batch; su `DbUpdateException` un solo retry (id inserito in concorrenza).
- `EventiEndpoints`: max `Eventi:MaxPerRichiesta` (default 20) eventi per PUT → 400; rate limit `scrittura` su `PUT /UpdateEventi` (`Eventi:RichiestePutAlMinuto`, default 10/min per IP, letto a runtime). `ServiceCollectionExtensions` registra la policy; `appsettings.json` ha la sezione `Eventi`.
- Angular `auth.interceptor.ts`: niente header `Bearer null` dopo un rinnovo fallito; `eventi-store.service.ts`: push a blocchi da 20 (`MAX_EVENTI_PER_RICHIESTA`, da tenere allineato al server).
- Test (29/29): timestamp server, id duplicati, limite 20/21, 429; i test esistenti usano tempi relativi a `UtcNow`; `ApiFactory` alza il rate limit a 1000.

**Verifica:** `dotnet test` 29/29, `tsc` e `ng build` ok. Non provato nel browser.

**Note/da fare:** il comportamento "ignora con 200" per i non autorizzati resta (decisione 403 aperta). Prossimo: step 7 (rimozione Blazor) o M1 della moderazione, in attesa del "vai".


### Moderazione degli eventi segnalati (nessuna modifica al codice)

**Perché:** gli eventi segnalati da anonimi erano subito pubblici; devono essere visibili solo dopo la revisione di un Editor/Admin.

**Dove:** nuovo `PLAN-moderazione-eventi.md` (step M1–M6: stato `InAttesa/Approvato/Rifiutato`, filtro sul `GetEventi` pubblico, endpoint `/api/Eventi/Revisione`, `GetStati` per il segnalante, store e pagina `/revisione` in Angular). Decisioni: eventi esistenti tutti `InAttesa`, rifiutati conservati, si parte dopo il 6-bis, gestione utenti resta al 7-bis (solo Admin).

**Da fare:** attendere il "vai" (prima il 6-bis, poi M1).


### Seed al primo avvio: migrazioni, Admin ed Editor con dati fittizi

**Perché:** il seed esisteva ma senza configurazione non creava nessun utente e non applicava le migrazioni.

**Dove:**
- `appsettings.json`: `Database:MigraAllAvvio=true`, `Identity:Admin` (`admin@sagreeventi.local` / `Admin!12345`) e `Identity:Editor` (`editor@sagreeventi.local` / `Editor!12345`), `Cors:Origins` = `http://localhost:4200`. Valori **fittizi**: da sovrascrivere in `appsettings.local.json`.
- `Extensions/IdentitySeeder.cs`: `MigrateAsync` all'avvio (solo SQL Server, se il flag è attivo), poi ruoli e utenti Admin/Editor tramite helper `CreaUtenteAsync`.

**Verifica:** `dotnet test` 23/23 (build in una cartella `artifacts` alternativa perché l'API in debug bloccava i file). Non provato contro SQL Server.

**Note/da fare:** cambia le password prima di ogni deploy; in produzione valuta `MigraAllAvvio=false`. Nessun evento di esempio.


### Fix: pagina bianca all'avvio di Angular (NG0203)

**Perché:** nell'initializer di `app.config.ts` `inject(AuthService)` veniva chiamato dopo un `await`, fuori dal contesto di iniezione: il bootstrap falliva e restava la pagina bianca.

**Dove:** `src/SagreEventi.Web.Angular/src/app/app.config.ts` (i due `inject()` ora prima dell'`await`).

**Verifica:** `ng build` ok; non provato nel browser.


### Aggiunti step 6-bis e 7-ter, salvato lo stato per riprendere (nessuna modifica al codice)

**Perché:** chiusura sessione. Nel piano `PLAN-migrazione-backend.md` c'è ora la sezione "Stato avanzamento" (cosa è fatto, prossimo step, decisioni aperte, azioni manuali dell'utente).

**Dove:** solo `PLAN-migrazione-backend.md`: **6-bis** (cursore di sync avvelenabile da `DataOraUltimaModifica` inviata dal client, id duplicati → 500, interceptor `Bearer null`, limiti all'insert anonimo); **7-ter** (scadenza automatica eventi con intervallo in `appsettings.json`, nessuna conclusione manuale, eventi conclusi non modificabili da nessuno); nota sul 403 da valutare nello step 5.

**Da fare alla ripresa:** attendere il "vai" dell'utente sul 6-bis (o sul 7). Decisioni aperte: limiti del punto 6-bis.4.


### Angular con login, token Bearer e permessi da ruolo

**Perché:** abilitare la modifica degli eventi nel frontend solo a chi ha fatto login con ruolo Admin/Editor.

**Dove:**
- Backend `Extensions/IdentityServices.cs`: nuovo `GET /api/auth/me` (richiede token, senza rate limit) → `{ email, ruoli[] }` letti dal DB. Test `Me_*` in `AuthTests.cs`.
- Angular `core/auth.service.ts`: login (`/api/auth/login` poi `/me`), logout, rinnovo con refresh token (condiviso tra chiamate concorrenti), sessione in `sessionStorage`, `aggiornaUtente()` all'avvio per riallineare i ruoli.
- Angular `core/auth.interceptor.ts`: Bearer solo verso `apiBaseUrl`; rinnova prima dell'invio se scaduto (un token scaduto sarebbe anonimo e il server ignorerebbe le modifiche con 200); su 401 un solo retry dopo il rinnovo.
- Angular `core/permessi.service.ts`: `autenticato` da `AuthService`, `eAdmin`, `puoModificare()` = Admin o Editor; la guard `richiedeModifica` resta.
- Angular `core/eventi-store.service.ts` + `models.ts`: flag `protetta` su modifica/conclusione; senza ruolo la sync non le invia (restano `dirty`, niente perdita silenziosa) e le invia dopo il login.
- Angular `features/login/login.page.ts`, rotta `/login`, `app.ts` (Accedi / Esci nella topbar), `app.config.ts` (`withInterceptors`, initializer).

**Verifica:** `dotnet build` 0 errori/0 avvisi, `dotnet test` 23/23; `tsc --noEmit` e `ng build` ok. Non provato nel browser contro un'API reale.

**Note/da fare:** serve `dotnet ef database update` e `Identity:Admin:*` in `appsettings.local.json`; `Cors:Origins` deve includere l'origine di Angular. I ruoli si riallineano al caricamento della pagina. Prossimo: step 7 (rimozione Blazor), in attesa di conferma.


### Modifica protetta lato server (+ nuovo step 7-bis nel piano)

**Perché:** solo chi ha ruolo Admin/Editor può modificare eventi esistenti; l'inserimento di eventi nuovi resta anonimo.

**Dove:**
- `PLAN-migrazione-backend.md`: aggiunto lo **step 7-bis** (sezione "Amministrazione": gestione utenti con creazione/modifica/cancellazione/assegnazione ruoli, ruoli non modificabili, solo Admin loggato; backend `/api/admin/utenti` + Angular `/amministrazione`).
- `Endpoints/EventiEndpoints.cs`: `UpdateEventi` resta unico e anonimo; verifica la policy `PuoModificare` con `IAuthorizationService` e passa `consentiModifiche` al servizio.
- `IEventiService`/`EfCoreEventiService.UpdateEventiAsync(eventi, consentiModifiche, ct)`: eventi nuovi sempre inseriti; quelli già esistenti sono aggiornati (last-write-wins) solo se `consentiModifiche`.
- Test (21/21): anonimo e utente senza ruolo non modificano esistenti, anonimo inserisce i nuovi anche in una richiesta mista, Editor e Admin modificano; i test di update esistenti ora usano un Editor (helper `ClientConRuoloAsync`).

**Note:** scelta di comportamento: per chi non ha permessi gli eventi esistenti sono **ignorati con 200** (non 403), così i re-invii della sync (evento già inserito ma ancora `dirty` sul client) non bloccano l'intero batch; se preferisci 403 va cambiato. Il token non valido/scaduto è trattato come anonimo. L'Angular non invia ancora il token (step 6).
**Prossimo:** step 6 (Angular: login, interceptor, PermessiService), in attesa di conferma.


### ASP.NET Core Identity (solo ruoli)

**Perché:** autenticazione con bearer token e ruoli per abilitare in seguito la modifica degli eventi (la protezione degli endpoint è lo step 5).

**Dove (src/SagreEventi.Web.Server):**
- `Models/Identity/ApplicationUser.cs`, `Ruoli.cs` (ruoli `Admin`, `Editor`; policy `PuoModificare`).
- `AppDbContext` ora è `IdentityDbContext<ApplicationUser>` (stesso DB e tabella `dbo.Migrations`). Migrazione `AddIdentity` (solo 7 tabelle AspNet*, `Eventi` invariata; `has-pending-model-changes` pulito). **Non applicata a nessun DB**: serve `dotnet ef database update` prima di avviare l'API.
- `Extensions/IdentityServices.cs`: `AddIdentityApiEndpoints` + ruoli, policy `PuoModificare` (Admin/Editor), rate limiting `auth` (10 richieste/min per IP), `MapAuthEndpoints` → `/api/auth/*` (login, refresh, manage/info…). **Registrazione pubblica disattivata** (`/api/auth/register` → 404) salvo `Identity:RegistrazionePubblica=true`.
- `Extensions/IdentitySeeder.cs`: hosted service che all'avvio crea i ruoli e, se presenti `Identity:Admin:Email` e `Identity:Admin:Password`, il primo Admin (metterli in user-secrets/`appsettings.local.json`/variabili d'ambiente, mai in `appsettings.json`).
- CORS: `Cors:Origins` (array) con `WithOrigins`; senza configurazione nessuna origine cross-origin è ammessa (niente `AllowAnyOrigin`, niente credenziali).
- `Program.cs`: `UseRateLimiter`, `UseAuthentication`, `UseAuthorization` dopo `UseCors`. csproj: `Microsoft.AspNetCore.Identity.EntityFrameworkCore 10.0.13`.
- Test: `AuthTests` (login ok/ko, registrazione 404, seed Admin, manage/info con token, rate limit 429); `ApiFactory` con config Admin in memoria e creazione schema prima del seed. 17/17 ok.

**Note:** gli endpoint eventi sono ancora tutti anonimi (step 5). Il token di `MapIdentityApi` è opaco (non JWT). In dev serve `Cors:Origins` solo se l'Angular non usa il proxy. Test flaky risolto: il timer di `EventiHostedService` usava in parallelo la connessione SQLite condivisa (non thread-safe) insieme al seed; in `ApiFactory` ora è rimosso (10 run consecutive ok).
**Prossimo:** step 5 (fatto).


### OpenAPI nativo + schema Bearer

**Perché:** sostituire Swashbuckle con `Microsoft.AspNetCore.OpenApi` (nativo .NET 10) e predisporre lo schema Bearer per gli endpoint protetti degli step 4-5.

**Dove (src/SagreEventi.Web.Server):**
- `Extensions/OpenApiServices.cs` (nuovo, sostituisce `SwaggerServices.cs` eliminato): `AddOpenApi("v1")` con document transformer (info/contatto/licenza come prima + security scheme `Bearer`, HTTP bearer).
- `Program.cs`: in Development `app.MapOpenApi()` (documento su `/openapi/v1.json`) al posto di `UseSwagger/UseSwaggerUI`. `ServiceCollectionExtensions`: `AddOpenApiServices()`.
- csproj: `Swashbuckle.AspNetCore` → `Microsoft.AspNetCore.OpenApi 10.0.13`.
- Test: `OpenApiTests` (documento in Development espone i 2 endpoint e lo schema Bearer). 11/11 ok, build 0 errori/0 avvisi.

**Note:** l'OpenAPI nativo non include una UI: non c'è più `/swagger`, solo il JSON (importabile in Postman/Scalar/Swagger Editor). Lo schema Bearer non è ancora applicato a operazioni specifiche (requirement per-endpoint negli step 4-5). `GenerateDocumentationFile` lasciato com'è.
**Prossimo:** step 4 (fatto).


### Minimal API

**Perché:** passare da MVC (`Startup` + controller) a Minimal API mantenendo identico il contratto (`GET api/Eventi/GetEventi?since=`, `PUT api/Eventi/UpdateEventi`, 200 a body vuoto).

**Dove (src/SagreEventi.Web.Server):**
- Eliminati `Startup.cs`, `Controllers/EventiController.cs`, `Pages/Error.cshtml(.cs)` (Razor Pages/MVC rimossi).
- `Endpoints/EventiEndpoints.cs` (nuovo): `MapGroup("/api/Eventi")`, validazione con `EventoValidator` → `Results.ValidationProblem` (400). `since` è `DateTime?` (con `DateTime = default` il binding va in errore; assente = `default` come prima).
- `Extensions/ServiceCollectionExtensions.cs` (nuovo): `AddApplicationServices` (servizi di Startup + `AddProblemDetails`, `JsonOptions`); `Program.cs` ridotto a pipeline (`UseExceptionHandler` fuori da Development; Swagger/WebAssemblyDebugging in Development).
- `EfCoreEventiService`: ora riceve `IFusionCache` (non più cache privata per istanza); chiavi con `since`/`dataOdierna` (`.Ticks`); tag `eventi` e `RemoveByTagAsync` dopo ogni `SaveChanges` così un GET dopo un PUT non legge dati vecchi. `ApplicationExtension.GetFusionCacheDefaultOptions` ora non è più usato.
- Test: +2 (cache distingue `since`, GET dopo modifica non serve dati vecchi); `ApiFactory` toglie i provider di log (crash a fine test per il timer di `EventiHostedService` sul logger EventLog). 10/10 ok, build 0 errori/0 avvisi.

**Note:** hosting Blazor (`UseBlazorFrameworkFiles`, `UseStaticFiles`, fallback) lasciato fino allo step 7. Swashbuckle resta fino allo step 3. Piano copiato in `PLAN-migrazione-backend.md` (root). Ora la cache è condivisa: prima, essendo per istanza transient, di fatto non cachava.
**Prossimo:** step 3 (fatto).


### DTO ed entità separati

**Perché:** `EventoModel` (Shared) era insieme DTO ed entità EF; ora il contratto con i client resta `EventoModel`, la persistenza usa un'entità del server. Schema DB invariato.

**Dove (src/SagreEventi.Web.Server):**
- `Models/Entities/Evento.cs` (nuovo): entità; date non nullable, stringhe obbligatorie via fluent in `AppDbContext`.
- `Models/Mapping/EventoMappings.cs` (nuovo): `ToDto` (expression, traducibile in SQL), `ToEntity`, `ApplyFrom`.
- `Validation/EventoValidator.cs` (nuovo): validazione esplicita (DataAnnotations di `EventoModel` + Id obbligatorio), usata da `EventiController.UpdateEventiAsync` → 400 `ValidationProblem`.
- `AppDbContext` (`DbSet<Evento>`), `EfCoreEventiService` (mappa DTO↔entità, interfaccia `IEventiService` invariata), `Migrations/AppDbContextModelSnapshot.cs` (nome tipo e `DateTime` non nullable, a mano). `dotnet ef migrations has-pending-model-changes`: nessuna modifica.
- Test: `EventiApiTests` ora legge `Evento`; aggiunti 2 test (400 per evento non valido / senza Id). 8/8 ok.

**Note:** nuovo comportamento: PUT con Id vuoto ora risponde 400 (prima 500 in DB). Usate DataAnnotations invece di FluentValidation (serve solo nel client Blazor, che verrà rimosso). `Designer` della migrazione 2022 lasciato com'è. Il validatore verrà richiamato dall'endpoint nello step 2.
**Prossimo:** step 2 (Minimal API), in attesa di conferma.


### Test di caratterizzazione

**Perché:** rete di sicurezza prima di migrare a Minimal API + Identity; fissa il comportamento attuale dell'API.

**Dove:** nuovo `tests/SagreEventi.Web.Server.Tests` (xUnit + `WebApplicationFactory<Program>`, SQLite in memoria al posto di SQL Server): `ApiFactory.cs`, `EventiApiTests.cs` (PUT insert, evento già concluso ignorato, update se più recente, ignorato se più vecchio; GET con `since`, GET vuoto). Aggiunto a `SagreEventi.sln`. `dotnet test`: 6/6 ok.

**Note:** `appsettings.json` NON toccato (su richiesta: i secrets verranno gestiti in seguito dall'utente, punto 3 dello step 0 saltato). Il bug noto della chiave cache fissa in `EfCoreEventiService` non è coperto dai test (la cache è per istanza del servizio): da verificare allo step 2.

**Prossimo:** step 1 (separare DTO ed entità), in attesa di conferma.


## 2026-10-22

### Modifica eventi inibita (manca login/registrazione)

**Perché:** il backend non ha autenticazione; l'inserimento resta libero, la modifica di eventi esistenti no.

**Dove (src/SagreEventi.Web.Angular/src/app):**
- `core/permessi.service.ts` (nuovo): `PermessiService.autenticato` (signal, `false`) e `puoModificare()`; guardia di rotta `richiedeModifica` (redirect a `/eventi/:id`).
- `app.routes.ts`: `canActivate: [richiedeModifica]` su `eventi/:id/modifica`.
- `features/eventi/evento-detail.page.ts`: pulsanti "Modifica" e "Segna come concluso" visibili solo se `puoModificare()`; `chiediConclusione()` esce se non permesso.
- `core/eventi-store.service.ts`: `aggiorna()` e `concludi()` sono no-op se `!puoModificare()`.

**Da fare / note:** quando ci sarà il login, impostare `PermessiService.autenticato` dalla sessione. Il backend (`EventiController.UpdateEventiAsync`, PUT unico per insert+update) NON è protetto: servirà `[Authorize]` e distinguere insert da update.

<!--
## Contesto del progetto (stabile)

- Backend .NET 10: `src/SagreEventi.Web.Server` (API `api/Eventi/{GetEventi,UpdateEventi}`), client Blazor in `SagreEventi.Web.Client`.
- Frontend Angular + PrimeNG in `src/SagreEventi.Web.Angular`, offline-first (localStorage, sync push dirty poi pull da cursore) in `core/eventi-store.service.ts`.
- Verifica compilazione Angular: `npx tsc --noEmit -p tsconfig.app.json` dalla cartella Angular. Python non è installato.
-->
