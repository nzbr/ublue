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

export function fetchGit(repo: string, ref: string): GitRepo {
    const dir = gitContainer
        .withExec(["git", "clone", "--depth", "1", "--branch", ref, repo, "./repo"])
        .directory("./repo");

    const r = dir as GitRepo;
    r.repo = repo;
    r.ref = ref;

    return r
}
