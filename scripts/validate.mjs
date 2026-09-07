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
  variantId = process.env.VARIANT ?? "frontend"
} = {}) {
  const content = await loadContent(rootDir);
  const errors = [];
  const projectIds = new Set(content.projects.map((project) => project.id));
  const skillIds = new Set();

  assertCondition(Boolean(content.profile.id), "profile.id is required", errors);
  assertCondition(Boolean(content.profile.name), "profile.name is required", errors);
  assertCondition(Boolean(content.profile.headline?.primary), "headline.primary is required", errors);
  assertCondition(Boolean(content.profile.contact?.email), "contact.email is required", errors);
  assertCondition(Boolean(content.variants[variantId]), `variant '${variantId}' is required`, errors);

  for (const skill of content.skills) {
    assertCondition(Boolean(skill.id), "skill.id is required", errors);
    assertCondition(Boolean(skill.name), `skill '${skill.id}' name is required`, errors);
    assertCondition(
      ["strong", "working"].includes(skill.level),
      `skill '${skill.id}' level must be 'strong' or 'working'`,
      errors
    );
    assertCondition(Boolean(skill.narrative), `skill '${skill.id}' narrative is required`, errors);
    assertCondition(
      Array.isArray(skill.keywords) && skill.keywords.length > 0,
      `skill '${skill.id}' keywords must not be empty`,
      errors
    );

    if (skill.id) {
      assertCondition(!skillIds.has(skill.id), `skill id '${skill.id}' must be unique`, errors);
      skillIds.add(skill.id);
    }
  }

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
    const orderedSkillIds = variant.skill_domain_order ?? [];
    const uniqueOrderedSkillIds = new Set(orderedSkillIds);

    assertCondition(
      uniqueOrderedSkillIds.size === orderedSkillIds.length,
      `variant '${variant.id}' skill_domain_order must not contain duplicates`,
      errors
    );
    assertCondition(
      orderedSkillIds.length === skillIds.size &&
        orderedSkillIds.every((skillId) => skillIds.has(skillId)),
      `variant '${variant.id}' skill_domain_order must include every skill`,
      errors
    );

    for (const skillId of orderedSkillIds) {
      assertCondition(
        skillIds.has(skillId),
        `variant '${variant.id}' references unknown skill '${skillId}'`,
        errors
      );
    }

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
