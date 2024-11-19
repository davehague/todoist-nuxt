// composables/useTodoist.ts
import { ref, computed } from "vue";
import type { Task, Project, Section, RawTask } from "~/types/interfaces";
import { TodoistApi } from "@doist/todoist-api-typescript";

export const useTodoist = () => {
  const tasks = ref<Task[]>([]);
  const completedTasks = ref<Task[]>([]);

  const filteredTasks = ref<Task[]>([]);
  const isLoading = ref(false);
  const showTokenInput = ref(false);
  const apiToken = useState<string>("todoistToken", () => "");
  const searchQuery = ref("");

  // Secure storage implementation
  const setSecureItem = async (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  };

  const getSecureItem = async (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("Error reading from storage:", error);
      return null;
    }
  };

  const removeSecureItem = async (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from storage:", error);
    }
  };

  const filterSettings = ref({
    dueFilter: "all",
    label: "",
    sort: "created_desc",
    projectSection: "",
  });

  const sortedTasks = computed(() => {
    let filtered = filteredTasks.value;

    // Apply project and section filter
    if (filterSettings.value.projectSection) {
      const [project, section] =
        filterSettings.value.projectSection.split(" > ");
      filtered = filtered.filter((task) => {
        if (section) {
          return task.project_name === project && task.section_name === section;
        }
        return task.project_name === project;
      });
    }

    // Apply due date filter
    if (filterSettings.value.dueFilter !== "all") {
      const today = new Date().toISOString().split("T")[0];
      filtered = filtered.filter((task) => {
        switch (filterSettings.value.dueFilter) {
          case "today":
            return task.due?.date && task.due.date <= today;
          case "has_due":
            return !!task.due;
          case "no_due":
            return !task.due;
          default:
            return true;
        }
      });
    }

    // Apply label filter
    if (filterSettings.value.label) {
      filtered = filtered.filter((task) =>
        task.labels?.includes(filterSettings.value.label)
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (filterSettings.value.sort) {
        case "due_asc":
          return (a.due?.date || "9999") > (b.due?.date || "9999") ? 1 : -1;
        case "due_desc":
          return (a.due?.date || "9999") < (b.due?.date || "9999") ? 1 : -1;
        case "created_asc":
          return a.created_at > b.created_at ? 1 : -1;
        case "created_desc":
          return a.created_at < b.created_at ? 1 : -1;
        case "project":
          return a.project_name.localeCompare(b.project_name);
        case "content":
          return a.content.localeCompare(b.content);
        default:
          return 0;
      }
    });
  });

  const handleSearch = () => {
    const query = searchQuery.value.toLowerCase();
    filteredTasks.value = tasks.value.filter(
      (task) =>
        task.content.toLowerCase().includes(query) ||
        task.project_name.toLowerCase().includes(query) ||
        (task.section_name?.toLowerCase().includes(query) ?? false) ||
        (task.due?.date || "").includes(query)
    );
  };

  const clearSearch = () => {
    searchQuery.value = "";
    handleSearch();
  };

  const handleChangeToken = async () => {
    if (
      confirm(
        "Are you sure you want to change the API token? This will clear your current view."
      )
    ) {
      showTokenInput.value = true;
      tasks.value = [];
      filteredTasks.value = [];
      apiToken.value = "";
      await removeSecureItem("api_token");
    }
  };

  const copyToClipboard = async (event: MouseEvent, limit?: number) => {
    event.preventDefault();
    const tasksToCopy = limit
      ? filteredTasks.value.slice(0, limit)
      : filteredTasks.value;
    const text = tasksToCopy
      .map((task: Task) => {
        const dueStr = task.due ? task.due.date : "No due date";
        const createdStr = task.created_at
          ? new Date(task.created_at).toLocaleDateString()
          : "Unknown";
        return `${task.content} | Created: ${createdStr} |  Due: ${dueStr}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const fetchCompletedTasks = async () => {
    if (!apiToken.value) return;

    isLoading.value = true;
    try {
      const response = await fetch(
        "https://api.todoist.com/sync/v9/completed/get_all",
        {
          headers: {
            Authorization: `Bearer ${apiToken.value}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Completed tasks:", data.items);

      completedTasks.value = data.items;
    } catch (error) {
      console.error("Error fetching completed tasks:", error);
      alert("Error fetching completed tasks. Please check your API token.");
      await removeSecureItem("api_token");
    } finally {
      isLoading.value = false;
    }
  };

  const fetchTasks = async () => {
    if (!apiToken.value) return;

    isLoading.value = true;
    try {
      // Save the API token securely
      await setSecureItem("api_token", apiToken.value);

      // Fetch projects, sections, and tasks in parallel with proper typing
      const [projects, sections, rawTasks] = await Promise.all([
        $fetch<Project[]>("https://api.todoist.com/rest/v2/projects", {
          headers: { Authorization: `Bearer ${apiToken.value}` },
        }),
        $fetch<Section[]>("https://api.todoist.com/rest/v2/sections", {
          headers: { Authorization: `Bearer ${apiToken.value}` },
        }),
        $fetch<RawTask[]>("https://api.todoist.com/rest/v2/tasks", {
          headers: { Authorization: `Bearer ${apiToken.value}` },
        }),
      ]);

      const projectMap = Object.fromEntries(
        projects.map((p) => [p.id, p.name])
      );
      const sectionMap = Object.fromEntries(
        sections.map((s) => [s.id, s.name])
      );

      tasks.value = rawTasks.map(
        (task): Task => ({
          ...task,
          project_name: projectMap[task.project_id] || "No Project",
          section_name: sectionMap[task.section_id] || "No Section",
        })
      );

      filteredTasks.value = tasks.value;
      showTokenInput.value = false;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      alert("Error fetching tasks. Please check your API token.");
      await removeSecureItem("api_token");
    } finally {
      isLoading.value = false;
    }
  };

  const updateFilters = (filters: {
    dueFilter: string;
    label: string;
    sort: string;
    projectSection: string;
  }) => {
    filterSettings.value = filters;
  };

  // Initialize on mount
  onMounted(async () => {
    const savedToken = await getSecureItem("api_token");
    if (savedToken) {
      apiToken.value = savedToken;
      await fetchTasks();
    }
  });

  // Watch for search query changes
  watch(searchQuery, handleSearch);

  return {
    tasks,
    completedTasks,
    filteredTasks,
    sortedTasks,
    isLoading,
    apiToken,
    searchQuery,
    showTokenInput,
    filterSettings,
    fetchTasks,
    fetchCompletedTasks,
    handleSearch,
    clearSearch,
    handleChangeToken,
    copyToClipboard,
    updateFilters,
  };
};
