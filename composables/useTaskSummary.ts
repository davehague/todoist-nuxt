import { ref } from "vue";
import { type Task } from "@/types/interfaces";

export const useTaskSummary = () => {
  const summary = ref<string>("");
  const isLoading = ref(false);
  let debounceTimer: NodeJS.Timeout;
  let lastTasksHash = ""; // Track last processed tasks

  const generateTasksHash = (projectTasks: any, nonProjectTasks: any) => {
    return JSON.stringify([
      projectTasks.map((t: { id: any }) => t.id),
      nonProjectTasks.map((t: { id: any }) => t.id),
    ]);
  };

  const generateSummary = async (
    projectTasks: any[],
    nonProjectTasks: any[],
    immediate = false
  ) => {
    // Clear any pending debounce timer
    clearTimeout(debounceTimer);

    const currentHash = generateTasksHash(projectTasks, nonProjectTasks);
    if (currentHash === lastTasksHash || isLoading.value) {
      return;
    }

    const execute = async () => {
      if (isLoading.value) return;
      isLoading.value = true;
      lastTasksHash = currentHash;

      // Create simplified versions without IDs for the AI prompt
      const simplifiedProjectTasks = projectTasks.map(
        ({ id, ...rest }) => rest
      );
      const simplifiedNonProjectTasks = nonProjectTasks.map(
        ({ id, ...rest }) => rest
      );

      try {
        const response = await fetch("/api/openrouter", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: useRuntimeConfig().public.openrouterModel,
            messages: [
              {
                role: "system",
                content: `You are a pragrmatic no-nonsense planner. Only perform the action the user specifies.  Do not add a greeting, preface, or summary of your work.
                The priority integers you will be given map like this: 4 = high priority, 3 = medium, 2 = low, and 1 = no priority
                `,
              },
              {
                role: "user",
                content: `Look at the following list of tasks that the user thinks the can do 
                today. Give your analysis of whether or not these can be done in a normal day.   
                Then, suggest a plan of action for (1) quick wins (2) Next priority tasks (3) the rest.
                Do not provide any additional commentary.
                  Project tasks: ${JSON.stringify(simplifiedProjectTasks)}. 
                  Other tasks: ${JSON.stringify(simplifiedNonProjectTasks)}`,
              },
            ],
            max_tokens: 4096,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "API request failed");
        }

        if (result.data?.choices?.[0]?.message?.content) {
          summary.value = result.data.choices[0].message.content;
        } else {
          console.error("Unexpected API response structure:", result);
          throw new Error("Invalid API response structure");
        }
      } catch (error) {
        console.error("Error generating summary:", error);
        summary.value = "Unable to generate summary at this time.";
      } finally {
        isLoading.value = false;
      }
    };

    if (immediate) {
      await execute();
    } else {
      debounceTimer = setTimeout(execute, 1000);
    }
  };

  return {
    summary,
    isLoading,
    generateSummary,
  };
};
