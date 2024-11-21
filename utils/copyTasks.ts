import type { Task, CompletedTask } from "~/types/interfaces";
import { useProjectStore } from "@/stores/useProjectStore";
import { useSectionStore } from "@/stores/useSectionStore";

type TaskLike = Task | CompletedTask;

export const copyTasksToClipboard = async (
  tasks: TaskLike[],
  limit?: number
) => {
  const projectStore = useProjectStore();
  const sectionStore = useSectionStore();

  const tasksToCopy = limit ? tasks.slice(0, limit) : tasks;

  const text = tasksToCopy
    .map((task) => {
      // Handle both active and completed task types
      const isCompletedTask = "task_id" in task;
      const dueStr =
        !isCompletedTask && task.due?.date
          ? `Due: ${task.due.date}`
          : "No due date specified";

      // Use task.content for name which exists in both types
      const content = task.content;
      const projectId = isCompletedTask ? task.project_id : task.project_id;
      const sectionId = isCompletedTask ? task.section_id : task.section_id;

      let sectionText = "";
      if (sectionId) {
        const sectionName = sectionStore.getSectionName(sectionId);
        sectionText = sectionName ? ` / ${sectionName}` : "";
      }

      const projectName = projectStore.getProjectName(projectId);

      return `${projectName}${sectionText} - ${content} (${dueStr})`;
    })
    .join("\n");

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
};
