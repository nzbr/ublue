import { dag, Directory } from "@dagger.io/dagger";

type GitRepo = Directory & {
    repo: string;
    ref: string;
};

export function fetchGit(
    repo: string,
    ref: string,
    discardGitDir: boolean = true,
    depth: number = 1,
    submodules: boolean = false,
): GitRepo {
    let tree = dag.git(repo).ref(ref).tree({ discardGitDir, depth });
    const r = tree as GitRepo;

    r.repo = repo;
    r.ref = ref;

    return r;
}
