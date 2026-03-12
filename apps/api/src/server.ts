import "dotenv/config";

import { createApp } from "./app.js";
import { apiEnv } from "./config/env.js";

const app = createApp();

app.listen(apiEnv.PORT, () => {
  console.log(`[api] listening on http://localhost:${apiEnv.PORT}`);
});
