import os from 'os';
import path from 'path';

/** Dossier user-wide de Y Dropp : $HOME/.ydropp */
export const YDROPP_HOME = path.join(os.homedir(), '.ydropp');
export const CONFIG_PATH = path.join(YDROPP_HOME, 'config.json');
export const HISTORY_PATH = path.join(YDROPP_HOME, 'history.json');
export const LOGS_DIR = path.join(YDROPP_HOME, 'logs');

/** Sous-dossier (dans le dossier de destination) où sont écrits les fichiers en cours de réception. */
export const TEMP_DIR_NAME = '.ydropp-tmp';
export const TEMP_EXTENSION = '.part';
