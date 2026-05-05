/**
 * Delt Backend UI primitives — single source of truth for buttons, cards,
 * page headers, badges, inputs, toolbars, and empty states across all
 * backend (admin/agent CRM) pages.
 *
 * Usage:
 *   import { BackendButton, BackendCard, BackendPageHeader } from '../ui';
 *
 * These primitives intentionally live alongside the backend pages (rather
 * than in the lower-level `ui/` shadcn folder) because they encode the
 * Delt admin product's specific design tokens — radius, spacing rhythm,
 * `--brand` color, gray-200 borders, 8px surfaces, etc.
 */
export { BackendButton } from './BackendButton';
export {
  BackendCard,
  BackendCardHeader,
  BackendCardBody,
  BackendCardFooter,
} from './BackendCard';
export {
  BackendPageHeader,
  BackendPageContainer,
  BackendSectionHeading,
} from './BackendPageHeader';
export { BackendBadge } from './BackendBadge';
export {
  BackendInput,
  BackendSelect,
  BackendTextarea,
  BackendFieldLabel,
} from './BackendInput';
export { BackendToolbar, BackendFilterRow } from './BackendToolbar';
export { BackendEmptyState } from './BackendEmptyState';
