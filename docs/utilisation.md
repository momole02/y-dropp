# Utilisation

## 1. Démarrer le serveur sur l'ordinateur

```bash
ydropp listen
```

Y Dropp affiche :

- **Adresse** : l'adresse IP privée de l'ordinateur sur votre réseau (par exemple `192.168.1.42`)
- **Port** : le port d'écoute (`8080` par défaut)
- **URL** : l'adresse à ouvrir sur le téléphone (par exemple `http://192.168.1.42:8080/`)
- **Dossier** : l'endroit où les fichiers seront enregistrés
- un **QR code** qui contient l'URL

Le message « En attente de fichiers… » indique que le serveur est prêt.

> Le téléphone et l'ordinateur doivent être connectés **au même réseau** (même box, même Wi-Fi). Un téléphone en 4G/5G ne pourra pas joindre l'ordinateur.

## 2. Ouvrir la page sur le téléphone

- **Avec le QR code** : ouvrez l'appareil photo (iPhone, la plupart des Android) ou une application de lecture de QR code, visez le QR code, puis touchez le lien proposé.
- **Sans QR code** : tapez l'URL affichée dans le navigateur du téléphone (Safari, Chrome…), en commençant bien par `http://`.

La page affiche le nom de l'ordinateur (« Envoyer vers … ») et un indicateur **Connecté** en vert.

Si le serveur a été lancé avec un code PIN (`--pin`), le code est déjà inclus dans le QR code. Si vous tapez l'URL à la main sans le code, la page vous demandera de saisir les 6 chiffres affichés dans le terminal.

## 3. Envoyer des fichiers

1. Touchez la zone **« Touchez pour choisir des fichiers »**.
2. Choisissez un ou plusieurs fichiers (photos, vidéos, documents, fichiers de l'application Fichiers…).
3. L'envoi commence automatiquement. Deux fichiers sont envoyés en même temps, les autres attendent leur tour.

Sur un ordinateur, vous pouvez aussi **glisser-déposer** des fichiers sur la page.

Pendant l'envoi :

- chaque fichier a sa barre de progression, avec le pourcentage, le débit et le temps restant ;
- l'encadré du haut affiche la progression globale (nombre de fichiers, volume, débit) ;
- le bouton **×** annule l'envoi d'un fichier ou le retire de la file d'attente ;
- après un échec ou une annulation, le bouton **↻** relance l'envoi ;
- **Effacer les terminés** vide la liste des fichiers déjà envoyés.

Vous pouvez ajouter d'autres fichiers à tout moment, même pendant un envoi.

> Gardez la page ouverte et l'écran du téléphone allumé jusqu'à la fin de l'envoi. Si le téléphone se met en veille, le navigateur peut interrompre le transfert. Il suffit alors de toucher **↻** pour recommencer.

Côté ordinateur, le terminal affiche une barre de progression pour chaque fichier en cours de réception, puis une ligne par fichier reçu :

```
✔ IMG_2041.HEIC                  2,9 Mo    en 0,4 s (7,1 Mo/s)  ← 192.168.1.20
```

## 4. Retrouver les fichiers reçus

Les fichiers sont enregistrés dans le **dossier de destination** affiché au démarrage, par défaut le dossier Téléchargements de l'utilisateur (`~/Téléchargements` ou `~/Downloads` selon la langue du système).

- `ydropp open` ouvre ce dossier dans l'explorateur de fichiers.
- `ydropp history` liste les derniers fichiers reçus, avec leur emplacement exact.

Pour changer le dossier de destination :

```bash
# pour une seule session
ydropp listen --dir ~/Images/Telephone

# de façon permanente
ydropp config set downloadDir ~/Images/Telephone
```

### Fichiers portant le même nom

Un fichier existant n'est **jamais écrasé**. Si `photo.jpg` existe déjà, le nouveau fichier est enregistré sous `photo (1).jpg`, puis `photo (2).jpg`, etc. La page du téléphone indique le nom final (« enregistré sous … »).

### Pendant le transfert

Un fichier en cours de réception est d'abord écrit dans le sous-dossier caché `.ydropp-tmp` du dossier de destination. Il n'apparaît à son emplacement final qu'une fois **complet**. Vous ne trouverez donc jamais de fichier à moitié reçu dans votre dossier. Si un transfert est interrompu, le fichier partiel est supprimé automatiquement.

## 5. Arrêter le serveur

Appuyez sur `Ctrl+C` dans le terminal. Y Dropp affiche un récapitulatif de la session (nombre de fichiers reçus, volume total, échecs, durée).

Pour que le serveur s'arrête tout seul après un envoi, utilisez `ydropp listen --once`.

## Exemples courants

```bash
# Envoi rapide et ponctuel, sécurisé par un code PIN, arrêt automatique à la fin
ydropp listen --pin --once

# Utiliser un autre port (si 8080 est déjà pris)
ydropp listen --port 9000

# Laisser le système choisir un port libre
ydropp listen --port 0

# Refuser les fichiers de plus de 2 Go
ydropp listen --max-size 2G
```
