/**
 * Sidebar Plus — Host half.
 *
 * One plugin row, two Host features: the Folder Dock routes and the Git
 * Workbench routes. Each feature owns its own private same-origin route and
 * shares only the Web carrier.
 */
import { apply as applyFolder } from './host/folder.js';
import { apply as applyGit } from './host/git.js';

export const inject = ['webServer'];

export function apply(ctx, config = {}) {
  applyFolder(ctx, config);
  applyGit(ctx);
}
