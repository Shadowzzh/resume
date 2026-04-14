import fs from "node:fs/promises";
import path from "node:path";

import YAML from "yaml";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readYamlFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return YAML.parse(content);
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    throw new Error("Project markdown must include frontmatter.");
  }

  return {
    data: YAML.parse(match[1]),
    body: match[2].trim()
  };
}

async function loadProjects(projectsDir) {
  const entries = await fs.readdir(projectsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();

  const projects = [];

  for (const fileName of files) {
    const filePath = path.join(projectsDir, fileName);
    const content = await fs.readFile(filePath, "utf8");
    const parsed = parseFrontmatter(content);

    projects.push({
      ...parsed.data,
      body: parsed.body,
      sourcePath: path.relative(projectsDir, filePath)
    });
  }

  return projects;
}

function orderByIds(items, orderedIds = []) {
  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  const withIndex = items.map((item, index) => ({ item, index }));

  withIndex.sort((left, right) => {
    const leftRank = rank.has(left.item.id) ? rank.get(left.item.id) : Number.MAX_SAFE_INTEGER;
    const rightRank = rank.has(right.item.id) ? rank.get(right.item.id) : Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.index - right.index;
  });

  return withIndex.map((entry) => entry.item);
}

function maskPhone(phone) {
  if (!phone || phone.length < 7) {
    return phone ?? null;
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function applyVariant(profile, experience, skills, projects, variant) {
  const headline = variant.headline_override
    ? {
        ...profile.headline,
        ...variant.headline_override
      }
    : profile.headline;
  const summary = variant.summary_override
    ? {
        ...profile.summary,
        ...variant.summary_override
      }
    : profile.summary;

  return {
    headline,
    summary,
    experience: orderByIds(experience, variant.experience_order),
    skills: orderByIds(skills, variant.skill_domain_order),
    projects: orderByIds(projects, variant.featured_project_ids),
    featuredProjects: orderByIds(
      projects.filter((project) => variant.featured_project_ids.includes(project.id)),
      variant.featured_project_ids
    )
  };
}

function enrichExperience(experience, projectsById) {
  return experience.map((item) => ({
    ...item,
    projects: item.project_refs.map((projectId) => {
      const project = projectsById.get(projectId);

      return {
        id: project.id,
        title: project.title
      };
    })
  }));
}

export async function loadContent(rootDir) {
  const contentDir = path.join(rootDir, "content");
  const profile = await readYamlFile(path.join(contentDir, "profile.yaml"));
  const experience = await readYamlFile(path.join(contentDir, "experience.yaml"));
  const skills = await readYamlFile(path.join(contentDir, "skills.yaml"));

  const variantsDir = path.join(contentDir, "variants");
  const variantEntries = await fs.readdir(variantsDir, { withFileTypes: true });
  const variants = {};

  for (const entry of variantEntries) {
    if (!entry.isFile() || !entry.name.endsWith(".yaml")) {
      continue;
    }

    const variant = await readYamlFile(path.join(variantsDir, entry.name));
    variants[variant.id] = variant;
  }

  const projects = await loadProjects(path.join(contentDir, "projects"));

  return {
    profile,
    experience: experience.items,
    skills: skills.domains,
    variants,
    projects
  };
}

export async function buildCanonicalResume({
  rootDir = process.cwd(),
  variantId = "frontend"
} = {}) {
  const content = await loadContent(rootDir);
  const variant = content.variants[variantId];

  if (!variant) {
    throw new Error(`Unknown variant: ${variantId}`);
  }

  const projectsById = new Map(content.projects.map((project) => [project.id, project]));
  const variantView = applyVariant(
    content.profile,
    content.experience,
    content.skills,
    content.projects,
    variant
  );

  return {
    basics: {
      id: content.profile.id,
      name: content.profile.name,
      displayName: content.profile.display_name,
      englishName: content.profile.english_name,
      headline: variantView.headline,
      summary: variantView.summary,
      location: content.profile.location,
      contact: content.profile.contact,
      links: content.profile.links,
      availability: content.profile.availability
    },
    branding: content.profile.branding,
    skills: variantView.skills,
    experience: enrichExperience(variantView.experience, projectsById),
    projects: variantView.projects,
    featuredProjects: variantView.featuredProjects,
    variant: {
      id: variant.id,
      label: variant.label
    },
    meta: {
      generatedAt: new Date().toISOString(),
      variant: variant.id,
      visibility: "internal"
    }
  };
}

export function buildPublicResume(canonicalResume) {
  const publicResume = structuredClone(canonicalResume);

  if (isPlainObject(publicResume.basics.contact)) {
    publicResume.basics.contact.phone = maskPhone(publicResume.basics.contact.phone);
  }

  publicResume.meta.visibility = "public";

  return publicResume;
}
