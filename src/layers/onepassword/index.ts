import * as fs from "fs";
import * as path from "path";
import { GenericLayer, unindent } from "../../lib";

const GID_ONEPASSWORD = 1500;
const GID_ONEPASSWORDCLI = 1600;
const BROWSER_SUPPORT_PATH = "/usr/lib/1Password/1Password-BrowserSupport";

export class OnepasswordLayer extends GenericLayer {
    name = "onepassword";

    extraFiles = {
        "1password.repo": fs.readFileSync(path.resolve(import.meta.dirname, "1password.repo"), "utf-8"),
        "1password.asc": fs.readFileSync(path.resolve(import.meta.dirname, "1password.asc"), "utf-8"),
        "sysusers-onepassword.conf": unindent`
            g onepassword ${GID_ONEPASSWORD}
        `,
        "sysusers-onepassword-cli.conf": unindent`
            g onepassword-cli ${GID_ONEPASSWORDCLI}
        `,
        "tmpfiles-onepassword.conf": unindent`
            L  /opt/1Password  -  -  -  -  /usr/lib/1Password
        `,
    };

    buildScript = null;

    // Based on https://github.com/blue-build/modules/blob/main/modules/bling/installers/1password.sh
    installScript = `
        mkdir -p /var/opt

        cp "./1password.repo" /etc/yum.repos.d/1password.repo
        cp "./1password.asc" /etc/pki/rpm-gpg/RPM-GPG-KEY-1password
        rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-1password

        rpm-ostree install 1password 1password-cli

        # >>>>> Copied verbatim from the blue-build module <<<<<

        # And then we do the hacky dance!
        mv /var/opt/1Password /usr/lib/1Password # move this over here

        # Create a symlink /usr/bin/1password => /opt/1Password/1password
        rm /usr/bin/1password
        ln -s /opt/1Password/1password /usr/bin/1password

        #####
        # The following is a bastardization of "after-install.sh"
        # which is normally packaged with 1password. You can compare with
        # /usr/lib/1Password/after-install.sh if you want to see.

        cd /usr/lib/1Password

        # chrome-sandbox requires the setuid bit to be specifically set.
        # See https://github.com/electron/electron/issues/17972
        chmod 4755 /usr/lib/1Password/chrome-sandbox

        # Normally, after-install.sh would create a group,
        # "onepassword", right about now. But if we do that during
        # the ostree build it'll disappear from the running system!
        # I'm going to work around that by hardcoding GIDs and
        # crossing my fingers that nothing else steps on them.
        # These numbers _should_ be okay under normal use, but
        # if there's a more specific range that I should use here
        # please submit a PR!

        # Specifically, GID must be > 1000, and absolutely must not
        # conflict with any real groups on the deployed system.
        # Normal user group GIDs on Fedora are sequential starting
        # at 1000, so let's skip ahead and set to something higher.

        # BrowserSupport binary needs setgid. This gives no extra permissions to the binary.
        # It only hardens it against environmental tampering.

        chgrp "${GID_ONEPASSWORD}" "${BROWSER_SUPPORT_PATH}"
        chmod g+s "${BROWSER_SUPPORT_PATH}"

        # onepassword-cli also needs its own group and setgid, like the other helpers.
        chgrp "${GID_ONEPASSWORDCLI}" /usr/bin/op
        chmod g+s /usr/bin/op

        # Dynamically create the required groups via sysusers.d
        # and set the GID based on the files we just chgrp'd
        cp "/build/sysusers-onepassword.conf" /usr/lib/sysusers.d/onepassword.conf
        cp "/build/sysusers-onepassword-cli.conf" /usr/lib/sysusers.d/onepassword-cli.conf

        # remove the sysusers.d entries created by onepassword RPMs.
        # They don't magically set the GID like we need them to.
        rm -f /usr/lib/sysusers.d/30-rpmostree-pkg-group-onepassword.conf
        rm -f /usr/lib/sysusers.d/30-rpmostree-pkg-group-onepassword-cli.conf

        # Register path symlink
        # We do this via tmpfiles.d so that it is created by the live system.
        cp "/build/tmpfiles-onepassword.conf" /usr/lib/tmpfiles.d/onepassword.conf
    `;
}