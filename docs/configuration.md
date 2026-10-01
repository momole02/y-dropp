# Configuration

La configuration de Y Dropp est propre à chaque utilisateur et se trouve dans :

| Système | Emplacement |
|---|---|
| Linux, macOS | `~/.ydropp/config.json` |
| Windows | `%USERPROFILE%\.ydropp\config.json` |

Ce fichier est créé automatiquement, avec les valeurs par défaut, la première fois que vous utilisez Y Dropp. `ydropp config path` affiche son emplacement exact.

## Clés disponibles

| Clé | Type | Par défaut | Description |
|---|---|---|---|
| `downloadDir` | chemin | dossier Téléchargements de l'utilisateur | Dossier où sont enregistrés les fichiers reçus. Il est créé s'il n'existe pas. |
| `port` | entier (0 à 65535) | `8080` | Port utilisé par `ydropp listen` quand `--port` n'est pas précisé |
| `pin` | `true` / `false` | `false` | Exiger un code PIN à chaque `ydropp listen` (comme `--pin`) |
| `logLevel` | `error`, `warn`, `info`, `debug` | `info` | Niveau de détail du journal |

### Dossier de téléchargement par défaut

- **Linux** : le dossier de téléchargement défini par votre bureau (`XDG_DOWNLOAD_DIR` dans `~/.config/user-dirs.dirs`), par exemple `~/Téléchargements` sur un système en français. À défaut, `~/Downloads`.
- **Windows** : `C:\Users\<vous>\Downloads`
- **macOS** : `~/Downloads`

## Modifier la configuration

Le plus simple est d'utiliser `ydropp config set`, qui vérifie les valeurs :

```bash
ydropp config set downloadDir ~/Images/Telephone
ydropp config set port 9000
ydropp config set pin true
ydropp config set logLevel warn
```

Pour `pin`, les valeurs `true`, `false`, `oui`, `non`, `1` et `0` sont acceptées. Le caractère `~` est remplacé par votre dossier personnel.

Vous pouvez aussi modifier le fichier à la main. Une valeur invalide est ignorée et remplacée par sa valeur par défaut. Si le fichier n'est plus du JSON valide, Y Dropp affiche une erreur : corrigez-le ou lancez `ydropp config reset`.

## Exemple complet

```json
{
  "downloadDir": "/home/marc/Images/Telephone",
  "port": 9000,
  "pin": true,
  "logLevel": "info"
}
```

## Priorité des réglages

Une option passée en ligne de commande l'emporte toujours sur la configuration, pour la commande en cours uniquement :

| Réglage | Option qui l'emporte |
|---|---|
| `downloadDir` | `ydropp listen --dir` / `ydropp clean --dir` |
| `port` | `--port` |
| `pin` | `--pin` / `--no-pin` |
| `logLevel` | `--log-level`, `--verbose`, `--quiet` |

## Autres fichiers du dossier `~/.ydropp`

| Fichier | Contenu |
|---|---|
| `history.json` | Historique des 500 derniers fichiers reçus (`ydropp history`) |
| `logs/ydropp-AAAA-MM-JJ.log` | Journaux quotidiens au format JSON, conservés 14 jours (`ydropp logs`) |
