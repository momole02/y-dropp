# Référence des commandes

```
ydropp [options globales] <commande> [options]
```

`ydropp --help` affiche la liste des commandes, et `ydropp <commande> --help` (ou `ydropp help <commande>`) affiche l'aide d'une commande.

## Options globales

Ces options s'utilisent avec n'importe quelle commande.

| Option | Description |
|---|---|
| `-v`, `--version` | Affiche la version de Y Dropp |
| `-h`, `--help` | Affiche l'aide |
| `--verbose` | Journal détaillé (niveau `debug`) |
| `--quiet` | Journal limité aux erreurs (niveau `error`) |
| `--log-level <niveau>` | Niveau du journal : `error`, `warn`, `info` ou `debug` |
| `--no-color` | Désactive les couleurs et les animations |

Les couleurs et les animations sont aussi désactivées automatiquement quand la sortie n'est pas un terminal (redirection vers un fichier, `| less`…) ou quand la variable d'environnement `NO_COLOR` est définie.

Si plusieurs options de journalisation sont données, `--log-level` l'emporte sur `--verbose`, qui l'emporte sur `--quiet`, qui l'emporte sur la valeur `logLevel` de la [configuration](configuration.md).

---

## `ydropp listen`

Démarre le serveur de réception et affiche l'adresse, le port, l'URL et le QR code.

```bash
ydropp listen [options]
```

| Option | Description | Par défaut |
|---|---|---|
| `-p`, `--port <port>` | Port d'écoute. `0` laisse le système choisir un port libre. | valeur `port` de la config (8080) |
| `-d`, `--dir <dossier>` | Dossier de destination pour cette session, sans modifier la config | valeur `downloadDir` de la config |
| `--host <ip>` | Adresse IP à utiliser, parmi celles listées par `ydropp ip`. Le serveur n'écoute alors que sur cette interface. | détection automatique, écoute sur toutes les interfaces |
| `--pin` | Exige un code PIN à 6 chiffres, généré à chaque démarrage et inclus dans le QR code | valeur `pin` de la config (non) |
| `--no-pin` | Désactive le code PIN même s'il est activé dans la config | |
| `--once` | Arrête le serveur automatiquement après le premier lot de fichiers reçus | non |
| `--max-size <taille>` | Refuse les fichiers plus gros que cette taille. Exemples : `500M`, `4G`, `1.5Go` | pas de limite |
| `--no-qr` | N'affiche pas le QR code | QR code affiché |

**Exemples**

```bash
ydropp listen
ydropp listen --port=9000
ydropp listen --pin --once
ydropp listen --dir ~/Images --max-size 4G
ydropp listen --host 192.168.1.42
```

**À savoir**

- Si l'ordinateur a plusieurs adresses privées (Wi-Fi et Ethernet par exemple), elles sont toutes affichées. Le QR code utilise la plus probable.
- Avec `--once`, le lot est considéré comme terminé quand la page du téléphone a fini d'envoyer tous les fichiers sélectionnés. Pour un client qui ne le signale pas (comme `curl`), le serveur s'arrête après 5 secondes sans nouvel envoi.
- `Ctrl+C` arrête le serveur proprement et affiche un récapitulatif.

---

## `ydropp config`

Affiche ou modifie la configuration (`~/.ydropp/config.json`). Voir [Configuration](configuration.md) pour le détail des clés.

| Commande | Description |
|---|---|
| `ydropp config` | Affiche toutes les clés, leur valeur et leur description |
| `ydropp config get <clé>` | Affiche la valeur d'une clé (pratique dans un script) |
| `ydropp config set <clé> <valeur>` | Modifie une clé. La valeur est vérifiée avant d'être enregistrée. |
| `ydropp config reset` | Rétablit toutes les valeurs par défaut |
| `ydropp config path` | Affiche le chemin du fichier de configuration |

**Exemples**

```bash
ydropp config set downloadDir ~/Images/Telephone
ydropp config set port 9000
ydropp config set pin true
ydropp config set logLevel debug
ydropp config get downloadDir
```

---

## `ydropp ip`

Liste les interfaces réseau de l'ordinateur avec leur adresse IPv4. Pour chacune, la commande indique si l'adresse est privée ou publique, si l'interface est virtuelle (Docker, machine virtuelle, VPN…), et laquelle est utilisée par défaut. C'est utile pour choisir une adresse avec `--host`.

```bash
ydropp ip
```

---

## `ydropp qr`

Réaffiche le QR code de l'URL **sans démarrer de serveur**, par exemple quand le terminal a défilé. Le serveur doit déjà tourner (dans un autre terminal) avec le même port.

| Option | Description |
|---|---|
| `-p`, `--port <port>` | Port du serveur (par défaut, celui de la config) |
| `--host <ip>` | Adresse IP à utiliser |
| `--pin <code>` | Code PIN du serveur en cours, à inclure dans le QR code |

```bash
ydropp qr --port 9000 --pin 123456
```

---

## `ydropp open`

Ouvre le dossier de destination dans le gestionnaire de fichiers (Explorateur Windows, Finder ou le gestionnaire de fichiers de Linux).

```bash
ydropp open
```

---

## `ydropp history`

Liste les derniers fichiers reçus avec leur date, leur taille, la durée du transfert, l'appareil d'origine et leur emplacement. L'historique garde les 500 derniers fichiers.

| Option | Description | Par défaut |
|---|---|---|
| `-n`, `--limit <n>` | Nombre d'entrées à afficher | 20 |
| `--json` | Sortie au format JSON | |
| `--clear` | Vide l'historique (les fichiers eux-mêmes ne sont pas supprimés) | |

```bash
ydropp history
ydropp history -n 100
ydropp history --json > recus.json
```

---

## `ydropp clean`

Supprime les fichiers partiels (`.part`) laissés dans le sous-dossier `.ydropp-tmp` quand Y Dropp a été arrêté brutalement pendant un transfert (coupure de courant, fermeture forcée…). En temps normal, ce nettoyage est automatique.

| Option | Description |
|---|---|
| `-d`, `--dir <dossier>` | Dossier de destination à nettoyer (par défaut, celui de la config) |

```bash
ydropp clean
```

---

## `ydropp logs`

Affiche le journal le plus récent (`~/.ydropp/logs/`), avec des couleurs selon le niveau de chaque ligne.

| Option | Description | Par défaut |
|---|---|---|
| `-n`, `--lines <n>` | Nombre de lignes à afficher | 50 |
| `-f`, `--follow` | Suit le journal en temps réel (`Ctrl+C` pour quitter) | |
| `--raw` | Affiche les lignes JSON brutes | |
| `--path` | Affiche seulement le chemin du dossier des journaux | |

```bash
ydropp logs
ydropp logs -f
ydropp logs -n 200 --raw
```

---

## Codes de sortie

| Code | Signification |
|---|---|
| `0` | Succès |
| `1` | Erreur (le message d'erreur est affiché en rouge et enregistré dans le journal) |
