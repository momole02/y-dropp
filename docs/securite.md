# Sécurité

Y Dropp est conçu pour des transferts ponctuels sur un **réseau de confiance** (votre réseau Wi-Fi personnel ou celui de votre bureau). Voici ce qu'il faut savoir.

## Qui peut envoyer des fichiers ?

Sans précaution particulière, **tout appareil connecté au même réseau** et qui connaît l'URL peut envoyer des fichiers vers votre ordinateur tant que le serveur tourne. Sur un réseau partagé (café, hôtel, coworking, Wi-Fi public…), activez **toujours** le code PIN.

### Le code PIN

```bash
ydropp listen --pin
```

- Un code aléatoire à 6 chiffres est généré à chaque démarrage et affiché dans le terminal.
- Le code est inclus dans le QR code : en le scannant, le téléphone est autorisé automatiquement.
- Tout envoi sans le bon code est refusé, et la tentative est signalée dans le terminal et dans le journal.

Pour l'activer en permanence :

```bash
ydropp config set pin true
```

## Limiter ce qui est accepté

- `--max-size 2G` refuse les fichiers trop volumineux, ce qui évite qu'un envoi remplisse votre disque.
- `--once` arrête le serveur dès que votre envoi est terminé, ce qui limite le temps pendant lequel l'ordinateur accepte des fichiers.
- `--host <ip>` limite l'écoute à une seule interface réseau, par exemple uniquement le Wi-Fi et pas un réseau virtuel ou un VPN.

## Ce que Y Dropp fait pour vous protéger

- **Aucun fichier n'est écrasé** : en cas de nom identique, un suffixe ` (1)`, ` (2)`… est ajouté.
- **Les noms de fichiers sont nettoyés** : les chemins (`../`), les caractères interdits et les noms réservés de Windows (`CON`, `NUL`…) sont neutralisés. Un fichier ne peut donc pas être écrit en dehors du dossier de destination.
- **Pas de fichier incomplet** : un transfert interrompu ou dont la taille ne correspond pas est supprimé.
- **Uniquement dans un sens** : Y Dropp ne permet pas de lister, lire ou télécharger les fichiers de l'ordinateur depuis le téléphone.
- **Rien ne sort du réseau local** : aucun service externe ni aucune connexion à Internet ne sont utilisés.

## Limites

- **Pas de chiffrement (HTTP et non HTTPS)** : les fichiers circulent en clair sur le réseau local. Sur un réseau dont vous n'êtes pas sûr, n'envoyez pas de documents sensibles (pièces d'identité, données bancaires…).
- Le code PIN protège contre les envois non désirés, mais pas contre l'écoute du réseau.
- Arrêtez le serveur (`Ctrl+C`) quand vous ne l'utilisez plus.

## Journal des activités

Les connexions, les fichiers reçus et les tentatives refusées sont enregistrés avec l'adresse IP de l'appareil d'origine :

```bash
ydropp logs
```
