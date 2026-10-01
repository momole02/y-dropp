# Développement

Cette page s'adresse aux personnes qui veulent modifier Y Dropp ou le compiler elles-mêmes.

## Prérequis

- Node.js 18 ou plus récent (pour développer ; les exécutables produits embarquent Node 14.15.3)
- npm
- Une connexion Internet pour le premier `npm run dist`, qui télécharge les binaires Node précompilés de nexe

## Installation

```bash
npm install
```

## Scripts npm

| Script | Rôle |
|---|---|
| `npm start -- <commande>` | Construit la page web puis lance la CLI depuis les sources avec ts-node, par exemple `npm start -- listen --port=8080` |
| `npm run typecheck` | Vérifie les types TypeScript (CLI et page web) |
| `npm run build:web` | Compile Tailwind et `web/app.ts`, puis assemble la page d'envoi en un seul fichier HTML |
| `npm run build` | `build:web`, puis webpack qui produit le bundle unique `build/ydropp.js` |
| `npm run dist` | `build`, puis nexe qui produit les 3 exécutables dans `dist/` |
| `npm run dist:linux` / `dist:win` / `dist:mac` | Un seul exécutable (nécessite `npm run build` au préalable) |

## Architecture

```
src/
  cli.ts              point d'entrée : commandes et options (commander)
  commands/           une commande par fichier (listen, config, ip, qr, open, history, clean, logs)
  server.ts           serveur Express : GET / (page), PUT /upload, POST /batch-done, GET /health
  storage.ts          fichiers temporaires .part, déplacement atomique, noms uniques, nettoyage des noms
  config.ts           lecture, validation et écriture de ~/.ydropp/config.json
  downloads-dir.ts    détection du dossier Téléchargements (XDG sous Linux)
  network.ts          détection des adresses IP privées
  history.ts          historique des fichiers reçus
  logger.ts           journal winston avec rotation quotidienne
  ui/                 affichage terminal : thème (chalk), logo, encadré (boxen), QR code, barres (cli-progress), spinners (ora)
  utils/size.ts       analyse et formatage des tailles et des durées
  generated/page.ts   page HTML générée par build:web (non versionnée)
web/
  index.html          gabarit de la page d'envoi
  styles.css          Tailwind et variables de thème façon shadcn/ui (clair et sombre)
  app.ts              logique d'envoi côté navigateur
scripts/
  build-web.ts        assemblage de la page (CSS et JS intégrés dans le HTML)
  dist.ts             compilation nexe pour chaque plateforme
```

## Protocole d'envoi

Chaque fichier est envoyé dans **une requête HTTP dédiée**, sous forme de corps brut (`application/octet-stream`) et non en `multipart/form-data` :

```
PUT /upload
X-Filename: <nom encodé avec encodeURIComponent>
X-Ydropp-Key: <code PIN, si activé>     (ou ?k=<code> dans l'URL)
Content-Length: <taille>

<octets du fichier>
```

Ce choix est le plus efficace pour les gros fichiers :

- pas de découpage multipart à analyser : le corps est écrit directement sur le disque, en flux, avec une consommation de mémoire constante ;
- une progression et une annulation indépendantes pour chaque fichier ;
- des envois en parallèle (2 à la fois depuis la page).

Les réponses possibles :

| Code | Signification |
|---|---|
| `201` | Fichier enregistré. Le corps de la réponse vaut `{ "name": "<nom final>", "size": <octets> }`. |
| `400` | En-tête manquant ou invalide, ou transfert incomplet |
| `403` | Code PIN invalide |
| `413` | Fichier trop volumineux (`--max-size`) |
| `500` | Erreur d'écriture sur le disque |

Exemple avec curl :

```bash
curl -T video.mp4 -H "X-Filename: video.mp4" http://192.168.1.42:8080/upload
```

Le fichier est écrit dans `<dossier>/.ydropp-tmp/<aléatoire>.part`, puis renommé dans le dossier de destination une fois complet. Comme le dossier temporaire est sur le même système de fichiers, ce renommage est atomique. Le nom final est réservé avec une ouverture exclusive (`wx`), ce qui évite les collisions entre envois simultanés.

## Compilation multiplateforme

webpack (`target: node14`) regroupe tout le code et ses dépendances dans `build/ydropp.js`. La page HTML y est intégrée sous forme de chaîne de caractères. nexe accole ensuite ce bundle à un binaire Node **14.15.3** précompilé pour chaque cible :

| Cible nexe | Fichier produit |
|---|---|
| `linux-x64-14.15.3` | `dist/ydropp-linux` |
| `windows-x64-14.15.3` | `dist/ydropp-win.exe` |
| `mac-x64-14.15.3` | `dist/ydropp-macos` |

Node 14.15.3 est la version la plus récente pour laquelle nexe fournit des binaires précompilés pour les trois systèmes. C'est ce qui permet de compiler les trois cibles depuis Linux sans recompiler Node, et ce qui garantit la compatibilité avec Windows 8.1 et macOS 11. En conséquence, le code et les dépendances doivent rester compatibles Node 14. C'est pour cela que le projet utilise les versions CommonJS de chalk 4, ora 5, boxen 5, commander 9 et Express 4.

Les binaires téléchargés sont mis en cache dans `~/.nexe`.
