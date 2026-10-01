# Installation

Y Dropp est distribué sous la forme d'un **fichier exécutable unique** par système. Il n'y a rien d'autre à installer : Node.js n'est pas nécessaire.

| Système | Fichier | Versions prises en charge |
|---|---|---|
| Linux (64 bits) | `ydropp-linux` | Distributions récentes (glibc) |
| Windows (64 bits) | `ydropp-win.exe` | Windows 8.1, 10, 11 |
| macOS | `ydropp-macos` | macOS 11 (Big Sur) et plus récent, Mac Intel et Apple Silicon |

> Sur les Mac Apple Silicon (M1, M2…), Y Dropp fonctionne via Rosetta 2. Si macOS vous propose de l'installer au premier lancement, acceptez.

## Linux

```bash
# 1. Rendre le fichier exécutable
chmod +x ydropp-linux

# 2. L'installer dans le PATH sous le nom "ydropp"
mkdir -p ~/.local/bin
mv ydropp-linux ~/.local/bin/ydropp

# 3. Vérifier
ydropp --version
```

Si la commande `ydropp` est introuvable, ajoutez `~/.local/bin` à votre PATH en ajoutant cette ligne dans `~/.bashrc` (ou `~/.zshrc`), puis ouvrez un nouveau terminal :

```bash
export PATH="$HOME/.local/bin:$PATH"
```

## Windows

1. Créez un dossier, par exemple `C:\Outils\ydropp`, et placez-y `ydropp-win.exe` en le renommant `ydropp.exe`.
2. Ajoutez ce dossier au PATH : menu Démarrer → tapez « variables d'environnement » → **Modifier les variables d'environnement pour votre compte** → sélectionnez `Path` → **Modifier** → **Nouveau** → `C:\Outils\ydropp`.
3. Ouvrez un **nouveau** terminal (PowerShell ou Invite de commandes) et vérifiez :

   ```powershell
   ydropp --version
   ```

Windows SmartScreen peut afficher « Windows a protégé votre ordinateur » au premier lancement. Cliquez alors sur **Informations complémentaires** puis sur **Exécuter quand même**.

## macOS

```bash
# 1. Rendre le fichier exécutable et l'installer
chmod +x ydropp-macos
sudo mv ydropp-macos /usr/local/bin/ydropp

# 2. Retirer l'attribut de quarantaine (fichier téléchargé depuis Internet)
sudo xattr -d com.apple.quarantine /usr/local/bin/ydropp

# 3. Vérifier
ydropp --version
```

Si macOS affiche « ydropp ne peut pas être ouvert car le développeur n'est pas identifié », allez dans **Réglages Système → Confidentialité et sécurité** et cliquez sur **Ouvrir quand même**.

## Autoriser Y Dropp dans le pare-feu

Le téléphone doit pouvoir joindre l'ordinateur sur le port utilisé par Y Dropp (**8080** par défaut).

- **Windows** : au premier `ydropp listen`, Windows demande si l'application peut communiquer sur les réseaux. Cochez **Réseaux privés**, puis cliquez sur **Autoriser l'accès**. Vérifiez aussi que votre Wi-Fi est bien déclaré comme réseau **privé** (Paramètres → Réseau et Internet → Wi-Fi → propriétés du réseau).
- **macOS** : si le pare-feu est activé, macOS demande d'autoriser les connexions entrantes. Cliquez sur **Autoriser**.
- **Linux (ufw)** :

  ```bash
  sudo ufw allow 8080/tcp
  ```

- **Linux (firewalld)** :

  ```bash
  sudo firewall-cmd --add-port=8080/tcp --permanent && sudo firewall-cmd --reload
  ```

## Désinstallation

Supprimez l'exécutable, puis, si vous le souhaitez, le dossier de configuration et de journaux :

- Linux et macOS : `rm -rf ~/.ydropp`
- Windows : supprimez le dossier `%USERPROFILE%\.ydropp`

Les fichiers que vous avez déjà reçus restent dans votre dossier Téléchargements.
