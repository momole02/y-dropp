# Y Dropp

Il s'agit d'un utilitaire de transfert de fichier du téléphone vers l'ordinateur. 

## Fonctionnement basique

L'utilisateur démarre un serveur HTTP via la CLI 

```bash
ydropp listen --port=<port> 
```

L'invite de commande affiche les informations suivantes sur le serveur qui a démarré: 
- l'adresse (ip privée)
- le port
- l'URL
- Un **Code QR** contenant l'URL de la page d'uploading du serveur afin que le mobile puisse aisement s'y connecter et uploader les fichiers. 


## Fonctionnement interne

L'application ```ydropp``` comporte un serveur express qui va servir deux routes:
- une route retournant du text/html comportant un formulaire d'uploading pour les fichiers
- une route chargé de recupérer les fichiers en multipart/form-data ou application/octet-stream (choisir le plus optimal pour le transfert rapide de gros fichiers) permettant d'uploader plusieurs fichiers sur le serveur. 

Le formulaire doit être stylé (avec tailwindcss, shadcn, etc...) avec barres de chargements, etc... 

A la fin de l'uploading les fichiers doivent être déplacés vers le dossier contenant les fichiers téléchargés,
- le chemin de ce dossier est spécifié au sein d'un fichier de configuration : 
par défaut on utilisera le répertoire de téléchargements relatif à l'utilisateur connecté.
- le fichier de configuration est user-wide (localisé dans ```$HOME/.ydropp/config.json```)



## Compilation
Nexe + webpack seront utilisés afin de pouvoir compiler le programme pour les plateformes suivantes:
- Linux 
- Windows (8+)
- Mac OSx (11+) 






