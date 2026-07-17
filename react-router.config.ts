// ============================================================
// react-router.config.ts
// ============================================================
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,            // SPA mode — simplest for school admin
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
