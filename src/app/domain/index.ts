/**
 * Delt Operations Domain — central re-export.
 *
 * Single import surface for the operations taxonomy used across MCA,
 * Merchant Services, and Websites/AI modules. Pages should import from
 * `'../../domain'` rather than reaching into individual files so the
 * shape stays cohesive as backend wiring evolves.
 *
 * The shapes here intentionally mirror what a future REST/Supabase
 * layer would return. Mock data factories live alongside each module
 * and can be swapped for real fetches without page-level changes.
 */

export * from './audit';
export * from './format';
export * from './mca';
export * from './merchantServices';
export * from './aiUsage';
export * from './routes';
