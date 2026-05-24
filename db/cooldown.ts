import { resetAllCooldown } from "./mongodb.js";

resetAllCooldown()
    .then(() => console.log('✅ Cooldowns reiniciados'))
    .catch((err) => console.error(err))