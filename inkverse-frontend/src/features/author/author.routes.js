import { FiCpu, FiDollarSign, FiFileText, FiFolder, FiGrid } from "react-icons/fi";

export function getAuthorStudioRoutes(t) {
  return [
    {
      to: "/author",
      end: true,
      label: t("author.routes.dashboard.label"),
      description: t("author.routes.dashboard.description"),
      icon: FiGrid,
    },
    {
      to: "/author/workspace",
      end: false,
      label: t("author.routes.workspace.label"),
      description: t("author.routes.workspace.description"),
      icon: FiFolder,
    },
    {
      to: "/author/income",
      end: false,
      label: t("author.routes.income.label"),
      description: t("author.routes.income.description"),
      icon: FiDollarSign,
    },
    {
      to: "/author/story-studio",
      end: false,
      label: t("author.routes.storyStudio.label"),
      description: t("author.routes.storyStudio.description"),
      icon: FiCpu,
    },
    {
      to: "/author/contract",
      end: false,
      label: t("author.routes.contract.label"),
      description: t("author.routes.contract.description"),
      icon: FiFileText,
    },
  ];
}
