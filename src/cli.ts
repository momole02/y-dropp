import { Command, Option } from 'commander';
import { LOG_LEVELS, LogLevel, loadConfig } from './config';
import { closeLogger, errorMeta, logger, setLogLevel } from './logger';
import { cleanCommand } from './commands/clean';
import { configGetCommand, configPathCommand, configResetCommand, configSetCommand, configShowCommand } from './commands/config';
import { historyCommand } from './commands/history';
import { ipCommand } from './commands/ip';
import { listenCommand } from './commands/listen';
import { logsCommand } from './commands/logs';
import { openCommand } from './commands/open';
import { qrCommand } from './commands/qr';
import { configureOutput } from './ui/theme';
import * as print from './ui/print';
import { VERSION } from './version';

interface GlobalOptions {
  verbose?: boolean;
  quiet?: boolean;
  logLevel?: LogLevel;
  color: boolean;
}

/** Enveloppe une action : affiche proprement l'erreur et la journalise. */
function run<A extends unknown[]>(fn: (...args: A) => unknown) {
  return async (...args: A): Promise<void> => {
    try {
      await fn(...args);
    } catch (err) {
      const e = err as Error;
      print.error(e.message);
      logger().error('command failed', { command: process.argv.slice(2).join(' '), error: errorMeta(e) });
      await closeLogger();
      process.exit(1);
    }
  };
}

const program = new Command();

program
  .name('ydropp')
  .description('Transférez des fichiers de votre téléphone vers cet ordinateur via le réseau local.')
  .version(VERSION, '-v, --version', 'Affiche la version')
  .helpOption('-h, --help', "Affiche l'aide")
  .addHelpCommand('help [commande]', "Affiche l'aide d'une commande")
  .option('--verbose', 'Journal détaillé (niveau debug)')
  .option('--quiet', 'Journal limité aux erreurs')
  .addOption(new Option('--log-level <niveau>', 'Niveau du journal').choices([...LOG_LEVELS]))
  .option('--no-color', 'Désactive les couleurs et animations')
  .showSuggestionAfterError()
  .hook('preAction', () => {
    const opts = program.opts<GlobalOptions>();
    configureOutput({ color: opts.color });
    let level: LogLevel = 'info';
    try {
      level = loadConfig().logLevel;
    } catch {
      // config illisible : la commande affichera l'erreur elle-même
    }
    if (opts.quiet) level = 'error';
    if (opts.verbose) level = 'debug';
    if (opts.logLevel) level = opts.logLevel;
    setLogLevel(level);
    logger().debug('command', { argv: process.argv.slice(2), version: VERSION, platform: process.platform, node: process.version });
  });

program
  .command('listen')
  .description('Démarre le serveur de réception et affiche le QR code à scanner')
  .option('-p, --port <port>', 'Port d’écoute (0 = port libre aléatoire)')
  .option('-d, --dir <dossier>', 'Dossier de destination pour cette session')
  .option('--host <ip>', 'Adresse IP à utiliser (voir "ydropp ip")')
  .option('--pin', 'Exige un code PIN à 6 chiffres (inclus dans le QR code)')
  .option('--no-pin', 'Désactive le code PIN même s’il est activé dans la config')
  .option('--once', "S'arrête après le premier lot de fichiers reçus")
  .option('--max-size <taille>', 'Taille maximale par fichier (ex. 500M, 4G)')
  .option('--no-qr', "N'affiche pas le QR code")
  .action(run(listenCommand));

const config = program.command('config').description('Affiche ou modifie la configuration ($HOME/.ydropp/config.json)');
config.action(run(configShowCommand));
config.command('get <clé>').description("Affiche la valeur d'une clé").action(run(configGetCommand));
config.command('set <clé> <valeur>').description("Modifie la valeur d'une clé").action(run(configSetCommand));
config.command('reset').description('Rétablit les valeurs par défaut').action(run(configResetCommand));
config.command('path').description('Affiche le chemin du fichier de configuration').action(run(configPathCommand));

program.command('ip').description('Liste les interfaces réseau et leurs adresses IP').action(run(ipCommand));

program
  .command('qr')
  .description("Réaffiche le QR code de l'URL sans démarrer de serveur")
  .option('-p, --port <port>', 'Port du serveur')
  .option('--host <ip>', 'Adresse IP à utiliser')
  .option('--pin <code>', 'Code PIN du serveur en cours')
  .action(run(qrCommand));

program.command('open').description('Ouvre le dossier de destination dans le gestionnaire de fichiers').action(run(openCommand));

program
  .command('history')
  .description('Liste les derniers fichiers reçus')
  .option('-n, --limit <n>', "Nombre d'entrées à afficher", '20')
  .option('--json', 'Sortie au format JSON')
  .option('--clear', "Vide l'historique")
  .action(run(historyCommand));

program
  .command('clean')
  .description('Supprime les fichiers partiels laissés par des transferts interrompus')
  .option('-d, --dir <dossier>', 'Dossier de destination à nettoyer')
  .action(run(cleanCommand));

program
  .command('logs')
  .description('Affiche le journal du jour')
  .option('-f, --follow', 'Suit le journal en temps réel')
  .option('-n, --lines <n>', 'Nombre de lignes à afficher', '50')
  .option('--raw', 'Affiche les lignes JSON brutes')
  .option('--path', 'Affiche le chemin du dossier des journaux')
  .action(run(logsCommand));

process.on('unhandledRejection', (reason) => {
  logger().error('unhandled rejection', { error: errorMeta(reason) });
  print.error(`Erreur inattendue : ${(reason as Error)?.message ?? String(reason)}`);
});

program.parseAsync(process.argv).catch((err) => {
  print.error((err as Error).message);
  process.exit(1);
});
