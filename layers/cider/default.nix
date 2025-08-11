{ ... }:
{
  name = "Cider";

  build = ''
    cp ${./cidercollective.repo} ./cidercollective.repo
    cp ${./cidercollective.asc} ./cidercollective.asc
  '';

  install = ''
    cp "./cidercollective.repo" /etc/yum.repos.d/cidercollective.repo
    cp "./cidercollective.asc" /etc/pki/rpm-gpg/RPM-GPG-KEY-cidercollective
    rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-cidercollective

    rpm-ostree install Cider
  '';
}
