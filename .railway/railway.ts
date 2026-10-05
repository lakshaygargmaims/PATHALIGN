import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
  const web = service("web", {
    source: github("lakshaygargmaims/PATHALIGN"),
    build: "npm run build",
    start: "next start -p 3200",
  });

  return project("pathalign-ai", {
    resources: [web],
  });
});
