# Dépannage

## Le téléphone n'arrive pas à ouvrir la page

C'est le problème le plus courant. Vérifiez dans l'ordre :

1. **Même réseau** : le téléphone doit être connecté au **même Wi-Fi** que l'ordinateur, et pas en 4G/5G. Certaines box ont deux réseaux (par exemple « MaBox » et « MaBox-5G ») qui communiquent normalement entre eux, mais pas les réseaux « invités ».
2. **URL complète** : l'URL doit commencer par `http://` (et non `https://`) et contenir le port, par exemple `http://192.168.1.42:8080/`.
3. **Pare-feu** : le pare-feu de l'ordinateur doit autoriser le port. Voir [Installation › pare-feu](installation.md#autoriser-y-dropp-dans-le-pare-feu). Sous Windows, vérifiez que le Wi-Fi est déclaré comme réseau **privé** et non public.
4. **Bonne adresse IP** : si l'ordinateur a plusieurs interfaces (Wi-Fi, Ethernet, VPN, Docker, machine virtuelle…), l'adresse choisie automatiquement n'est peut-être pas la bonne. Listez-les avec la commande ci-dessous, puis relancez le serveur avec l'adresse de l'interface Wi-Fi ou Ethernet :

   ```bash
   ydropp ip
   ydropp listen --host 192.168.1.42
   ```

5. **Isolation des clients** : certains réseaux (Wi-Fi public, hôtel, entreprise, réseau invité) empêchent les appareils de communiquer entre eux. Dans ce cas, Y Dropp ne peut pas fonctionner. Utilisez un autre réseau, ou activez le **partage de connexion** du téléphone et connectez-y l'ordinateur.
6. **VPN** : un VPN actif sur le téléphone ou l'ordinateur peut bloquer le trafic local. Désactivez-le le temps du transfert.

Pour vérifier que le serveur répond, ouvrez l'URL dans le navigateur **de l'ordinateur lui-même**. Si la page s'affiche sur l'ordinateur mais pas sur le téléphone, le problème vient du réseau ou du pare-feu.

## « Le port 8080 est déjà utilisé »

Un autre programme utilise déjà ce port (ou un autre Y Dropp tourne encore). Choisissez un autre port, ou laissez le système en choisir un libre :

```bash
ydropp listen --port 9000
ydropp listen --port 0
```

Pour changer le port de façon permanente : `ydropp config set port 9000`.

## « Permission refusée pour le port »

Les ports inférieurs à 1024 sont réservés à l'administrateur. Utilisez un port plus élevé, par exemple 8080 ou 9000.

## « Code PIN invalide »

Le code PIN change à **chaque démarrage** du serveur. Si vous avez relancé `ydropp listen`, rescannez le nouveau QR code, ou saisissez le nouveau code dans la page du téléphone.

## L'envoi s'interrompt (« Connexion perdue avec l'ordinateur »)

- L'écran du téléphone s'est éteint ou vous avez changé d'application : le navigateur a suspendu la page. Gardez la page ouverte au premier plan pendant l'envoi.
- Le Wi-Fi est instable : rapprochez-vous de la box.
- Le serveur a été arrêté côté ordinateur.

Touchez **↻** à côté du fichier pour relancer son envoi. Le fichier partiel déjà reçu est supprimé automatiquement.

## « Fichier trop volumineux »

Le serveur a été lancé avec `--max-size`. Relancez-le avec une limite plus élevée, ou sans cette option.

## Il reste des fichiers `.part` dans `.ydropp-tmp`

Y Dropp a été arrêté brutalement pendant un transfert. Supprimez-les avec :

```bash
ydropp clean
```

## Le QR code est illisible

- Agrandissez la fenêtre du terminal ou réduisez la taille de la police.
- Utilisez un thème de terminal à fond sombre ou à fond clair bien contrasté.
- Tapez l'URL directement dans le navigateur du téléphone.
- `ydropp qr` réaffiche le QR code à tout moment.

## Les couleurs s'affichent mal (caractères bizarres)

Votre terminal ne gère peut-être pas les couleurs ou les caractères Unicode, ce qui arrive par exemple avec l'ancienne console de Windows 8. Désactivez-les :

```bash
ydropp --no-color listen
```

ou définissez la variable d'environnement `NO_COLOR=1`.

## Où trouver plus d'informations sur une erreur ?

Consultez le journal, qui contient le détail des erreurs :

```bash
ydropp logs
ydropp --verbose listen    # journal encore plus détaillé
```

Les fichiers de journal se trouvent dans `~/.ydropp/logs/` (`ydropp logs --path`).
