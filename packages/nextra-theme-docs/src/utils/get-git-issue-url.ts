import gitUrlParse from "git-url-parse";

const getGitIssueUrl = ({ repository = "", title, labels }: { repository?: string; title: string; labels?: string }): string => {
    const repo = gitUrlParse(repository);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!repo) {
        throw new Error("Invalid `docsRepositoryBase` URL!");
    }

    if (repo.resource.includes("gitlab")) {
        return `${repo.protocol}://${repo.resource}/${repo.owner}/${repo.name}/-/issues/new?issue[title]=${encodeURIComponent(title)}`;
    }

    if (repo.resource.includes("github")) {
        return `${repo.protocol}://${repo.resource}/${repo.owner}/${repo.name}/issues/new?title=${encodeURIComponent(title)}&labels=${labels ?? ""}`;
    }

    return "#";
};

export default getGitIssueUrl;
