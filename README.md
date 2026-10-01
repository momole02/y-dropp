# Y Dropp

Envoyez des fichiers de votre téléphone vers votre ordinateur, sans câble ni application : lancez `ydropp listen`, scannez le QR code, choisissez vos fichiers.

```bash
ydropp listen
```

- Page d'envoi mobile avec une barre de progression par fichier, le débit et le temps restant
- Envoi en flux (`application/octet-stream`), adapté aux très gros fichiers
- Fichiers enregistrés dans votre dossier Téléchargements (configurable dans `~/.ydropp/config.json`)
- Code PIN optionnel, limite de taille, arrêt automatique après un envoi
- Historique des réceptions et journaux
- Exécutable unique pour Linux, Windows 8.1+ et macOS 11+

## Documentation

Le manuel complet se trouve dans [docs/](docs/README.md) : [installation](docs/installation.md), [utilisation](docs/utilisation.md), [commandes](docs/commandes.md), [configuration](docs/configuration.md), [sécurité](docs/securite.md), [dépannage](docs/depannage.md) et [développement](docs/developpement.md).

## Compiler depuis les sources

```bash
npm install
npm start -- listen     # lancer depuis les sources
npm run dist            # produire dist/ydropp-linux, dist/ydropp-win.exe, dist/ydropp-macos
```
