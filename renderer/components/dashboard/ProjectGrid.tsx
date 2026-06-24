
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { NewProjectCard } from "@/components/dashboard/NewProjectCard";
import { PROJECTS } from "@/data/mock/projects.mock";

export function ProjectGrid() {
  return (
    <div className="mt-5 grid grid-cols-3 gap-4.5">
      {PROJECTS.map((project) => (
        <ProjectCard key={project.name} project={project} />
      ))}
      <NewProjectCard />
    </div>
  );
}
