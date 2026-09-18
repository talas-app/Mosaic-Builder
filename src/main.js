/**
 * Boot. The only script index.html loads.
 *
 * MOS-00001 decision 4: ES modules served over http, no build step, `file://`
 * unsupported.
 */

import { createState } from './state.js';
import { renderField } from './field.js';
import { readFromUrl } from './url.js';

// Imported so the seam and its consumers are reachable from boot and load as
// modules from the first commit. Their bodies arrive with their own tickets.
import './rest.js';
import './paint.js';
import './history.js';
import './select.js';
import './palette.js';
import './schedule.js';
import './export-svg.js';
import './import-svg.js';

function boot() {
  // The file:// case never reaches here: a module does not load over file://
  // at all, which is why that guard is a classic inline script in index.html
  // rather than anything in this file.

  // The URL is the save file (decision 5), so it is the first thing consulted.
  const state = readFromUrl() ?? createState();
  renderField(document.getElementById('field'), state);
}

boot();
