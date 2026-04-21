import { dag, Directory } from "@dagger.io/dagger";

const gitContainer = dag.container()
    .from("docker.io/library/alpine:latest")
    .withExec(["apk", "add", "git"])
    .withExec(["adduser", "-D", "-G", "users", "-u", "1000", "-h", "/home/git", "git"])
    .withUser("git")
    .withWorkdir("/home/git")

type GitRepo = Directory & {
    repo: string,
    ref: string,
}

export function fetchGit(repo: string, ref: string, submodules: boolean = false): GitRepo {
    let container = gitContainer
        .withWorkdir("/repo")
        .withExec(["git", "init"])
        .withExec(["git", "remote", "add", "origin", repo])
        .withExec(["git", "fetch", "origin", ref])
        .withExec(["git", "checkout", "FETCH_HEAD"]);

    if (submodules) {
        container = container
	    .withExec(["git", "submodule", "update", "--init", "--recursive"]);
    }

    const r = container.directory("/repo") as GitRepo;

    r.repo = repo;
    r.ref = ref;

    return r
}
