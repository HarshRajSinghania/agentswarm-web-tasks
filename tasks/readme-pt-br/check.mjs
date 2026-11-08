import {run} from '../../checks/run.mjs';
import {fileURLToPath} from 'node:url';
run(fileURLToPath(new URL('./worker.mjs', import.meta.url)));
