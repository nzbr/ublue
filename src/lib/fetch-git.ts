import { dag, Directory } from "@dagger.io/dagger";

const gitContainer = dag.container()
    .from("docker.io/library/alpine:latest")
    .withExec(["apk", "add", "git"])
    .withExec(["adduser", "-D", "-G", "users", "-u", "1000", "-h", "/home/git", "git"])
    .withUser("git")
    .withWorkdir("/home/git")

export function fetchGit(repo: string, ref: string): Directory {
    return gitContainer
        .withExec(["git", "clone", "--depth", "1", "--branch", ref, repo, "./repo"])
        .directory("./repo")
}