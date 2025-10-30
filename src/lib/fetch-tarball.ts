import { Container } from "@dagger.io/dagger";

export const fetchTarball = (container: Container) => (url: string) => {
    const basename = url.split("/").at(-1);
    if (!basename) {
        throw new Error(`No file name found in URL: ${url}`);
    }

    const ext = basename.split(".").at(-1);
    if (!ext) {
        throw new Error(`No file extension found in URL: ${url}`);
    }

    const download = container.withWorkdir("/dl").withExec(["curl", "-L", "-o", basename, url]).withWorkdir("/unpack");

    let unpacked;
    switch (ext) {
        case "tar":
            unpacked = download.withExec(["tar", "-xvf", `/dl/${basename}`]);
            break;
        case "gz":
        case "tgz":
            unpacked = download.withExec(["tar", "-I", "pigz", "-xvf", `/dl/${basename}`]);
            break;
        case "bz2":
            unpacked = download.withExec(["tar", "-xvjf", `/dl/${basename}`]);
            break;
        case "xz":
        case "txz":
            unpacked = download.withExec(["tar", "-xvJf", `/dl/${basename}`]);
            break;
        case "zst":
            unpacked = download.withExec(["tar", "--zstd", "-xvf", `/dl/${basename}`]);
            break;
        case "zip":
            unpacked = download.withExec(["unzip", `/dl/${basename}`]);
            break;
        default:
            throw new Error(`Unsupported extension: ${ext}`);
    }
    return unpacked.directory("/unpack");
}