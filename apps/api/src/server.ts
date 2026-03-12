import "dotenv/config";

import app from "./app.js";
import { apiEnv } from "./config/env.js";

app.listen(apiEnv.PORT, () => {
  console.log(`[api] listening on http://localhost:${apiEnv.PORT}`);
});
