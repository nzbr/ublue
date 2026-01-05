import { Container, dag, Directory } from "@dagger.io/dagger";
import { unindent } from "./unindent";

export interface MkRpmArgs {
    name: string;
    version: string;
    arch?: string;
    license?: string;
    description?: string;
    requires?: string[];

    specfile?: string;
}

export const mkRPM = (container: Container) => async (args: MkRpmArgs, contents: Directory) => {
    if (!args.arch) {
        args.arch = (await container.withExec(["uname", "-m"]).stdout()).trim();
    }

    const specfile = args.specfile ?? unindent`
        AutoReqProv: no

        Name: ${args.name}
        Version: ${args.version}
        Release: 1%{?dist}
        BuildArch: ${args.arch}
        Summary: ${args.name}
        License: ${args.license ?? "Unknown"}
        ${args.requires ? `Requires: ${args.requires.join(", ")}` : ""}

        %description
        ${args.description ?? args.name}

        %install
        export QA_RPATHS=0x0030
        rm -rf $RPM_BUILD_ROOT
        mkdir -p $RPM_BUILD_ROOT
        cp -vr %{_sourcedir}/${args.name}/. $RPM_BUILD_ROOT

        %clean
        rm -rf $RPM_BUILD_ROOT

        %files
    `;

    const workspace = dag.directory()
        .withNewDirectory("BUILD", { permissions: 0o755 })
        .withNewDirectory("BUILDROOT", { permissions: 0o755 })
        .withNewDirectory("RPMS", { permissions: 0o755 })
        .withNewDirectory("SOURCES", { permissions: 0o755 })
        .withNewDirectory("SPECS", { permissions: 0o755 })
        .withNewDirectory("SRPMS", { permissions: 0o755 })
        .withNewFile(`SPECS/${args.name}.spec`, specfile, { permissions: 0o644 })
        ;

    const user = "rpmbuild";
    const group = "rpmbuild";
    const shell = "/bin/bash";
    const home = `/home/${user}`;

    return container
        .withExec(["dnf", "install", "-y", "rpm-build"])
        .withDirectory("/home", dag.directory())
        .withExec(["sh", "-c", `getent group ${group} || groupadd ${group}`])
        .withExec(["sh", "-c", `getent passwd ${user} && usermod --shell ${shell} --home ${home} ${user} || useradd --gid ${group} --shell ${shell} --home-dir ${home} --create-home ${user}`])
        .withUser(user)
        .withMountedDirectory(`${home}/rpmbuild`, workspace, { owner: `${user}:${group}` })
        .withMountedDirectory(`${home}/rpmbuild/SOURCES/${args.name}`, contents)
        .withWorkdir(`${home}/rpmbuild/SOURCES/${args.name}`)
        .withExec(["sh", "-c", `find . -not -type d | sed 's/^\\.//' >> ${home}/rpmbuild/SPECS/${args.name}.spec`])
        .withWorkdir(home)
        .withExec(["rpmbuild", "-bb", `rpmbuild/SPECS/${args.name}.spec`])
        .withExec(["sh", "-c", `mv rpmbuild/RPMS/${args.arch}/*.rpm ${args.name}-${args.version}.${args.arch}.rpm`])
        .file(`${args.name}-${args.version}.${args.arch}.rpm`);

}
