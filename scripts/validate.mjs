import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume, buildPublicResume, loadContent } from "./normalize.mjs";

function assertCondition(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

export async function validateAll({
  rootDir = process.cwd(),
  variantId = "frontend"
} = {}) {
  const content = await loadContent(rootDir);
  const errors = [];
  const projectIds = new Set(content.projects.map((project) => project.id));

  assertCondition(Boolean(content.profile.id), "profile.id is required", errors);
  assertCondition(Boolean(content.profile.name), "profile.name is required", errors);
  assertCondition(Boolean(content.profile.headline?.primary), "headline.primary is required", errors);
  assertCondition(Boolean(content.profile.contact?.email), "contact.email is required", errors);
  assertCondition(Boolean(content.variants[variantId]), `variant '${variantId}' is required`, errors);

  for (const item of content.experience) {
    assertCondition(Boolean(item.id), "experience.id is required", errors);
    assertCondition(Boolean(item.company), `experience '${item.id}' company is required`, errors);

    for (const projectId of item.project_refs ?? []) {
      assertCondition(
        projectIds.has(projectId),
        `experience '${item.id}' references unknown project '${projectId}'`,
        errors
      );
    }
  }

  for (const variant of Object.values(content.variants)) {
    for (const projectId of variant.featured_project_ids ?? []) {
      assertCondition(
        projectIds.has(projectId),
        `variant '${variant.id}' references unknown featured project '${projectId}'`,
        errors
      );
    }
  }

  const canonicalResume = await buildCanonicalResume({ rootDir, variantId });
  const publicResume = buildPublicResume(canonicalResume);

  assertCondition(canonicalResume.featuredProjects.length > 0, "featuredProjects must not be empty", errors);
  assertCondition(publicResume.meta.visibility === "public", "public visibility must be set", errors);

  if (errors.length > 0) {
    const error = new Error(`Validation failed:\n- ${errors.join("\n- ")}`);
    error.validationErrors = errors;
    throw error;
  }

  return {
    canonicalResume,
    publicResume
  };
}

async function main() {
  const result = await validateAll();
  console.log(`Validated variant '${result.canonicalResume.variant.id}' successfully.`);
}

const currentFilePath = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
