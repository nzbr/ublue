import { GenericLayer } from "../lib";

export class RpmOstreeTweaksLayer extends GenericLayer {
    name = "rpm-ostree-tweaks";

    extraFiles = {
        "rpm-ostreed.conf": `
            # Entries in this file show the compile time defaults.
            # You can change settings by editing this file.
            # For option meanings, see rpm-ostreed.conf(5).

            [Daemon]
            AutomaticUpdatePolicy=check

            ##########
            # NOTE: This will be set to true by default in Spring 2025
            #
            # Set this to false to enable local layering with dnf
            # This is an unsupported configuration that can lead to upgrade issues
            # Be careful when setting this to true
            #
            # See [future link] for more information
            ##########
            # LockLayering=false  
        `,
        "org.projectatomic.rpmostree1.rules": `
            polkit.addRule(function(action, subject) {
                if ((action.id == "org.projectatomic.rpmostree1.repo-refresh" ||
                    action.id == "org.projectatomic.rpmostree1.upgrade") &&
                    subject.active == true &&
                    subject.local == true) {
                        return polkit.Result.YES;
                }
            });            
        `
    };

    installScript = `
        set -euxo pipefail

        # Disable universal-blue update, use rpm-ostreed-automatic instead
        systemctl disable uupd.timer
        systemctl enable rpm-ostreed-automatic.timer

        mv rpm-ostreed.conf /etc/

        mv org.projectatomic.rpmostree1.rules /etc/polkit-1/rules.d/

        # TODO: Enforce image signatures through /etc/containers/policy.json
    `;
}