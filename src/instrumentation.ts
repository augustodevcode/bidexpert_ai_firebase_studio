import { registerOTel } from './lib/observability/otel-setup';

export function register() {
  registerOTel('bidexpert-core');
}
