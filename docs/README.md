# Manuel utilisateur de Y Dropp

Y Dropp sert à envoyer des fichiers (photos, vidéos, documents…) de votre téléphone vers votre ordinateur. Il n'y a ni câble, ni application à installer sur le téléphone, ni compte à créer : il suffit que le téléphone et l'ordinateur soient sur le même réseau Wi-Fi.

## Démarrage rapide

1. **Sur l'ordinateur**, ouvrez un terminal et lancez :

   ```bash
   ydropp listen
   ```

   Un encadré s'affiche avec l'adresse du serveur et un **QR code**.

2. **Sur le téléphone**, ouvrez l'appareil photo et scannez le QR code. Une page « Y Dropp » s'ouvre dans le navigateur.

3. Touchez **« Touchez pour choisir des fichiers »** et sélectionnez un ou plusieurs fichiers. L'envoi démarre tout de suite, avec une barre de progression pour chaque fichier.

4. Les fichiers arrivent dans votre dossier **Téléchargements**. Pour arrêter le serveur, appuyez sur `Ctrl+C` dans le terminal.

## Sommaire

| Page | Contenu |
|---|---|
| [Installation](installation.md) | Télécharger et installer Y Dropp sous Linux, Windows et macOS |
| [Utilisation](utilisation.md) | Envoyer des fichiers pas à pas, retrouver les fichiers reçus |
| [Commandes](commandes.md) | Référence complète de toutes les commandes et options |
| [Configuration](configuration.md) | Le fichier `~/.ydropp/config.json` |
| [Sécurité](securite.md) | Code PIN, limites de taille, bonnes pratiques |
| [Dépannage](depannage.md) | Le téléphone n'arrive pas à se connecter ? Les solutions |
| [Développement](developpement.md) | Compiler Y Dropp depuis les sources |
