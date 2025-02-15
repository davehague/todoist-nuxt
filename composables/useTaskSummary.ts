import { ref } from "vue";
import { type Task } from "@/types/interfaces";

export const useTaskSummary = () => {
  const summary = ref<string>("");
  const isLoading = ref(false);
  let debounceTimer: NodeJS.Timeout;
  let lastTasksHash = ""; // Track last processed tasks

  const generateTasksHash = (projectTasks: Task[], nonProjectTasks: Task[]) => {
    return JSON.stringify([
      projectTasks.map((t) => t.id),
      nonProjectTasks.map((t) => t.id),
    ]);
  };

  const generateSummary = async (
    projectTasks: Task[],
    nonProjectTasks: Task[],
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
                content:
                  "Only perform the action the user specifies.  Do not add a greeting, preface, or summary of your work. Use only plain text in your responses.",
              },
              {
                role: "user",
                content: `You are an assistant with a critical eye toward whether or not a user 
                can achieve what they've set out to do in a given day.  The following is a list of tasks that the user thinks the can do 
                today. Give your analysis of whether or not these can be done in a normal day.   Speak directly to the user
                in your response.  Be kind but firm.
                  Project tasks: ${JSON.stringify(projectTasks)}. 
                  Other tasks: ${JSON.stringify(nonProjectTasks)}`,
              },
            ],
            max_tokens: 250,
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
