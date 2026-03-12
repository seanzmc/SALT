import "dotenv/config";

import { createApp } from "./app";
import { apiEnv } from "./config/env";

const app = createApp();

app.listen(apiEnv.PORT, () => {
  console.log(`[api] listening on http://localhost:${apiEnv.PORT}`);
});
