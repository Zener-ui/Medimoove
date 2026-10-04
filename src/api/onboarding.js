import client from "./client";
export const getOnboardingStatus = () => client.get("/onboarding/status");
export const markStepComplete = (step) => client.put("/onboarding/step", { step });
export const reapplyVendor = () => client.post("/onboarding/vendor/reapply");
export const reapplyRider = () => client.post("/onboarding/rider/reapply");
